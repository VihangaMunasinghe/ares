from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_db
from app.models.global_entities import (
    MaterialGlobalCreate, MaterialGlobalOut,
    MethodGlobalCreate, MethodGlobalOut,
    OutputGlobalCreate, OutputGlobalOut,
    ItemGlobalCreate, ItemGlobalOut,
    SubstituteGlobalCreate, SubstituteGlobalOut,
    RecipeGlobalCreate, RecipeGlobalOut,
    RecipeOutputGlobalCreate, RecipeOutputGlobalOut, RecipeOutputDetailedOut,
    ItemWasteGlobalCreate, ItemWasteGlobalOut,
    SubstituteWasteGlobalCreate, SubstituteWasteGlobalOut,
    SubstituteRecipeGlobalCreate, SubstituteRecipeGlobalOut,
    SubstitutesCanReplaceGlobalCreate, SubstitutesCanReplaceGlobalOut,
    ItemsCatalogOut
)

router = APIRouter(prefix="/global", tags=["global-entities"])

def convert_db_row(row):
    """Convert database row with UUIDs and datetimes to strings"""
    result = dict(row)
    for key, value in result.items():
        if hasattr(value, 'hex'):  # UUID object
            result[key] = str(value)
        elif hasattr(value, 'isoformat'):  # datetime object
            result[key] = value.isoformat()
    return result

