from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.deps import get_db
from app.models.missions import MissionCreate, MissionOut
from uuid import uuid4

router = APIRouter(prefix="/missions", tags=["missions"])

@router.get("", response_model=list[MissionOut])
async def list_missions(db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from missions order by created_at desc"))
    return [dict(r) for r in rs.mappings().all()]

@router.get("/{mission_id}", response_model=MissionOut)
async def get_mission(mission_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from missions where id=:id"), {"id": mission_id})
    row = rs.mappings().first()
    if not row:
        raise HTTPException(404, "Mission not found")
    return dict(row)

@router.post("", response_model=MissionOut)
async def create_mission(payload: MissionCreate, db: AsyncSession = Depends(get_db)):
    # For demo: owner_id is null-safe; set explicitly if you want to use auth.uid() via RPC or pass from gateway
    rs = await db.execute(text("""
        insert into missions
        (id, owner_id, name, description, mission_start_date, duration_weeks, transit_weeks, surface_weeks, return_weeks,
         crew_count, crew_hours_per_week, printer_capacity_kg_per_week, tools_available, status)
        values (gen_random_uuid(), null, :name, :desc, :start, :dur, :tw, :sw, :rw, :crew, :crewhrs, :printer, :tools, :status)
        returning *;
    """), {
        "name": payload.name,
        "desc": payload.description,
        "start": payload.mission_start_date,
        "dur": payload.duration_weeks,
        "tw": payload.transit_weeks,
        "sw": payload.surface_weeks,
        "rw": payload.return_weeks,
        "crew": payload.crew_count,
        "crewhrs": payload.crew_hours_per_week,
        "printer": payload.printer_capacity_kg_per_week,
        "tools": payload.tools_available,
        "status": payload.status
    })
    await db.commit()
    return dict(rs.mappings().first())
