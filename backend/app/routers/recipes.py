from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_db 
from app.models.recipes import (
    RecipeCreate, RecipeOut, RecipeInputCreate, RecipeInputOut, 
    RecipeOutputCreate, RecipeOutputOut, RecipeMaterialScoreCreate, RecipeMaterialScoreOut
)

router = APIRouter(prefix="/recipes", tags=["recipes"])

@router.get("", response_model=list[RecipeOut])
async def list_recipes(db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from recipes order by created_at desc"))
    return [dict(r) for r in rs.mappings().all()]

@router.post("", response_model=RecipeOut)
async def create_recipe(payload: RecipeCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
      insert into recipes
      (id,name,description,per_day_capacity_kg,volume_constraints,tools_required,feasibility_score_default,
       crew_time_min_per_kg,energy_kwh_per_kg,water_l_per_kg,safety_flags,version,created_by)
      values (gen_random_uuid(), :name,:desc,:cap,:vc,:tools,:fs,:ct,:e,:w,:safe,:ver,null) returning *;
    """), {
        "name": payload.name,
        "desc": payload.description,
        "cap": payload.per_day_capacity_kg,
        "vc": payload.volume_constraints,
        "tools": payload.tools_required,
        "fs": payload.feasibility_score_default,
        "ct": payload.crew_time_min_per_kg,
        "e": payload.energy_kwh_per_kg,
        "w": payload.water_l_per_kg,
        "safe": payload.safety_flags,
        "ver": payload.version
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.get("/{recipe_id}", response_model=RecipeOut)
async def get_recipe(recipe_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from recipes where id = :id"), {"id": recipe_id})
    recipe = rs.mappings().first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return dict(recipe)

@router.get("/{recipe_id}/inputs", response_model=list[RecipeInputOut])
async def get_recipe_inputs(recipe_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from recipe_inputs where recipe_id = :id"), {"id": recipe_id})
    return [dict(r) for r in rs.mappings().all()]

@router.get("/{recipe_id}/outputs", response_model=list[RecipeOutputOut])
async def get_recipe_outputs(recipe_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from recipe_outputs where recipe_id = :id"), {"id": recipe_id})
    return [dict(r) for r in rs.mappings().all()]

@router.get("/{recipe_id}/scores", response_model=list[RecipeMaterialScoreOut])
async def get_recipe_scores(recipe_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from recipe_material_scores where recipe_id = :id"), {"id": recipe_id})
    return [dict(r) for r in rs.mappings().all()]

@router.post("/inputs", response_model=RecipeInputOut)
async def add_input(payload: RecipeInputCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into recipe_inputs (id, recipe_id, waste_id, min_qty_kg, preferred_qty_kg)
        values (gen_random_uuid(), :rid,:wid,:min,:pref) returning *;
    """), {"rid": payload.recipe_id, "wid": payload.waste_id, "min": payload.min_qty_kg, "pref": payload.preferred_qty_kg})
    await db.commit()
    return dict(rs.mappings().first())

@router.post("/outputs", response_model=RecipeOutputOut)
async def add_output(payload: RecipeOutputCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into recipe_outputs (id, recipe_id, output_function, qty_per_kg_in, units_label, notes)
        values (gen_random_uuid(), :rid,:func,:qty,:unit,:notes) returning *;
    """), {"rid": payload.recipe_id, "func": payload.output_function, "qty": payload.qty_per_kg_in, "unit": payload.units_label, "notes": payload.notes})
    await db.commit()
    return dict(rs.mappings().first())

@router.post("/scores", response_model=RecipeMaterialScoreOut)
async def add_score(payload: RecipeMaterialScoreCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into recipe_material_scores (id, recipe_id, material_id, feasibility_score, expected_yield, crew_time_modifier, risk_numeric)
        values (gen_random_uuid(), :rid,:mid,:fs,:ey,:ctm,:risk)
        on conflict (recipe_id, material_id) do update set
          feasibility_score=excluded.feasibility_score,
          expected_yield=excluded.expected_yield,
          crew_time_modifier=excluded.crew_time_modifier,
          risk_numeric=excluded.risk_numeric
        returning *;
    """), {
      "rid": payload.recipe_id,
      "mid": payload.material_id,
      "fs": payload.feasibility_score,
      "ey": payload.expected_yield,
      "ctm": payload.crew_time_modifier,
      "risk": payload.risk_numeric
    })
    await db.commit()
    return dict(rs.mappings().first())

@router.delete("/inputs/{input_id}", status_code=status.HTTP_200_OK)
async def delete_recipe_input(input_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from recipe_inputs where id=:id returning id"), {"id": input_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Recipe input not found")
    return {"success": True, "message": "Recipe input deleted successfully."}

@router.delete("/outputs/{output_id}", status_code=status.HTTP_200_OK)
async def delete_recipe_output(output_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from recipe_outputs where id=:id returning id"), {"id": output_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Recipe output not found")
    return {"success": True, "message": "Recipe output deleted successfully."}

@router.delete("/scores/{score_id}", status_code=status.HTTP_200_OK)
async def delete_recipe_score(score_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from recipe_material_scores where id=:id returning id"), {"id": score_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Recipe score not found")
    return {"success": True, "message": "Recipe score deleted successfully."}

@router.delete("/{recipe_id}", status_code=status.HTTP_200_OK)
async def delete_recipe(recipe_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from recipes where id=:id returning id"), {"id": recipe_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"success": True, "message": "Recipe deleted successfully."}
