from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_db 
from app.models.items import (
    ManifestItemCreate, ManifestItemOut, ManifestItemWasteOut,
    SubstitutionItemCreate, SubstitutionItemOut, ItemSubstitutionCreate, ItemSubstitutionOut,
    SubstitutionItemWasteCreate, SubstitutionItemWasteOut, SubstitutionItemInputCreate, SubstitutionItemInputOut
)
from app.services.waste_calc import recompute_item_waste

router = APIRouter(prefix="/items", tags=["items"])

# === Manifest Items ===
@router.get("/by-mission/{mission_id}", response_model=list[ManifestItemOut])
async def list_items(mission_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from manifest_items where mission_id=:id order by created_at desc"), {"id": mission_id})
    return [dict(r) for r in rs.mappings().all()]

@router.post("", response_model=dict)
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

@router.get("/{item_id}", response_model=ManifestItemOut)
async def get_item(item_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from manifest_items where id = :id"), {"id": item_id})
    item = rs.mappings().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return dict(item)

@router.get("/{item_id}/waste", response_model=list[ManifestItemWasteOut])
async def get_item_waste(item_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from manifest_item_waste where item_id = :id order by week"), {"id": item_id})
    return [dict(r) for r in rs.mappings().all()]

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

# === Substitution Items ===
@router.get("/substitutions/by-mission/{mission_id}", response_model=list[SubstitutionItemOut])
async def list_substitution_items(mission_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from substitution_items where mission_id=:id order by created_at desc"), {"id": mission_id})
    return [dict(r) for r in rs.mappings().all()]

@router.post("/substitutions", response_model=SubstitutionItemOut)
async def create_substitution_item(payload: SubstitutionItemCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into substitution_items (id, mission_id, name, lifetime_weeks, notes)
        values (gen_random_uuid(), :mission_id, :name, :lifetime_weeks, :notes)
        returning *;
    """), {
        "mission_id": payload.mission_id,
        "name": payload.name,
        "lifetime_weeks": payload.lifetime_weeks,
        "notes": payload.notes
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.post("/substitutions/link", response_model=ItemSubstitutionOut)
async def create_item_substitution(payload: ItemSubstitutionCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into item_substitutions (id, item_id, substitute_id)
        values (gen_random_uuid(), :item_id, :substitute_id)
        returning *;
    """), {
        "item_id": payload.item_id,
        "substitute_id": payload.substitute_id
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.post("/substitutions/{substitution_id}/waste", response_model=SubstitutionItemWasteOut)
async def create_substitution_waste(substitution_id: str, payload: SubstitutionItemWasteCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into substitution_item_waste (id, substitution_id, week, waste_id, expected_mass_kg)
        values (gen_random_uuid(), :substitution_id, :week, :waste_id, :expected_mass_kg)
        returning *;
    """), {
        "substitution_id": substitution_id,
        "week": payload.week,
        "waste_id": payload.waste_id,
        "expected_mass_kg": payload.expected_mass_kg
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.post("/substitutions/{substitution_id}/inputs", response_model=SubstitutionItemInputOut)
async def create_substitution_input(substitution_id: str, payload: SubstitutionItemInputCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into substitution_item_inputs (id, substitution_id, material_id, qty_per_unit_kg)
        values (gen_random_uuid(), :substitution_id, :material_id, :qty_per_unit_kg)
        returning *;
    """), {
        "substitution_id": substitution_id,
        "material_id": payload.material_id,
        "qty_per_unit_kg": payload.qty_per_unit_kg
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.delete("/substitutions/{substitution_id}", status_code=status.HTTP_200_OK)
async def delete_substitution_item(substitution_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from substitution_items where id=:id returning id"), {"id": substitution_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Substitution item not found")
    return {"success": True, "message": "Substitution item deleted successfully."}
