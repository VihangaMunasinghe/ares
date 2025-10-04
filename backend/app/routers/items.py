from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.deps import get_db
from app.models.items import ManifestItemCreate
from app.services.waste_calc import recompute_item_waste

router = APIRouter(prefix="/items", tags=["items"])

@router.get("/by-mission/{mission_id}")
async def list_items(mission_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from manifest_items where mission_id=:id order by created_at desc"), {"id": mission_id})
    return [dict(r) for r in rs.mappings().all()]

@router.post("")
async def create_item(payload: ManifestItemCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
      insert into manifest_items
      (id, mission_id, name, material_id, qty, unit, mass_per_unit_kg, usage_pattern, usage_per_week, weeks, usage_per_week_map, function_tags, notes)
      values (gen_random_uuid(), :ms, :name, :mat, :qty, :unit, :mpu, :pat, :upw, :weeks, :upwmap, :tags, :notes)
      returning id;
    """), {
      "ms": payload.mission_id,
      "name": payload.name,
      "mat": payload.material_id,
      "qty": payload.qty,
      "unit": payload.unit,
      "mpu": payload.mass_per_unit_kg,
      "pat": payload.usage_pattern,
      "upw": payload.usage_per_week,
      "weeks": payload.weeks,
      "upwmap": payload.usage_per_week_map,
      "tags": payload.function_tags,
      "notes": payload.notes
    })
    row = rs.mappings().first()
    await db.commit()
    item_id = row["id"]
    await recompute_item_waste(db, item_id)
    return {"id": item_id, "status": "ok"}

@router.post("/{item_id}/recompute")
async def recompute(item_id: str, db: AsyncSession = Depends(get_db)):
    await recompute_item_waste(db, item_id)
    return {"ok": True}

@router.delete("/{item_id}", status_code=status.HTTP_200_OK)
async def delete_item(item_id: str, db: AsyncSession = Depends(get_db)):
  rs = await db.execute(text("delete from manifest_items where id=:id returning id"), {"id": item_id})
  deleted = rs.mappings().first()
  await db.commit()
  if not deleted:
    raise HTTPException(status_code=404, detail="Item not found")
  return {"success": True, "message": "Item deleted successfully."}
