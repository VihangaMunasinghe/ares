from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_db 
from app.models.materials import MaterialCreate, WasteStreamCreate

router = APIRouter(prefix="/materials", tags=["materials"])

@router.get("")
async def list_materials(db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from materials order by created_at desc"))
    return [dict(r) for r in rs.mappings().all()]

@router.post("")
async def create_material(payload: MaterialCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into materials (id, name, category, default_mass_per_unit, default_tags, safety_flags, created_by)
        values (gen_random_uuid(), :name, :cat, :mass, :tags, :safety, null)
        returning *;
    """), {
        "name": payload.name,
        "cat": payload.category,
        "mass": payload.default_mass_per_unit,
        "tags": payload.default_tags,
        "safety": payload.safety_flags
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.get("/{material_id}/waste")
async def list_waste(material_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from waste_streams where material_id=:mid"), {"mid": material_id})
    return [dict(r) for r in rs.mappings().all()]

@router.post("/waste")
async def create_waste(payload: WasteStreamCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into waste_streams (id, material_id, name, expected_yield_ratio, availability_json, notes)
        values (gen_random_uuid(), :mid, :name, :yr, :avail, :notes)
        returning *;
    """), {
        "mid": payload.material_id,
        "name": payload.name,
        "yr": payload.expected_yield_ratio,
        "avail": payload.availability_json,
        "notes": payload.notes
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.delete("/{material_id}", status_code=status.HTTP_200_OK)
async def delete_material(material_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from materials where id=:id returning id"), {"id": material_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"success": True, "message": "Material deleted successfully."}
