"""
Job Results Processor Service

This service processes optimization results from the queue and saves them to the database.
It maps the optimization model's output format to the database schema.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Dict, Any, List
import logging
import uuid

logger = logging.getLogger(__name__)


class JobResultsProcessor:
    """Processes and saves optimization results to database"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def process_optimization_result(self, result: Dict[str, Any]) -> bool:
        """
        Process optimization result and save to database
        
        Args:
            result: Optimization result from queue containing:
                - request_id: Request ID
                - job_id: Job ID 
                - status: 'success' or 'failed'
                - results: Optimization results data
                - error_message: Error message if failed
                
        Returns:
            True if processed successfully, False otherwise
        """
        try:
            job_id = result.get('job_id')
            status = result.get('status', 'unknown')
            
            if not job_id:
                logger.error("No job_id in optimization result")
                return False
            
            if status == 'success':
                optimization_results = result.get('results', {})
                await self._save_successful_results(job_id, optimization_results)
                
                # Update job status to completed
                await self.db.execute(text("""
                    UPDATE jobs 
                    SET status = 'completed', 
                        completed_at = now(),
                        result_summary = :result_summary,
                        result_bundle = :result_bundle,
                        solver_status = :solver_status
                    WHERE id = :job_id
                """), {
                    "job_id": job_id,
                    "result_summary": optimization_results.get('summary', {}),
                    "result_bundle": optimization_results,
                    "solver_status": optimization_results.get('solver_status', {})
                })
                
            else:
                # Handle failed optimization
                error_message = result.get('error_message', 'Unknown optimization error')
                await self.db.execute(text("""
                    UPDATE jobs 
                    SET status = 'failed', 
                        completed_at = now(),
                        error_message = :error_message
                    WHERE id = :job_id
                """), {
                    "job_id": job_id,
                    "error_message": error_message
                })
            
            await self.db.commit()
            logger.info(f"Successfully processed optimization result for job {job_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error processing optimization result: {e}")
            await self.db.rollback()
            return False
    
    async def _save_successful_results(self, job_id: str, results: Dict[str, Any]):
        """Save successful optimization results to database tables"""
        
        # Clear existing results for this job (in case of rerun)
        await self._clear_existing_results(job_id)
        
        # Save summary
        await self._save_summary(job_id, results.get('summary', {}))
        
        # Save schedule
        await self._save_schedule(job_id, results.get('schedule', []))
        
        # Save outputs
        await self._save_outputs(job_id, results.get('outputs', []))
        
        # Save substitutes
        await self._save_substitutes(job_id, results.get('substitutes', []))
        
        # Save items
        await self._save_items(job_id, results.get('items', []))
        
        # Save substitute breakdown
        summary = results.get('summary', {})
        substitute_breakdown = summary.get('substitute_breakdown', {})
        await self._save_substitute_breakdown(job_id, substitute_breakdown)
        
        # Save weight loss
        carried_weight_loss = summary.get('carried_weight_loss_by_item', {})
        await self._save_weight_loss(job_id, carried_weight_loss)
    
    async def _clear_existing_results(self, job_id: str):
        """Clear existing results for a job"""
        tables = [
            'job_result_summary',
            'job_result_schedule', 
            'job_result_outputs',
            'job_result_substitutes',
            'job_result_items',
            'job_result_substitute_breakdown',
            'job_result_weight_loss'
        ]
        
        for table in tables:
            await self.db.execute(text(f"DELETE FROM {table} WHERE job_id = :job_id"), {"job_id": job_id})
    
    async def _save_summary(self, job_id: str, summary: Dict[str, Any]):
        """Save job result summary"""
        if not summary:
            return
        
        await self.db.execute(text("""
            INSERT INTO job_result_summary (
                job_id, objective_value, total_processed_kg, total_output_produced_kg,
                total_substitutes_made, total_initial_carriage_weight, 
                total_final_carriage_weight, total_carried_weight_loss
            ) VALUES (
                :job_id, :objective_value, :total_processed_kg, :total_output_produced_kg,
                :total_substitutes_made, :total_initial_carriage_weight,
                :total_final_carriage_weight, :total_carried_weight_loss
            )
        """), {
            "job_id": job_id,
            "objective_value": summary.get('objective_value', 0),
            "total_processed_kg": summary.get('total_processed_kg', 0),
            "total_output_produced_kg": summary.get('total_output_produced_kg', 0),
            "total_substitutes_made": summary.get('total_substitutes_made', 0),
            "total_initial_carriage_weight": summary.get('total_initial_carriage_weight', 0),
            "total_final_carriage_weight": summary.get('total_final_carriage_weight', 0),
            "total_carried_weight_loss": summary.get('total_carried_weight_loss', 0)
        })
    
    async def _save_schedule(self, job_id: str, schedule: List[Dict[str, Any]]):
        """Save job result schedule"""
        for week_data in schedule:
            week = week_data.get('week')
            methods = week_data.get('methods', {})
            
            for method_key, method_data in methods.items():
                # Get method and recipe IDs
                method_recipe_ids = await self._get_method_recipe_ids(job_id, method_key)
                
                for recipe_id in method_recipe_ids:
                    await self.db.execute(text("""
                        INSERT INTO job_result_schedule (
                            job_id, week, recipe_id, processed_kg, is_running, materials_processed
                        ) VALUES (
                            :job_id, :week, :recipe_id, :processed_kg, :is_running, :materials_processed
                        )
                    """), {
                        "job_id": job_id,
                        "week": week,
                        "recipe_id": recipe_id,
                        "processed_kg": method_data.get('processed_kg', 0),
                        "is_running": method_data.get('is_running', 0) == 1,
                        "materials_processed": method_data.get('by_material', {})
                    })
    
    async def _save_outputs(self, job_id: str, outputs: List[Dict[str, Any]]):
        """Save job result outputs"""
        for output_data in outputs:
            output_key = output_data.get('output')
            weeks_data = output_data.get('weeks', [])
            
            # Get output ID
            output_id = await self._get_entity_id('outputs_global', output_key)
            if not output_id:
                continue
            
            for week_data in weeks_data:
                await self.db.execute(text("""
                    INSERT INTO job_result_outputs (
                        job_id, output_id, week, produced_kg, inventory_kg
                    ) VALUES (
                        :job_id, :output_id, :week, :produced_kg, :inventory_kg
                    )
                """), {
                    "job_id": job_id,
                    "output_id": output_id,
                    "week": week_data.get('week'),
                    "produced_kg": week_data.get('produced_kg', 0),
                    "inventory_kg": week_data.get('inventory_kg', 0)
                })
    
    async def _save_substitutes(self, job_id: str, substitutes: List[Dict[str, Any]]):
        """Save job result substitutes"""
        for substitute_data in substitutes:
            substitute_key = substitute_data.get('substitute')
            weeks_data = substitute_data.get('weeks', [])
            
            # Get substitute ID
            substitute_id = await self._get_entity_id('substitutes_global', substitute_key)
            if not substitute_id:
                continue
            
            for week_data in weeks_data:
                await self.db.execute(text("""
                    INSERT INTO job_result_substitutes (
                        job_id, substitute_id, week, made, inventory, used_for_items
                    ) VALUES (
                        :job_id, :substitute_id, :week, :made, :inventory, :used_for_items
                    )
                """), {
                    "job_id": job_id,
                    "substitute_id": substitute_id,
                    "week": week_data.get('week'),
                    "made": week_data.get('made', 0),
                    "inventory": week_data.get('inventory', 0),
                    "used_for_items": week_data.get('used_for', {})
                })
    
    async def _save_items(self, job_id: str, items: List[Dict[str, Any]]):
        """Save job result items"""
        for item_data in items:
            item_key = item_data.get('item')
            weeks_data = item_data.get('weeks', [])
            
            # Get item ID
            item_id = await self._get_entity_id('items_global', item_key)
            if not item_id:
                continue
            
            for week_data in weeks_data:
                await self.db.execute(text("""
                    INSERT INTO job_result_items (
                        job_id, item_id, week, used_total, used_carried, shortage
                    ) VALUES (
                        :job_id, :item_id, :week, :used_total, :used_carried, :shortage
                    )
                """), {
                    "job_id": job_id,
                    "item_id": item_id,
                    "week": week_data.get('week'),
                    "used_total": week_data.get('used_total', 0),
                    "used_carried": week_data.get('used_carried', 0),
                    "shortage": week_data.get('shortage', 0)
                })
    
    async def _save_substitute_breakdown(self, job_id: str, breakdown: Dict[str, Any]):
        """Save substitute breakdown totals"""
        for substitute_key, total_made in breakdown.items():
            # Get substitute ID
            substitute_id = await self._get_entity_id('substitutes_global', substitute_key)
            if not substitute_id:
                continue
            
            await self.db.execute(text("""
                INSERT INTO job_result_substitute_breakdown (
                    job_id, substitute_id, total_made
                ) VALUES (
                    :job_id, :substitute_id, :total_made
                )
            """), {
                "job_id": job_id,
                "substitute_id": substitute_id,
                "total_made": total_made
            })
    
    async def _save_weight_loss(self, job_id: str, weight_loss: Dict[str, Any]):
        """Save weight loss data"""
        for item_key, loss_data in weight_loss.items():
            # Get item ID
            item_id = await self._get_entity_id('items_global', item_key)
            if not item_id:
                continue
            
            await self.db.execute(text("""
                INSERT INTO job_result_weight_loss (
                    job_id, item_id, initial_units, units_used, final_units,
                    mass_per_unit, initial_weight, final_weight, total_weight_loss
                ) VALUES (
                    :job_id, :item_id, :initial_units, :units_used, :final_units,
                    :mass_per_unit, :initial_weight, :final_weight, :total_weight_loss
                )
            """), {
                "job_id": job_id,
                "item_id": item_id,
                "initial_units": loss_data.get('initial_units', 0),
                "units_used": loss_data.get('units_used', 0),
                "final_units": loss_data.get('final_units', 0),
                "mass_per_unit": loss_data.get('mass_per_unit', 0),
                "initial_weight": loss_data.get('initial_weight', 0),
                "final_weight": loss_data.get('final_weight', 0),
                "total_weight_loss": loss_data.get('total_weight_loss', 0)
            })
    
    async def _get_entity_id(self, table: str, key: str) -> str:
        """Get entity ID by key from global table"""
        rs = await self.db.execute(
            text(f"SELECT id FROM {table} WHERE key = :key"),
            {"key": key}
        )
        result = rs.mappings().first()
        return result['id'] if result else None
    
    async def _get_method_recipe_ids(self, job_id: str, method_key: str) -> List[str]:
        """Get recipe IDs for a method used in this job"""
        rs = await self.db.execute(text("""
            SELECT DISTINCT r.id
            FROM job_enabled_methods jem
            JOIN job_enabled_materials jema ON jem.job_id = jema.job_id
            JOIN recipes_global r ON r.method_id = jem.method_id AND r.material_id = jema.material_id
            JOIN methods_global m ON m.id = jem.method_id
            WHERE jem.job_id = :job_id AND m.key = :method_key
        """), {"job_id": job_id, "method_key": method_key})
        
        return [row['id'] for row in rs.mappings().all()]
