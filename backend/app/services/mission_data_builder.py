"""
Mission Data Builder Service

This service builds optimization data from the database using the new schema.
It queries all necessary tables and transforms the data into the format expected by the optimization model.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Dict, List, Any, Tuple
import logging

logger = logging.getLogger(__name__)


class MissionDataBuilder:
    """Builds mission data for optimization from database using IDs instead of names"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def build_mission_data(self, job_id: str) -> Dict[str, Any]:
        """
        Build complete mission data for optimization from job configuration
        
        Args:
            job_id: The job ID to build data for
            
        Returns:
            Dictionary containing all optimization data with entity keys (not names)
        """
        logger.info(f"Building mission data for job {job_id}")
        
        # Get job details
        job_data = await self._get_job_data(job_id)
        if not job_data:
            raise ValueError(f"Job {job_id} not found")
        
        # Build the complete mission data structure
        mission_data = {
            # Core entity lists (using keys, not names)
            'materials': await self._get_enabled_entity_keys(job_id, 'materials'),
            'methods': await self._get_enabled_entity_keys(job_id, 'methods'),
            'outputs': await self._get_enabled_entity_keys(job_id, 'outputs'),
            'items': await self._get_enabled_entity_keys(job_id, 'items'),
            'substitutes': await self._get_enabled_entity_keys(job_id, 'substitutes'),
            'weeks': list(range(1, job_data['total_weeks'] + 1)),
            
            # Recipe-based production data
            'yields': await self._get_recipe_yields(job_id),
            'crew_cost': await self._get_recipe_costs(job_id, 'crew_cost_per_kg'),
            'energy_cost': await self._get_recipe_costs(job_id, 'energy_cost_kwh_per_kg'),
            'risk_cost': await self._get_recipe_costs(job_id, 'risk_cost'),
            
            # Initial inventories
            'initial_inventory': await self._get_initial_inventories(job_id),
            
            # Item properties (from global tables)
            'item_lifetime': await self._get_item_properties(job_id, 'lifetime_weeks'),
            'item_mass': await self._get_item_properties(job_id, 'mass_per_unit'),
            'item_waste': await self._get_item_waste(job_id),
            
            # Substitute properties
            'substitute_lifetime': await self._get_substitute_properties(job_id, 'lifetime_weeks'),
            'substitute_values': await self._get_substitute_properties(job_id, 'value_per_unit'),
            'substitute_waste': await self._get_substitute_waste(job_id),
            'substitute_make_recipe': await self._get_substitute_recipes(job_id),
            'substitutes_can_replace': await self._get_substitute_replacements(job_id),
            
            # Demands and deadlines
            'item_demands': await self._get_item_demands(job_id),
            'deadlines': await self._get_deadlines(job_id),
            
            # Resource constraints
            'max_capacity': await self._get_method_capacity(job_id),
            'availability': await self._get_method_availability(job_id),
            'crew_available': await self._get_weekly_resources(job_id, 'crew_available'),
            'energy_available': await self._get_weekly_resources(job_id, 'energy_available'),
            
            # Capacity constraints (from global tables)
            'output_capacity': await self._get_output_capacities(job_id),
            'input_capacity': await self._get_input_capacities(job_id),
            
            # Method properties
            'min_lot_size': await self._get_method_properties(job_id, 'min_lot_size'),
            'output_values': await self._get_output_values(job_id),
            
            # Optimization weights (from job)
            'weights': {
                'mass': job_data['w_mass'],
                'value': job_data['w_value'],
                'crew': job_data['w_crew'],
                'energy': job_data['w_energy'],
                'risk': job_data['w_risk'],
                'make': job_data['w_make'],
                'carry': job_data['w_carry'],
                'shortage': job_data['w_shortage']
            }
        }
        
        logger.info(f"Successfully built mission data for job {job_id}")
        return mission_data
    
    async def _get_job_data(self, job_id: str) -> Dict[str, Any]:
        """Get job basic data"""
        rs = await self.db.execute(text("""
            SELECT total_weeks, w_mass, w_value, w_crew, w_energy, w_risk, w_make, w_carry, w_shortage
            FROM jobs WHERE id = :job_id
        """), {"job_id": job_id})
        result = rs.mappings().first()
        return dict(result) if result else None
    
    async def _get_enabled_entity_keys(self, job_id: str, entity_type: str) -> List[str]:
        """Get enabled entity keys for a job"""
        table_map = {
            'materials': ('job_enabled_materials', 'material_id', 'materials_global'),
            'methods': ('job_enabled_methods', 'method_id', 'methods_global'),
            'outputs': ('job_enabled_outputs', 'output_id', 'outputs_global'),
            'items': ('job_enabled_items', 'item_id', 'items_global'),
            'substitutes': ('job_enabled_substitutes', 'substitute_id', 'substitutes_global')
        }
        
        if entity_type not in table_map:
            return []
        
        enabled_table, id_field, global_table = table_map[entity_type]
        
        rs = await self.db.execute(text(f"""
            SELECT g.key
            FROM {enabled_table} e
            JOIN {global_table} g ON e.{id_field} = g.id
            WHERE e.job_id = :job_id
            ORDER BY g.key
        """), {"job_id": job_id})
        
        return [row['key'] for row in rs.mappings().all()]
    
    async def _get_recipe_yields(self, job_id: str) -> Dict[Tuple[str, str, str], float]:
        """Get recipe yields as (material_key, method_key, output_key) -> yield_ratio"""
        rs = await self.db.execute(text("""
            SELECT m.key as material_key, mt.key as method_key, o.key as output_key, ro.yield_ratio
            FROM job_enabled_materials jem
            JOIN job_enabled_methods jemt ON jem.job_id = jemt.job_id
            JOIN job_enabled_outputs jeo ON jem.job_id = jeo.job_id
            JOIN recipes_global r ON r.material_id = jem.material_id AND r.method_id = jemt.method_id
            JOIN recipe_outputs_global ro ON ro.recipe_id = r.id AND ro.output_id = jeo.output_id
            JOIN materials_global m ON m.id = jem.material_id
            JOIN methods_global mt ON mt.id = jemt.method_id
            JOIN outputs_global o ON o.id = jeo.output_id
            WHERE jem.job_id = :job_id
        """), {"job_id": job_id})
        
        yields = {}
        for row in rs.mappings().all():
            key = (row['material_key'], row['method_key'], row['output_key'])
            yields[key] = float(row['yield_ratio'])
        
        return yields
    
    async def _get_recipe_costs(self, job_id: str, cost_field: str) -> Dict[str, float]:
        """Get recipe costs by method key"""
        rs = await self.db.execute(text(f"""
            SELECT mt.key as method_key, AVG(r.{cost_field}) as avg_cost
            FROM job_enabled_methods jem
            JOIN job_enabled_materials jemt ON jem.job_id = jemt.job_id
            JOIN recipes_global r ON r.method_id = jem.method_id AND r.material_id = jemt.material_id
            JOIN methods_global mt ON mt.id = jem.method_id
            WHERE jem.job_id = :job_id
            GROUP BY mt.key
        """), {"job_id": job_id})
        
        costs = {}
        for row in rs.mappings().all():
            costs[row['method_key']] = float(row['avg_cost'])
        
        return costs
    
    async def _get_initial_inventories(self, job_id: str) -> Dict[str, Dict[str, float]]:
        """Get initial inventories for all entity types"""
        inventories = {
            'materials': {},
            'outputs': {},
            'items': {},
            'substitutes': {}
        }
        
        # Material inventory
        rs = await self.db.execute(text("""
            SELECT m.key, jmi.qty_kg
            FROM job_material_inventory jmi
            JOIN materials_global m ON m.id = jmi.material_id
            WHERE jmi.job_id = :job_id
        """), {"job_id": job_id})
        for row in rs.mappings().all():
            inventories['materials'][row['key']] = float(row['qty_kg'])
        
        # Output inventory
        rs = await self.db.execute(text("""
            SELECT o.key, joi.qty_kg
            FROM job_output_inventory joi
            JOIN outputs_global o ON o.id = joi.output_id
            WHERE joi.job_id = :job_id
        """), {"job_id": job_id})
        for row in rs.mappings().all():
            inventories['outputs'][row['key']] = float(row['qty_kg'])
        
        # Item inventory
        rs = await self.db.execute(text("""
            SELECT i.key, jii.qty_units
            FROM job_item_inventory jii
            JOIN items_global i ON i.id = jii.item_id
            WHERE jii.job_id = :job_id
        """), {"job_id": job_id})
        for row in rs.mappings().all():
            inventories['items'][row['key']] = float(row['qty_units'])
        
        # Substitute inventory
        rs = await self.db.execute(text("""
            SELECT s.key, jsi.qty_units
            FROM job_substitute_inventory jsi
            JOIN substitutes_global s ON s.id = jsi.substitute_id
            WHERE jsi.job_id = :job_id
        """), {"job_id": job_id})
        for row in rs.mappings().all():
            inventories['substitutes'][row['key']] = float(row['qty_units'])
        
        return inventories
    
    async def _get_item_properties(self, job_id: str, property_field: str) -> Dict[str, float]:
        """Get item properties by key"""
        rs = await self.db.execute(text(f"""
            SELECT i.key, i.{property_field}
            FROM job_enabled_items jei
            JOIN items_global i ON i.id = jei.item_id
            WHERE jei.job_id = :job_id
        """), {"job_id": job_id})
        
        properties = {}
        for row in rs.mappings().all():
            properties[row['key']] = float(row[property_field])
        
        return properties
    
    async def _get_substitute_properties(self, job_id: str, property_field: str) -> Dict[str, float]:
        """Get substitute properties by key"""
        rs = await self.db.execute(text(f"""
            SELECT s.key, s.{property_field}
            FROM job_enabled_substitutes jes
            JOIN substitutes_global s ON s.id = jes.substitute_id
            WHERE jes.job_id = :job_id
        """), {"job_id": job_id})
        
        properties = {}
        for row in rs.mappings().all():
            properties[row['key']] = float(row[property_field])
        
        return properties
    
    async def _get_item_waste(self, job_id: str) -> Dict[Tuple[str, str], float]:
        """Get item waste as (item_key, material_key) -> waste_per_unit"""
        rs = await self.db.execute(text("""
            SELECT i.key as item_key, m.key as material_key, iw.waste_per_unit
            FROM job_enabled_items jei
            JOIN item_waste_global iw ON iw.item_id = jei.item_id
            JOIN items_global i ON i.id = jei.item_id
            JOIN materials_global m ON m.id = iw.material_id
            WHERE jei.job_id = :job_id
        """), {"job_id": job_id})
        
        waste = {}
        for row in rs.mappings().all():
            key = (row['item_key'], row['material_key'])
            waste[key] = float(row['waste_per_unit'])
        
        return waste
    
    async def _get_substitute_waste(self, job_id: str) -> Dict[Tuple[str, str], float]:
        """Get substitute waste as (substitute_key, material_key) -> waste_per_unit"""
        rs = await self.db.execute(text("""
            SELECT s.key as substitute_key, m.key as material_key, sw.waste_per_unit
            FROM job_enabled_substitutes jes
            JOIN substitute_waste_global sw ON sw.substitute_id = jes.substitute_id
            JOIN substitutes_global s ON s.id = jes.substitute_id
            JOIN materials_global m ON m.id = sw.material_id
            WHERE jes.job_id = :job_id
        """), {"job_id": job_id})
        
        waste = {}
        for row in rs.mappings().all():
            key = (row['substitute_key'], row['material_key'])
            waste[key] = float(row['waste_per_unit'])
        
        return waste
    
    async def _get_substitute_recipes(self, job_id: str) -> Dict[Tuple[str, str], float]:
        """Get substitute recipes as (substitute_key, output_key) -> ratio"""
        rs = await self.db.execute(text("""
            SELECT s.key as substitute_key, o.key as output_key, sr.ratio_output_per_substitute
            FROM job_enabled_substitutes jes
            JOIN substitute_recipes_global sr ON sr.substitute_id = jes.substitute_id
            JOIN substitutes_global s ON s.id = jes.substitute_id
            JOIN outputs_global o ON o.id = sr.output_id
            WHERE jes.job_id = :job_id
        """), {"job_id": job_id})
        
        recipes = {}
        for row in rs.mappings().all():
            key = (row['substitute_key'], row['output_key'])
            recipes[key] = float(row['ratio_output_per_substitute'])
        
        return recipes
    
    async def _get_substitute_replacements(self, job_id: str) -> Dict[str, List[str]]:
        """Get substitute replacement rules as item_key -> [substitute_keys]"""
        rs = await self.db.execute(text("""
            SELECT i.key as item_key, s.key as substitute_key
            FROM job_enabled_items jei
            JOIN job_enabled_substitutes jes ON jei.job_id = jes.job_id
            JOIN substitutes_can_replace_global scr ON scr.item_id = jei.item_id AND scr.substitute_id = jes.substitute_id
            JOIN items_global i ON i.id = jei.item_id
            JOIN substitutes_global s ON s.id = jes.substitute_id
            WHERE jei.job_id = :job_id
        """), {"job_id": job_id})
        
        replacements = {}
        for row in rs.mappings().all():
            item_key = row['item_key']
            substitute_key = row['substitute_key']
            if item_key not in replacements:
                replacements[item_key] = []
            replacements[item_key].append(substitute_key)
        
        return replacements
    
    async def _get_item_demands(self, job_id: str) -> Dict[Tuple[str, int], float]:
        """Get item demands as (item_key, week) -> amount"""
        rs = await self.db.execute(text("""
            SELECT i.key as item_key, jid.week, jid.amount
            FROM job_item_demands jid
            JOIN items_global i ON i.id = jid.item_id
            WHERE jid.job_id = :job_id
        """), {"job_id": job_id})
        
        demands = {}
        for row in rs.mappings().all():
            key = (row['item_key'], row['week'])
            demands[key] = float(row['amount'])
        
        return demands
    
    async def _get_deadlines(self, job_id: str) -> List[Dict[str, Any]]:
        """Get deadlines as list of {item: item_key, week: int, amount: float}"""
        rs = await self.db.execute(text("""
            SELECT i.key as item_key, jd.week, jd.amount
            FROM job_deadlines jd
            JOIN items_global i ON i.id = jd.item_id
            WHERE jd.job_id = :job_id
            ORDER BY jd.week
        """), {"job_id": job_id})
        
        deadlines = []
        for row in rs.mappings().all():
            deadlines.append({
                'item': row['item_key'],
                'week': row['week'],
                'amount': float(row['amount'])
            })
        
        return deadlines
    
    async def _get_method_capacity(self, job_id: str) -> Dict[Tuple[str, int], float]:
        """Get method capacity as (method_key, week) -> max_capacity_kg"""
        rs = await self.db.execute(text("""
            SELECT m.key as method_key, jmc.week, jmc.max_capacity_kg
            FROM job_method_capacity jmc
            JOIN methods_global m ON m.id = jmc.method_id
            WHERE jmc.job_id = :job_id
        """), {"job_id": job_id})
        
        capacity = {}
        for row in rs.mappings().all():
            key = (row['method_key'], row['week'])
            capacity[key] = float(row['max_capacity_kg'])
        
        return capacity
    
    async def _get_method_availability(self, job_id: str) -> Dict[Tuple[str, int], int]:
        """Get method availability as (method_key, week) -> 0/1"""
        rs = await self.db.execute(text("""
            SELECT m.key as method_key, jmc.week, jmc.available
            FROM job_method_capacity jmc
            JOIN methods_global m ON m.id = jmc.method_id
            WHERE jmc.job_id = :job_id
        """), {"job_id": job_id})
        
        availability = {}
        for row in rs.mappings().all():
            key = (row['method_key'], row['week'])
            availability[key] = 1 if row['available'] else 0
        
        return availability
    
    async def _get_weekly_resources(self, job_id: str, resource_field: str) -> Dict[int, float]:
        """Get weekly resources by week"""
        rs = await self.db.execute(text(f"""
            SELECT week, {resource_field}
            FROM job_week_resources
            WHERE job_id = :job_id
            ORDER BY week
        """), {"job_id": job_id})
        
        resources = {}
        for row in rs.mappings().all():
            resources[row['week']] = float(row[resource_field])
        
        return resources
    
    async def _get_output_capacities(self, job_id: str) -> Dict[str, float]:
        """Get output capacities by output key"""
        rs = await self.db.execute(text("""
            SELECT o.key, o.max_output_capacity_kg
            FROM job_enabled_outputs jeo
            JOIN outputs_global o ON o.id = jeo.output_id
            WHERE jeo.job_id = :job_id AND o.max_output_capacity_kg IS NOT NULL
        """), {"job_id": job_id})
        
        capacities = {}
        for row in rs.mappings().all():
            capacities[row['key']] = float(row['max_output_capacity_kg'])
        
        return capacities
    
    async def _get_input_capacities(self, job_id: str) -> Dict[str, float]:
        """Get input capacities by material key"""
        rs = await self.db.execute(text("""
            SELECT m.key, m.max_input_capacity_kg
            FROM job_enabled_materials jem
            JOIN materials_global m ON m.id = jem.material_id
            WHERE jem.job_id = :job_id AND m.max_input_capacity_kg IS NOT NULL
        """), {"job_id": job_id})
        
        capacities = {}
        for row in rs.mappings().all():
            capacities[row['key']] = float(row['max_input_capacity_kg'])
        
        return capacities
    
    async def _get_method_properties(self, job_id: str, property_field: str) -> Dict[str, float]:
        """Get method properties by key"""
        rs = await self.db.execute(text(f"""
            SELECT m.key, m.{property_field}
            FROM job_enabled_methods jem
            JOIN methods_global m ON m.id = jem.method_id
            WHERE jem.job_id = :job_id
        """), {"job_id": job_id})
        
        properties = {}
        for row in rs.mappings().all():
            properties[row['key']] = float(row[property_field])
        
        return properties
    
    async def _get_output_values(self, job_id: str) -> Dict[str, float]:
        """Get output values by output key"""
        rs = await self.db.execute(text("""
            SELECT o.key, o.value_per_kg
            FROM job_enabled_outputs jeo
            JOIN outputs_global o ON o.id = jeo.output_id
            WHERE jeo.job_id = :job_id
        """), {"job_id": job_id})
        
        values = {}
        for row in rs.mappings().all():
            values[row['key']] = float(row['value_per_kg'])
        
        return values
