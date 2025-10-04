from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_db 
from app.models.missions import MissionCreate, MissionOut, MissionUpdate
from uuid import uuid4
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/missions", tags=["missions"])


@router.get("", response_model=list[MissionOut])
async def list_missions(db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from missions order by created_at desc"))
    missions = []
    for row in rs.mappings().all():
        mission_dict = dict(row)
        # Convert UUID objects to strings
        if mission_dict.get('id'):
            mission_dict['id'] = str(mission_dict['id'])
        if mission_dict.get('owner_id'):
            mission_dict['owner_id'] = str(mission_dict['owner_id'])
        missions.append(mission_dict)
    return missions

@router.get("/{mission_id}", response_model=MissionOut)
async def get_mission(mission_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from missions where id=:id"), {"id": mission_id})
    row = rs.mappings().first()
    if not row:
        raise HTTPException(404, "Mission not found")
    mission_dict = dict(row)
    # Convert UUID objects to strings
    if mission_dict.get('id'):
        mission_dict['id'] = str(mission_dict['id'])
    if mission_dict.get('owner_id'):
        mission_dict['owner_id'] = str(mission_dict['owner_id'])
    return mission_dict

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
    mission_dict = dict(rs.mappings().first())
    # Convert UUID objects to strings
    if mission_dict.get('id'):
        mission_dict['id'] = str(mission_dict['id'])
    if mission_dict.get('owner_id'):
        mission_dict['owner_id'] = str(mission_dict['owner_id'])
    return mission_dict

@router.patch("/{mission_id}", response_model=MissionOut)
async def update_mission(mission_id: str, payload: MissionUpdate, db: AsyncSession = Depends(get_db)):
    # Build dynamic update statement
    update_fields = {k: v for k, v in payload.dict(exclude_unset=True).items()}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update.")
    set_clause = ", ".join([f"{key} = :{key}" for key in update_fields.keys()])
    update_fields["id"] = mission_id
    rs = await db.execute(text(f"""
        update missions set {set_clause}
        where id = :id
        returning *;
    """), update_fields)
    await db.commit()
    row = rs.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Mission not found")
    mission_dict = dict(row)
    if mission_dict.get('id'):
        mission_dict['id'] = str(mission_dict['id'])
    if mission_dict.get('owner_id'):
        mission_dict['owner_id'] = str(mission_dict['owner_id'])
    return mission_dict

@router.delete("/{mission_id}", status_code=status.HTTP_200_OK)
async def delete_mission(mission_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from missions where id=:id returning id"), {"id": mission_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Mission not found")
    return {"success": True, "message": "Mission deleted successfully."}