# === MATERIALS GLOBAL ===
@router.get("/materials", response_model=list[MaterialGlobalOut])
async def list_materials_global(db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from materials_global order by created_at desc"))
    return [dict(r) for r in rs.mappings().all()]

@router.post("/materials", response_model=MaterialGlobalOut)
async def create_material_global(payload: MaterialGlobalCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into materials_global (id, key, name, category, default_mass_per_unit, max_input_capacity_kg, tags, safety_flags, created_by)
        values (gen_random_uuid(), :key, :name, :category, :mass, :capacity, :tags, :safety, null)
        returning *;
    """), {
        "key": payload.key,
        "name": payload.name,
        "category": payload.category,
        "mass": payload.default_mass_per_unit,
        "capacity": payload.max_input_capacity_kg,
        "tags": payload.tags,
        "safety": payload.safety_flags
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.delete("/materials/{material_id}")
async def delete_material_global(material_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from materials_global where id = :id returning id"), {"id": material_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"success": True, "message": "Material deleted successfully"}

# === METHODS GLOBAL ===
@router.get("/methods", response_model=list[MethodGlobalOut])
async def list_methods_global(db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from methods_global order by created_at desc"))
    return [dict(r) for r in rs.mappings().all()]

@router.post("/methods", response_model=MethodGlobalOut)
async def create_method_global(payload: MethodGlobalCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into methods_global (id, key, name, description, min_lot_size, tools_required, availability_default)
        values (gen_random_uuid(), :key, :name, :desc, :min_lot, :tools, :avail)
        returning *;
    """), {
        "key": payload.key,
        "name": payload.name,
        "desc": payload.description,
        "min_lot": payload.min_lot_size,
        "tools": payload.tools_required,
        "avail": payload.availability_default
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.delete("/methods/{method_id}")
async def delete_method_global(method_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from methods_global where id = :id returning id"), {"id": method_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Method not found")
    return {"success": True, "message": "Method deleted successfully"}

# === OUTPUTS GLOBAL ===
@router.get("/outputs", response_model=list[OutputGlobalOut])
async def list_outputs_global(db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from outputs_global order by created_at desc"))
    return [dict(r) for r in rs.mappings().all()]

@router.post("/outputs", response_model=OutputGlobalOut)
async def create_output_global(payload: OutputGlobalCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into outputs_global (id, key, name, units_label, value_per_kg, max_output_capacity_kg)
        values (gen_random_uuid(), :key, :name, :units, :value, :capacity)
        returning *;
    """), {
        "key": payload.key,
        "name": payload.name,
        "units": payload.units_label,
        "value": payload.value_per_kg,
        "capacity": payload.max_output_capacity_kg
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.patch("/outputs/{output_id}", response_model=OutputGlobalOut)
async def update_output_global(output_id: str, payload: OutputGlobalCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        update outputs_global
        set key = :key, name = :name, units_label = :units, value_per_kg = :value, max_output_capacity_kg = :capacity
        where id = :id
        returning *;
    """), {
        "id": output_id,
        "key": payload.key,
        "name": payload.name,
        "units": payload.units_label,
        "value": payload.value_per_kg,
        "capacity": payload.max_output_capacity_kg
    })
    updated = rs.mappings().first()
    await db.commit()
    if not updated:
        raise HTTPException(status_code=404, detail="Output not found")
    return dict(updated)

@router.delete("/outputs/{output_id}")
async def delete_output_global(output_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from outputs_global where id = :id returning id"), {"id": output_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Output not found")
    return {"success": True, "message": "Output deleted successfully"}

# === ITEMS GLOBAL ===
@router.get("/items", response_model=list[ItemGlobalOut])
async def list_items_global(db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from items_global order by created_at desc"))
    return [dict(r) for r in rs.mappings().all()]

@router.post("/items", response_model=ItemGlobalOut)
async def create_item_global(payload: ItemGlobalCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into items_global (id, key, name, units_label, mass_per_unit, lifetime_weeks)
        values (gen_random_uuid(), :key, :name, :units, :mass, :lifetime)
        returning *;
    """), {
        "key": payload.key,
        "name": payload.name,
        "units": payload.units_label,
        "mass": payload.mass_per_unit,
        "lifetime": payload.lifetime_weeks
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.delete("/items/{item_id}")
async def delete_item_global(item_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from items_global where id = :id returning id"), {"id": item_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"success": True, "message": "Item deleted successfully"}

# === ITEMS CATALOG (JOINED DATA) ===
@router.get("/items-catalog", response_model=list[ItemsCatalogOut])
async def list_items_catalog(db: AsyncSession = Depends(get_db)):
    """
    Get items catalog with joined information from items_global, items_waste_global, and materials_global
    Returns items with their composition, waste mappings count, and safety information
    """
    rs = await db.execute(text("""
        WITH item_waste_summary AS (
            SELECT 
                iw.item_id,
                COUNT(iw.id) as waste_mapping_count,
                STRING_AGG(
                    CONCAT(m.name, ': ', ROUND(iw.waste_per_unit::numeric, 3), '%'), 
                    ', ' 
                    ORDER BY iw.waste_per_unit DESC
                ) as composition,
                -- Aggregate safety flags from all materials for this item
                JSONB_OBJECT_AGG(
                    m.name, m.safety_flags
                ) FILTER (WHERE m.safety_flags IS NOT NULL AND m.safety_flags != '{}') as aggregated_safety
            FROM item_waste_global iw
            JOIN materials_global m ON iw.material_id = m.id
            GROUP BY iw.item_id
        ),
        item_categories AS (
            SELECT 
                iw.item_id,
                STRING_AGG(DISTINCT m.category, ', ') as categories
            FROM item_waste_global iw
            JOIN materials_global m ON iw.material_id = m.id
            GROUP BY iw.item_id
        )
        SELECT 
            i.id,
            i.name,
            COALESCE(ic.categories, 'uncategorized') as category,
            i.units_label as unit,
            i.mass_per_unit,
            COALESCE(iws.composition, 'No composition data') as composition,
            COALESCE(iws.waste_mapping_count, 0) as waste_mappings,
            COALESCE(iws.aggregated_safety, '{}'::jsonb) as safety,
            i.created_at
        FROM items_global i
        LEFT JOIN item_waste_summary iws ON i.id = iws.item_id
        LEFT JOIN item_categories ic ON i.id = ic.item_id
        ORDER BY i.created_at DESC
    """))
    
    return [convert_db_row(r) for r in rs.mappings().all()]

# === ITEM WASTE RELATIONSHIPS ===
@router.get("/item-waste", response_model=list[ItemWasteGlobalOut])
async def list_item_waste_global(db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from item_waste_global order by item_id"))
    return [dict(r) for r in rs.mappings().all()]

@router.post("/item-waste", response_model=ItemWasteGlobalOut)
async def create_item_waste_global(payload: ItemWasteGlobalCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into item_waste_global (id, item_id, material_id, waste_per_unit)
        values (gen_random_uuid(), :item_id, :material_id, :waste_per_unit)
        returning *;
    """), {
        "item_id": payload.item_id,
        "material_id": payload.material_id,
        "waste_per_unit": payload.waste_per_unit
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.delete("/item-waste/{item_waste_id}")
async def delete_item_waste_global(item_waste_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from item_waste_global where id = :id returning id"), {"id": item_waste_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Item waste relationship not found")
    return {"success": True, "message": "Item waste relationship deleted successfully"}

# === SUBSTITUTES GLOBAL ===
@router.get("/substitutes", response_model=list[SubstituteGlobalOut])
async def list_substitutes_global(db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from substitutes_global order by created_at desc"))
    return [dict(r) for r in rs.mappings().all()]

@router.post("/substitutes", response_model=SubstituteGlobalOut)
async def create_substitute_global(payload: SubstituteGlobalCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into substitutes_global (id, key, name, value_per_unit, lifetime_weeks)
        values (gen_random_uuid(), :key, :name, :value, :lifetime)
        returning *;
    """), {
        "key": payload.key,
        "name": payload.name,
        "value": payload.value_per_unit,
        "lifetime": payload.lifetime_weeks
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.delete("/substitutes/{substitute_id}")
async def delete_substitute_global(substitute_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from substitutes_global where id = :id returning id"), {"id": substitute_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Substitute not found")
    return {"success": True, "message": "Substitute deleted successfully"}

# === RECIPES GLOBAL ===
@router.get("/recipes", response_model=list[RecipeGlobalOut])
async def list_recipes_global(db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from recipes_global order by created_at desc"))
    return [convert_db_row(r) for r in rs.mappings().all()]

# === GET RECIPE BY MATERIAL & METHOD ===
from pydantic import BaseModel

class RecipeByMaterialMethodRequest(BaseModel):
    material_id: str
    method_id: str

@router.post("/recipe-by-material-method", response_model=RecipeGlobalOut)
async def get_recipe_by_material_method_post(payload: RecipeByMaterialMethodRequest, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        select * from recipes_global
        where material_id = :material_id and method_id = :method_id
        limit 1
    """), {"material_id": payload.material_id, "method_id": payload.method_id})
    recipe = rs.mappings().first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found for given material and method")
    return convert_db_row(recipe)

@router.post("/recipes", response_model=RecipeGlobalOut)
async def create_recipe_global(payload: RecipeGlobalCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into recipes_global (id, material_id, method_id, crew_cost_per_kg, energy_cost_kwh_per_kg, risk_cost)
        values (gen_random_uuid(), :material_id, :method_id, :crew_cost, :energy_cost, :risk_cost)
        returning *;
    """), {
        "material_id": payload.material_id,
        "method_id": payload.method_id,
        "crew_cost": payload.crew_cost_per_kg,
        "energy_cost": payload.energy_cost_kwh_per_kg,
        "risk_cost": payload.risk_cost
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.delete("/recipes/{recipe_id}")
async def delete_recipe_global(recipe_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from recipes_global where id = :id returning id"), {"id": recipe_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"success": True, "message": "Recipe deleted successfully"}

# === RECIPE OUTPUTS ===
@router.get("/recipe-outputs/{recipe_id}", response_model=list[RecipeOutputGlobalOut])
async def list_recipe_outputs(recipe_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from recipe_outputs_global where recipe_id = :recipe_id"), {"recipe_id": recipe_id})
    return [dict(r) for r in rs.mappings().all()]

@router.get("/recipe-outputs-detailed/{recipe_id}", response_model=list[RecipeOutputDetailedOut])
async def list_recipe_outputs_detailed(recipe_id: str, db: AsyncSession = Depends(get_db)):
    """Get detailed output information for a recipe including output details and yield ratios"""
    rs = await db.execute(text("""
        SELECT 
            ro.id as recipe_output_id,
            ro.recipe_id,
            ro.output_id,
            ro.yield_ratio,
            o.key as output_key,
            o.name as output_name,
            o.units_label,
            o.value_per_kg,
            o.max_output_capacity_kg,
            o.created_at as output_created_at
        FROM recipe_outputs_global ro
        JOIN outputs_global o ON ro.output_id = o.id
        WHERE ro.recipe_id = :recipe_id
        ORDER BY o.name
    """), {"recipe_id": recipe_id})
    
    return [convert_db_row(r) for r in rs.mappings().all()]

@router.post("/recipe-outputs", response_model=RecipeOutputGlobalOut)
async def create_recipe_output(payload: RecipeOutputGlobalCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into recipe_outputs_global (id, recipe_id, output_id, yield_ratio)
        values (gen_random_uuid(), :recipe_id, :output_id, :yield_ratio)
        returning *;
    """), {
        "recipe_id": payload.recipe_id,
        "output_id": payload.output_id,
        "yield_ratio": payload.yield_ratio
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.delete("/recipe-outputs/{recipe_output_id}")
async def delete_recipe_output(recipe_output_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from recipe_outputs_global where id = :id returning id"), {"id": recipe_output_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Recipe output not found")
    return {"success": True, "message": "Recipe output deleted successfully"}