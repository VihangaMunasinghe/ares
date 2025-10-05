from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_db
from app.models.job_config import (
    JobCreate, JobOut,
    JobEnabledMaterialCreate, JobEnabledMethodCreate, JobEnabledOutputCreate, 
    JobEnabledItemCreate, JobEnabledSubstituteCreate,
    JobMaterialInventoryCreate, JobMaterialInventoryOut,
    JobOutputInventoryCreate, JobOutputInventoryOut,
    JobItemInventoryCreate, JobItemInventoryOut,
    JobSubstituteInventoryCreate, JobSubstituteInventoryOut,
    JobItemDemandCreate, JobItemDemandOut,
    JobDeadlineCreate, JobDeadlineOut,
    JobWeekResourceCreate, JobWeekResourceOut,
    JobMethodCapacityCreate, JobMethodCapacityOut
)
from app.models.job_results import (
    JobResultSummaryOut, JobResultScheduleOut, JobResultOutputOut,
    JobResultItemOut, JobResultSubstituteOut, JobResultSubstituteBreakdownOut,
    JobResultWeightLossOut
)
from app.services.queue import QueueProducer
from app.core.queue import get_queue
from sse_starlette.sse import EventSourceResponse
import asyncio
import json

router = APIRouter(prefix="/jobs", tags=["jobs"])

