from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_db 
from app.models.schedules import ScheduleCreate, ScheduleOut

router = APIRouter(prefix="/schedules", tags=["schedules"])

@router.get("/by-job/{job_id}", response_model=list[ScheduleOut])
async def list_schedules(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from schedules where job_id=:id order by start_week asc"), {"id": job_id})
    return [dict(r) for r in rs.mappings().all()]

@router.get("/{schedule_id}", response_model=ScheduleOut)
async def get_schedule(schedule_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from schedules where id = :id"), {"id": schedule_id})
    schedule = rs.mappings().first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return dict(schedule)

@router.post("", response_model=ScheduleOut)
async def create_schedule(payload: ScheduleCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into schedules (id, job_id, resource_name, task_label, recipe_id, start_week, duration_weeks, inputs_json, crew_hours_required)
        values (gen_random_uuid(), :jid,:res,:task,:rid,:sw,:dur,:inputs,:crew)
        returning *;
    """), {
        "jid": payload.job_id,
        "res": payload.resource_name,
        "task": payload.task_label,
        "rid": payload.recipe_id,
        "sw": payload.start_week,
        "dur": payload.duration_weeks,
        "inputs": payload.inputs_json,
        "crew": payload.crew_hours_required
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.delete("/{schedule_id}", status_code=status.HTTP_200_OK)
async def delete_schedule(schedule_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from schedules where id=:id returning id"), {"id": schedule_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"success": True, "message": "Schedule deleted successfully."}