# === MAIN JOB OPERATIONS ===
@router.get("", response_model=list[JobOut])
async def list_all_jobs(db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from jobs order by created_at desc"))
    jobs = []
    for row in rs.mappings().all():
        job_dict = dict(row)
        # Convert UUID objects to strings
        if job_dict.get('id'):
            job_dict['id'] = str(job_dict['id'])
        if job_dict.get('mission_id'):
            job_dict['mission_id'] = str(job_dict['mission_id'])
        if job_dict.get('created_by'):
            job_dict['created_by'] = str(job_dict['created_by'])
        # Convert datetime objects to ISO strings
        if job_dict.get('created_at'):
            job_dict['created_at'] = job_dict['created_at'].isoformat()
        if job_dict.get('updated_at'):
            job_dict['updated_at'] = job_dict['updated_at'].isoformat()
        if job_dict.get('started_at'):
            job_dict['started_at'] = job_dict['started_at'].isoformat()
        if job_dict.get('completed_at'):
            job_dict['completed_at'] = job_dict['completed_at'].isoformat()
        # Parse JSON params if it's a string
        if job_dict.get('params') and isinstance(job_dict['params'], str):
            try:
                job_dict['params'] = json.loads(job_dict['params'])
            except json.JSONDecodeError:
                job_dict['params'] = {}
        jobs.append(job_dict)
    return jobs

@router.get("/by-mission/{mission_id}", response_model=list[JobOut])
async def list_jobs_by_mission(mission_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from jobs where mission_id = :mission_id order by created_at desc"), {"mission_id": mission_id})
    jobs = []
    for row in rs.mappings().all():
        job_dict = dict(row)
        # Convert UUID objects to strings
        if job_dict.get('id'):
            job_dict['id'] = str(job_dict['id'])
        if job_dict.get('mission_id'):
            job_dict['mission_id'] = str(job_dict['mission_id'])
        if job_dict.get('created_by'):
            job_dict['created_by'] = str(job_dict['created_by'])
        # Convert datetime objects to ISO strings
        if job_dict.get('created_at'):
            job_dict['created_at'] = job_dict['created_at'].isoformat()
        if job_dict.get('updated_at'):
            job_dict['updated_at'] = job_dict['updated_at'].isoformat()
        if job_dict.get('started_at'):
            job_dict['started_at'] = job_dict['started_at'].isoformat()
        if job_dict.get('completed_at'):
            job_dict['completed_at'] = job_dict['completed_at'].isoformat()
        # Parse JSON params if it's a string
        if job_dict.get('params') and isinstance(job_dict['params'], str):
            try:
                job_dict['params'] = json.loads(job_dict['params'])
            except json.JSONDecodeError:
                job_dict['params'] = {}
        jobs.append(job_dict)
    return jobs


@router.post("", response_model=JobOut)
async def create_job(payload: JobCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into jobs (id, mission_id, created_by, status, total_weeks, w_mass, w_value, w_crew, w_energy, w_risk, w_make, w_carry, w_shortage, params)
        values (gen_random_uuid(), :mission_id, null, 'draft', :total_weeks, :w_mass, :w_value, :w_crew, :w_energy, :w_risk, :w_make, :w_carry, :w_shortage, :params)
        returning *;
    """), {
        "mission_id": payload.mission_id,
        "total_weeks": payload.total_weeks,
        "w_mass": payload.w_mass,
        "w_value": payload.w_value,
        "w_crew": payload.w_crew,
        "w_energy": payload.w_energy,
        "w_risk": payload.w_risk,
        "w_make": payload.w_make,
        "w_carry": payload.w_carry,
        "w_shortage": payload.w_shortage,
        "params": json.dumps(payload.params) if payload.params else "{}"
    })
    await db.commit()
    job_dict = dict(rs.mappings().first())
    # Convert UUID objects to strings
    if job_dict.get('id'):
        job_dict['id'] = str(job_dict['id'])
    if job_dict.get('mission_id'):
        job_dict['mission_id'] = str(job_dict['mission_id'])
    if job_dict.get('created_by'):
        job_dict['created_by'] = str(job_dict['created_by'])
    # Convert datetime objects to ISO strings
    if job_dict.get('created_at'):
        job_dict['created_at'] = job_dict['created_at'].isoformat()
    if job_dict.get('updated_at'):
        job_dict['updated_at'] = job_dict['updated_at'].isoformat()
    if job_dict.get('started_at'):
        job_dict['started_at'] = job_dict['started_at'].isoformat()
    if job_dict.get('completed_at'):
        job_dict['completed_at'] = job_dict['completed_at'].isoformat()
    # Parse JSON params if it's a string
    if job_dict.get('params') and isinstance(job_dict['params'], str):
        try:
            job_dict['params'] = json.loads(job_dict['params'])
        except json.JSONDecodeError:
            job_dict['params'] = {}
    return job_dict

@router.get("/{job_id}", response_model=JobOut)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from jobs where id = :id"), {"id": job_id})
    job = rs.mappings().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job_dict = dict(job)
    # Convert UUID objects to strings
    if job_dict.get('id'):
        job_dict['id'] = str(job_dict['id'])
    if job_dict.get('mission_id'):
        job_dict['mission_id'] = str(job_dict['mission_id'])
    if job_dict.get('created_by'):
        job_dict['created_by'] = str(job_dict['created_by'])
    # Convert datetime objects to ISO strings
    if job_dict.get('created_at'):
        job_dict['created_at'] = job_dict['created_at'].isoformat()
    if job_dict.get('updated_at'):
        job_dict['updated_at'] = job_dict['updated_at'].isoformat()
    if job_dict.get('started_at'):
        job_dict['started_at'] = job_dict['started_at'].isoformat()
    if job_dict.get('completed_at'):
        job_dict['completed_at'] = job_dict['completed_at'].isoformat()
    # Parse JSON params if it's a string
    if job_dict.get('params') and isinstance(job_dict['params'], str):
        try:
            job_dict['params'] = json.loads(job_dict['params'])
        except json.JSONDecodeError:
            job_dict['params'] = {}
    return job_dict

@router.delete("/{job_id}")
async def delete_job(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from jobs where id = :id returning id"), {"id": job_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"success": True, "message": "Job deleted successfully"}

@router.patch("/{job_id}/status")
async def update_job_status(job_id: str, payload: dict, db: AsyncSession = Depends(get_db)):
    status = payload.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    rs = await db.execute(text("update jobs set status = :status where id = :job_id returning id"), 
                         {"status": status, "job_id": job_id})
    updated = rs.mappings().first()
    await db.commit()
    
    if not updated:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"success": True}

@router.get("/{job_id}/configuration")
async def get_job_configuration(job_id: str, db: AsyncSession = Depends(get_db)):
    # Get job details
    job_rs = await db.execute(text("select * from jobs where id = :id"), {"id": job_id})
    job = job_rs.mappings().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_dict = dict(job)
    # Convert UUID objects to strings
    if job_dict.get('id'):
        job_dict['id'] = str(job_dict['id'])
    if job_dict.get('mission_id'):
        job_dict['mission_id'] = str(job_dict['mission_id'])
    if job_dict.get('created_by'):
        job_dict['created_by'] = str(job_dict['created_by'])
    # Convert datetime objects to ISO strings
    if job_dict.get('created_at'):
        job_dict['created_at'] = job_dict['created_at'].isoformat()
    if job_dict.get('updated_at'):
        job_dict['updated_at'] = job_dict['updated_at'].isoformat()
    if job_dict.get('started_at'):
        job_dict['started_at'] = job_dict['started_at'].isoformat()
    if job_dict.get('completed_at'):
        job_dict['completed_at'] = job_dict['completed_at'].isoformat()
    # Parse JSON params if it's a string
    if job_dict.get('params') and isinstance(job_dict['params'], str):
        try:
            job_dict['params'] = json.loads(job_dict['params'])
        except json.JSONDecodeError:
            job_dict['params'] = {}
    
    # Get enabled entities
    materials_rs = await db.execute(text("select material_id from job_enabled_materials where job_id = :job_id"), {"job_id": job_id})
    selected_materials = [str(row.material_id) for row in materials_rs.mappings().all()]
    
    methods_rs = await db.execute(text("select method_id from job_enabled_methods where job_id = :job_id"), {"job_id": job_id})
    selected_methods = [str(row.method_id) for row in methods_rs.mappings().all()]
    
    outputs_rs = await db.execute(text("select output_id from job_enabled_outputs where job_id = :job_id"), {"job_id": job_id})
    selected_outputs = [str(row.output_id) for row in outputs_rs.mappings().all()]
    
    items_rs = await db.execute(text("select item_id from job_enabled_items where job_id = :job_id"), {"job_id": job_id})
    selected_items = [str(row.item_id) for row in items_rs.mappings().all()]
    
    substitutes_rs = await db.execute(text("select substitute_id from job_enabled_substitutes where job_id = :job_id"), {"job_id": job_id})
    selected_substitutes = [str(row.substitute_id) for row in substitutes_rs.mappings().all()]
    
    # Get inventories
    material_inv_rs = await db.execute(text("select material_id, qty_kg from job_material_inventory where job_id = :job_id"), {"job_id": job_id})
    material_inventories = {str(row.material_id): row.qty_kg for row in material_inv_rs.mappings().all()}
    
    output_inv_rs = await db.execute(text("select output_id, qty_kg from job_output_inventory where job_id = :job_id"), {"job_id": job_id})
    output_inventories = {str(row.output_id): row.qty_kg for row in output_inv_rs.mappings().all()}
    
    item_inv_rs = await db.execute(text("select item_id, qty_units from job_item_inventory where job_id = :job_id"), {"job_id": job_id})
    item_inventories = {str(row.item_id): row.qty_units for row in item_inv_rs.mappings().all()}
    
    substitute_inv_rs = await db.execute(text("select substitute_id, qty_units from job_substitute_inventory where job_id = :job_id"), {"job_id": job_id})
    substitute_inventories = {str(row.substitute_id): row.qty_units for row in substitute_inv_rs.mappings().all()}
    
    # Get demands and deadlines
    demands_rs = await db.execute(text("select item_id, week, amount from job_item_demands where job_id = :job_id"), {"job_id": job_id})
    item_demands = [{"itemId": str(row.item_id), "week": row.week, "amount": row.amount} for row in demands_rs.mappings().all()]
    
    deadlines_rs = await db.execute(text("select item_id, week, amount from job_deadlines where job_id = :job_id"), {"job_id": job_id})
    item_deadlines = [{"itemId": str(row.item_id), "week": row.week, "amount": row.amount} for row in deadlines_rs.mappings().all()]
    
    # Get resources
    resources_rs = await db.execute(text("select week, crew_available, energy_available from job_week_resources where job_id = :job_id order by week"), {"job_id": job_id})
    weekly_resources = [{"week": row.week, "crewAvailable": row.crew_available, "energyAvailable": row.energy_available} for row in resources_rs.mappings().all()]
    
    # Get method capacities
    capacities_rs = await db.execute(text("select method_id, week, max_capacity_kg, available from job_method_capacity where job_id = :job_id"), {"job_id": job_id})
    method_capacities = [{"methodId": str(row.method_id), "week": row.week, "maxCapacityKg": row.max_capacity_kg, "available": row.available} for row in capacities_rs.mappings().all()]
    
    return {
        "job": job_dict,
        "selectedMaterials": selected_materials,
        "selectedMethods": selected_methods,
        "selectedOutputs": selected_outputs,
        "selectedItems": selected_items,
        "selectedSubstitutes": selected_substitutes,
        "materialInventories": material_inventories,
        "outputInventories": output_inventories,
        "itemInventories": item_inventories,
        "substituteInventories": substitute_inventories,
        "itemDemands": item_demands,
        "itemDeadlines": item_deadlines,
        "weeklyResources": weekly_resources,
        "methodCapacities": method_capacities
    }

# === ENTITY ENABLEMENT ===
@router.post("/{job_id}/enable/materials")
async def enable_materials(job_id: str, material_ids: list[str], db: AsyncSession = Depends(get_db)):
    for material_id in material_ids:
        await db.execute(text("""
            insert into job_enabled_materials (job_id, material_id) 
            values (:job_id, :material_id) 
            on conflict (job_id, material_id) do nothing
        """), {"job_id": job_id, "material_id": material_id})
    await db.commit()
    return {"success": True, "enabled_materials": len(material_ids)}

@router.post("/{job_id}/enable/methods")
async def enable_methods(job_id: str, method_ids: list[str], db: AsyncSession = Depends(get_db)):
    for method_id in method_ids:
        await db.execute(text("""
            insert into job_enabled_methods (job_id, method_id) 
            values (:job_id, :method_id) 
            on conflict (job_id, method_id) do nothing
        """), {"job_id": job_id, "method_id": method_id})
    await db.commit()
    return {"success": True, "enabled_methods": len(method_ids)}

@router.post("/{job_id}/enable/outputs")
async def enable_outputs(job_id: str, output_ids: list[str], db: AsyncSession = Depends(get_db)):
    for output_id in output_ids:
        await db.execute(text("""
            insert into job_enabled_outputs (job_id, output_id) 
            values (:job_id, :output_id) 
            on conflict (job_id, output_id) do nothing
        """), {"job_id": job_id, "output_id": output_id})
    await db.commit()
    return {"success": True, "enabled_outputs": len(output_ids)}

@router.post("/{job_id}/enable/items")
async def enable_items(job_id: str, item_ids: list[str], db: AsyncSession = Depends(get_db)):
    for item_id in item_ids:
        await db.execute(text("""
            insert into job_enabled_items (job_id, item_id) 
            values (:job_id, :item_id) 
            on conflict (job_id, item_id) do nothing
        """), {"job_id": job_id, "item_id": item_id})
    await db.commit()
    return {"success": True, "enabled_items": len(item_ids)}

@router.post("/{job_id}/enable/substitutes")
async def enable_substitutes(job_id: str, substitute_ids: list[str], db: AsyncSession = Depends(get_db)):
    for substitute_id in substitute_ids:
        await db.execute(text("""
            insert into job_enabled_substitutes (job_id, substitute_id) 
            values (:job_id, :substitute_id) 
            on conflict (job_id, substitute_id) do nothing
        """), {"job_id": job_id, "substitute_id": substitute_id})
    await db.commit()
    return {"success": True, "enabled_substitutes": len(substitute_ids)}

# === INVENTORY MANAGEMENT ===
@router.get("/{job_id}/inventory/materials", response_model=list[JobMaterialInventoryOut])
async def get_material_inventory(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from job_material_inventory where job_id = :job_id"), {"job_id": job_id})
    return [dict(r) for r in rs.mappings().all()]

@router.post("/{job_id}/inventory/materials")
async def set_material_inventory(job_id: str, payload: JobMaterialInventoryCreate, db: AsyncSession = Depends(get_db)):
    await db.execute(text("""
        insert into job_material_inventory (job_id, material_id, qty_kg) 
        values (:job_id, :material_id, :qty_kg)
        on conflict (job_id, material_id) do update set qty_kg = excluded.qty_kg
    """), {
        "job_id": job_id,
        "material_id": payload.material_id,
        "qty_kg": payload.qty_kg
    })
    await db.commit()
    return {"success": True}

@router.get("/{job_id}/inventory/outputs", response_model=list[JobOutputInventoryOut])
async def get_output_inventory(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from job_output_inventory where job_id = :job_id"), {"job_id": job_id})
    return [dict(r) for r in rs.mappings().all()]

@router.post("/{job_id}/inventory/outputs")
async def set_output_inventory(job_id: str, payload: JobOutputInventoryCreate, db: AsyncSession = Depends(get_db)):
    await db.execute(text("""
        insert into job_output_inventory (job_id, output_id, qty_kg) 
        values (:job_id, :output_id, :qty_kg)
        on conflict (job_id, output_id) do update set qty_kg = excluded.qty_kg
    """), {
        "job_id": job_id,
        "output_id": payload.output_id,
        "qty_kg": payload.qty_kg
    })
    await db.commit()
    return {"success": True}

@router.get("/{job_id}/inventory/items", response_model=list[JobItemInventoryOut])
async def get_item_inventory(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from job_item_inventory where job_id = :job_id"), {"job_id": job_id})
    return [dict(r) for r in rs.mappings().all()]

@router.post("/{job_id}/inventory/items")
async def set_item_inventory(job_id: str, payload: JobItemInventoryCreate, db: AsyncSession = Depends(get_db)):
    await db.execute(text("""
        insert into job_item_inventory (job_id, item_id, qty_units) 
        values (:job_id, :item_id, :qty_units)
        on conflict (job_id, item_id) do update set qty_units = excluded.qty_units
    """), {
        "job_id": job_id,
        "item_id": payload.item_id,
        "qty_units": payload.qty_units
    })
    await db.commit()
    return {"success": True}

@router.get("/{job_id}/inventory/substitutes", response_model=list[JobSubstituteInventoryOut])
async def get_substitute_inventory(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from job_substitute_inventory where job_id = :job_id"), {"job_id": job_id})
    return [dict(r) for r in rs.mappings().all()]

@router.post("/{job_id}/inventory/substitutes")
async def set_substitute_inventory(job_id: str, payload: JobSubstituteInventoryCreate, db: AsyncSession = Depends(get_db)):
    await db.execute(text("""
        insert into job_substitute_inventory (job_id, substitute_id, qty_units) 
        values (:job_id, :substitute_id, :qty_units)
        on conflict (job_id, substitute_id) do update set qty_units = excluded.qty_units
    """), {
        "job_id": job_id,
        "substitute_id": payload.substitute_id,
        "qty_units": payload.qty_units
    })
    await db.commit()
    return {"success": True}

# === DEMANDS AND DEADLINES ===
@router.get("/{job_id}/demands", response_model=list[JobItemDemandOut])
async def get_item_demands(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from job_item_demands where job_id = :job_id order by week, item_id"), {"job_id": job_id})
    return [dict(r) for r in rs.mappings().all()]

@router.post("/{job_id}/demands")
async def set_item_demand(job_id: str, payload: JobItemDemandCreate, db: AsyncSession = Depends(get_db)):
    await db.execute(text("""
        insert into job_item_demands (job_id, item_id, week, amount) 
        values (:job_id, :item_id, :week, :amount)
        on conflict (job_id, item_id, week) do update set amount = excluded.amount
    """), {
        "job_id": job_id,
        "item_id": payload.item_id,
        "week": payload.week,
        "amount": payload.amount
    })
    await db.commit()
    return {"success": True}

@router.get("/{job_id}/deadlines", response_model=list[JobDeadlineOut])
async def get_deadlines(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from job_deadlines where job_id = :job_id order by week, item_id"), {"job_id": job_id})
    return [dict(r) for r in rs.mappings().all()]

@router.post("/{job_id}/deadlines")
async def set_deadline(job_id: str, payload: JobDeadlineCreate, db: AsyncSession = Depends(get_db)):
    await db.execute(text("""
        insert into job_deadlines (job_id, item_id, week, amount) 
        values (:job_id, :item_id, :week, :amount)
        on conflict (job_id, item_id, week) do update set amount = excluded.amount
    """), {
        "job_id": job_id,
        "item_id": payload.item_id,
        "week": payload.week,
        "amount": payload.amount
    })
    await db.commit()
    return {"success": True}

# === RESOURCES AND CAPACITY ===
@router.get("/{job_id}/resources", response_model=list[JobWeekResourceOut])
async def get_week_resources(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from job_week_resources where job_id = :job_id order by week"), {"job_id": job_id})
    return [dict(r) for r in rs.mappings().all()]

@router.post("/{job_id}/resources")
async def set_week_resources(job_id: str, payload: JobWeekResourceCreate, db: AsyncSession = Depends(get_db)):
    await db.execute(text("""
        insert into job_week_resources (job_id, week, crew_available, energy_available) 
        values (:job_id, :week, :crew_available, :energy_available)
        on conflict (job_id, week) do update set 
            crew_available = excluded.crew_available,
            energy_available = excluded.energy_available
    """), {
        "job_id": job_id,
        "week": payload.week,
        "crew_available": payload.crew_available,
        "energy_available": payload.energy_available
    })
    await db.commit()
    return {"success": True}

@router.get("/{job_id}/method-capacity", response_model=list[JobMethodCapacityOut])
async def get_method_capacity(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from job_method_capacity where job_id = :job_id order by week, method_id"), {"job_id": job_id})
    return [dict(r) for r in rs.mappings().all()]

@router.post("/{job_id}/method-capacity")
async def set_method_capacity(job_id: str, payload: JobMethodCapacityCreate, db: AsyncSession = Depends(get_db)):
    await db.execute(text("""
        insert into job_method_capacity (job_id, method_id, week, max_capacity_kg, available) 
        values (:job_id, :method_id, :week, :max_capacity_kg, :available)
        on conflict (job_id, method_id, week) do update set 
            max_capacity_kg = excluded.max_capacity_kg,
            available = excluded.available
    """), {
        "job_id": job_id,
        "method_id": payload.method_id,
        "week": payload.week,
        "max_capacity_kg": payload.max_capacity_kg,
        "available": payload.available
    })
    await db.commit()
    return {"success": True}

# === JOB EXECUTION ===
@router.post("/{job_id}/run")
async def run_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    queueProducer: QueueProducer = Depends(get_queue)
):
    try:
        # Set job status to running and started_at
        await db.execute(
            text("update jobs set status = 'running', started_at = now() where id = :job_id"),
            {"job_id": job_id}
        )
        await db.commit()

        try:
            # Ensure connection and publish optimization request
            queueProducer.connect()
            try:
                await queueProducer.publish_optimization_request(job_id)
            finally:
                queueProducer.disconnect()
        except Exception as e:
            # If queue publish fails, rollback and set job status to failed
            await db.rollback()
            await db.execute(
                text("update jobs set status = 'failed', completed_at = now(), error_message = :error_message where id = :job_id"),
                {"job_id": job_id, "error_message": f"Queue error: {str(e)}"}
            )
            await db.commit()
            raise HTTPException(status_code=500, detail=f"Failed to start job: {str(e)}")

        return {"success": True, "message": "Job started", "job_id": job_id}
    except HTTPException:
        # Re-raise HTTP exceptions (they're already handled above)
        raise
    except Exception as e:
        # If any other error, rollback and set job status to failed
        await db.rollback()
        try:
            await db.execute(
                text("update jobs set status = 'failed', completed_at = now(), error_message = :error_message where id = :job_id"),
                {"job_id": job_id, "error_message": f"Internal error: {str(e)}"}
            )
            await db.commit()
        except Exception as db_error:
            # If even the error update fails, just log it and continue
            print(f"Failed to update job status to failed: {db_error}")
        raise HTTPException(status_code=500, detail=f"Failed to start job: {str(e)}")

@router.get("/{job_id}/stream")
async def stream_job_progress(job_id: str, db: AsyncSession = Depends(get_db)):
    async def event_generator():
        while True:
            # Check job status
            rs = await db.execute(text("select status from jobs where id = :job_id"), {"job_id": job_id})
            job = rs.mappings().first()
            
            if not job:
                yield {"event": "error", "data": json.dumps({"error": "Job not found"})}
                break
                
            yield {"event": "status", "data": json.dumps({"status": job["status"]})}
            
            if job["status"] in ["completed", "failed", "cancelled"]:
                break
                
            await asyncio.sleep(2)
    
    return EventSourceResponse(event_generator())

# === RESULTS ===
@router.get("/{job_id}/results/summary", response_model=JobResultSummaryOut)
async def get_job_result_summary(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from job_result_summary where job_id = :job_id"), {"job_id": job_id})
    result = rs.mappings().first()
    if not result:
        raise HTTPException(status_code=404, detail="Job results not found")
    return dict(result)

@router.get("/{job_id}/results/schedule", response_model=list[JobResultScheduleOut])
async def get_job_result_schedule(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from job_result_schedule where job_id = :job_id order by week"), {"job_id": job_id})
    return [dict(r) for r in rs.mappings().all()]

@router.get("/{job_id}/results/outputs", response_model=list[JobResultOutputOut])
async def get_job_result_outputs(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from job_result_outputs where job_id = :job_id order by week, output_id"), {"job_id": job_id})
    return [dict(r) for r in rs.mappings().all()]

@router.get("/{job_id}/results/items", response_model=list[JobResultItemOut])
async def get_job_result_items(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from job_result_items where job_id = :job_id order by week, item_id"), {"job_id": job_id})
    return [dict(r) for r in rs.mappings().all()]

@router.get("/{job_id}/results/substitutes", response_model=list[JobResultSubstituteOut])
async def get_job_result_substitutes(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from job_result_substitutes where job_id = :job_id order by week, substitute_id"), {"job_id": job_id})
    return [dict(r) for r in rs.mappings().all()]

@router.get("/{job_id}/results/substitute-breakdown", response_model=list[JobResultSubstituteBreakdownOut])
async def get_job_result_substitute_breakdown(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from job_result_substitute_breakdown where job_id = :job_id order by substitute_id"), {"job_id": job_id})
    return [dict(r) for r in rs.mappings().all()]

@router.get("/{job_id}/results/weight-loss", response_model=list[JobResultWeightLossOut])
async def get_job_result_weight_loss(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from job_result_weight_loss where job_id = :job_id order by item_id"), {"job_id": job_id})
    return [dict(r) for r in rs.mappings().all()]
