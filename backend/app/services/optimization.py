from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Dict, Any

async def prepare_optimization_data(db: AsyncSession, job_id: str) -> Dict[str, Any]:
    """
    Transform database data into the format expected by the optimization model.
    This follows the new global-job architecture where global entities are referenced
    by job-specific configuration tables.
    """
    
    # Get job details
    job_rs = await db.execute(text("select * from jobs where id = :job_id"), {"job_id": job_id})
    job = job_rs.mappings().first()
    if not job:
        raise ValueError(f"Job {job_id} not found")
    
    # Get enabled entities for this job
    materials_rs = await db.execute(text("""
        select m.key, m.id from materials_global m
        join job_enabled_materials jem on m.id = jem.material_id
        where jem.job_id = :job_id
    """), {"job_id": job_id})
    materials = [r["key"] for r in materials_rs.mappings().all()]
    
    methods_rs = await db.execute(text("""
        select m.key, m.id from methods_global m
        join job_enabled_methods jem on m.id = jem.method_id
        where jem.job_id = :job_id
    """), {"job_id": job_id})
    methods = [r["key"] for r in methods_rs.mappings().all()]
    
    outputs_rs = await db.execute(text("""
        select o.key, o.id from outputs_global o
        join job_enabled_outputs jeo on o.id = jeo.output_id
        where jeo.job_id = :job_id
    """), {"job_id": job_id})
    outputs = [r["key"] for r in outputs_rs.mappings().all()]
    
    items_rs = await db.execute(text("""
        select i.key, i.id from items_global i
        join job_enabled_items jei on i.id = jei.item_id
        where jei.job_id = :job_id
    """), {"job_id": job_id})
    items = [r["key"] for r in items_rs.mappings().all()]
    
    substitutes_rs = await db.execute(text("""
        select s.key, s.id from substitutes_global s
        join job_enabled_substitutes jes on s.id = jes.substitute_id
        where jes.job_id = :job_id
    """), {"job_id": job_id})
    substitutes = [r["key"] for r in substitutes_rs.mappings().all()]
    
    # Generate weeks list
    weeks = list(range(1, job["total_weeks"] + 1))
    
    # Get recipe-based yields
    yields_rs = await db.execute(text("""
        select mg.key as material, met.key as method, og.key as output, rog.yield_ratio
        from recipes_global rg
        join materials_global mg on rg.material_id = mg.id
        join methods_global met on rg.method_id = met.id
        join recipe_outputs_global rog on rg.id = rog.recipe_id
        join outputs_global og on rog.output_id = og.id
        join job_enabled_materials jem on mg.id = jem.material_id
        join job_enabled_methods jeme on met.id = jeme.method_id
        join job_enabled_outputs jeo on og.id = jeo.output_id
        where jem.job_id = :job_id and jeme.job_id = :job_id and jeo.job_id = :job_id
    """), {"job_id": job_id})
    
    yields = {}
    for r in yields_rs.mappings().all():
        yields[(r["material"], r["method"], r["output"])] = r["yield_ratio"]
    
    # Get method costs
    crew_cost_rs = await db.execute(text("""
        select met.key as method, avg(rg.crew_cost_per_kg) as avg_crew_cost
        from recipes_global rg
        join methods_global met on rg.method_id = met.id
        join job_enabled_methods jem on met.id = jem.method_id
        where jem.job_id = :job_id
        group by met.key
    """), {"job_id": job_id})
    crew_cost = {r["method"]: r["avg_crew_cost"] for r in crew_cost_rs.mappings().all()}
    
    energy_cost_rs = await db.execute(text("""
        select met.key as method, avg(rg.energy_cost_kwh_per_kg) as avg_energy_cost
        from recipes_global rg
        join methods_global met on rg.method_id = met.id
        join job_enabled_methods jem on met.id = jem.method_id
        where jem.job_id = :job_id
        group by met.key
    """), {"job_id": job_id})
    energy_cost = {r["method"]: r["avg_energy_cost"] for r in energy_cost_rs.mappings().all()}
    
    risk_cost_rs = await db.execute(text("""
        select met.key as method, avg(rg.risk_cost) as avg_risk_cost
        from recipes_global rg
        join methods_global met on rg.method_id = met.id
        join job_enabled_methods jem on met.id = jem.method_id
        where jem.job_id = :job_id
        group by met.key
    """), {"job_id": job_id})
    risk_cost = {r["method"]: r["avg_risk_cost"] for r in risk_cost_rs.mappings().all()}
    
    # Get initial inventories
    material_inv_rs = await db.execute(text("""
        select mg.key, jmi.qty_kg
        from job_material_inventory jmi
        join materials_global mg on jmi.material_id = mg.id
        where jmi.job_id = :job_id
    """), {"job_id": job_id})
    material_inventory = {r["key"]: r["qty_kg"] for r in material_inv_rs.mappings().all()}
    
    output_inv_rs = await db.execute(text("""
        select og.key, joi.qty_kg
        from job_output_inventory joi
        join outputs_global og on joi.output_id = og.id
        where joi.job_id = :job_id
    """), {"job_id": job_id})
    output_inventory = {r["key"]: r["qty_kg"] for r in output_inv_rs.mappings().all()}
    
    item_inv_rs = await db.execute(text("""
        select ig.key, jii.qty_units
        from job_item_inventory jii
        join items_global ig on jii.item_id = ig.id
        where jii.job_id = :job_id
    """), {"job_id": job_id})
    item_inventory = {r["key"]: r["qty_units"] for r in item_inv_rs.mappings().all()}
    
    substitute_inv_rs = await db.execute(text("""
        select sg.key, jsi.qty_units
        from job_substitute_inventory jsi
        join substitutes_global sg on jsi.substitute_id = sg.id
        where jsi.job_id = :job_id
    """), {"job_id": job_id})
    substitute_inventory = {r["key"]: r["qty_units"] for r in substitute_inv_rs.mappings().all()}
    
    initial_inventory = {
        'materials': material_inventory,
        'outputs': output_inventory,
        'items': item_inventory,
        'substitutes': substitute_inventory
    }
    
    # Get item properties
    item_lifetime_rs = await db.execute(text("""
        select ig.key, ig.lifetime_weeks
        from items_global ig
        join job_enabled_items jei on ig.id = jei.item_id
        where jei.job_id = :job_id
    """), {"job_id": job_id})
    item_lifetime = {r["key"]: r["lifetime_weeks"] for r in item_lifetime_rs.mappings().all()}
    
    item_mass_rs = await db.execute(text("""
        select ig.key, ig.mass_per_unit
        from items_global ig
        join job_enabled_items jei on ig.id = jei.item_id
        where jei.job_id = :job_id
    """), {"job_id": job_id})
    item_mass = {r["key"]: r["mass_per_unit"] for r in item_mass_rs.mappings().all()}
    
    # Get item waste patterns
    item_waste_rs = await db.execute(text("""
        select ig.key as item_key, mg.key as material_key, iwg.waste_per_unit
        from item_waste_global iwg
        join items_global ig on iwg.item_id = ig.id
        join materials_global mg on iwg.material_id = mg.id
        join job_enabled_items jei on ig.id = jei.item_id
        join job_enabled_materials jem on mg.id = jem.material_id
        where jei.job_id = :job_id and jem.job_id = :job_id
    """), {"job_id": job_id})
    item_waste = {(r["item_key"], r["material_key"]): r["waste_per_unit"] for r in item_waste_rs.mappings().all()}
    
    # Get substitute properties
    substitute_lifetime_rs = await db.execute(text("""
        select sg.key, sg.lifetime_weeks
        from substitutes_global sg
        join job_enabled_substitutes jes on sg.id = jes.substitute_id
        where jes.job_id = :job_id
    """), {"job_id": job_id})
    substitute_lifetime = {r["key"]: r["lifetime_weeks"] for r in substitute_lifetime_rs.mappings().all()}
    
    substitute_values_rs = await db.execute(text("""
        select sg.key, sg.value_per_unit
        from substitutes_global sg
        join job_enabled_substitutes jes on sg.id = jes.substitute_id
        where jes.job_id = :job_id
    """), {"job_id": job_id})
    substitute_values = {r["key"]: r["value_per_unit"] for r in substitute_values_rs.mappings().all()}
    
    # Get substitute waste patterns
    substitute_waste_rs = await db.execute(text("""
        select sg.key as substitute_key, mg.key as material_key, swg.waste_per_unit
        from substitute_waste_global swg
        join substitutes_global sg on swg.substitute_id = sg.id
        join materials_global mg on swg.material_id = mg.id
        join job_enabled_substitutes jes on sg.id = jes.substitute_id
        join job_enabled_materials jem on mg.id = jem.material_id
        where jes.job_id = :job_id and jem.job_id = :job_id
    """), {"job_id": job_id})
    substitute_waste = {(r["substitute_key"], r["material_key"]): r["waste_per_unit"] for r in substitute_waste_rs.mappings().all()}
    
    # Get demands
    demands_rs = await db.execute(text("""
        select ig.key as item_key, jid.week, jid.amount
        from job_item_demands jid
        join items_global ig on jid.item_id = ig.id
        where jid.job_id = :job_id
    """), {"job_id": job_id})
    item_demands = {(r["item_key"], r["week"]): r["amount"] for r in demands_rs.mappings().all()}
    
    # Get deadlines
    deadlines_rs = await db.execute(text("""
        select ig.key as item_key, jd.week, jd.amount
        from job_deadlines jd
        join items_global ig on jd.item_id = ig.id
        where jd.job_id = :job_id
    """), {"job_id": job_id})
    deadlines = [{"item": r["item_key"], "week": r["week"], "amount": r["amount"]} for r in deadlines_rs.mappings().all()]
    
    # Get resource constraints
    resources_rs = await db.execute(text("""
        select week, crew_available, energy_available
        from job_week_resources
        where job_id = :job_id
    """), {"job_id": job_id})
    crew_available = {}
    energy_available = {}
    for r in resources_rs.mappings().all():
        crew_available[r["week"]] = r["crew_available"]
        energy_available[r["week"]] = r["energy_available"]
    
    # Get method capacity
    capacity_rs = await db.execute(text("""
        select mg.key as method_key, jmc.week, jmc.max_capacity_kg, jmc.available
        from job_method_capacity jmc
        join methods_global mg on jmc.method_id = mg.id
        where jmc.job_id = :job_id
    """), {"job_id": job_id})
    max_capacity = {}
    availability = {}
    for r in capacity_rs.mappings().all():
        max_capacity[(r["method_key"], r["week"])] = r["max_capacity_kg"]
        availability[(r["method_key"], r["week"])] = 1 if r["available"] else 0
    
    # Get global properties
    output_capacity_rs = await db.execute(text("""
        select og.key, og.max_output_capacity_kg
        from outputs_global og
        join job_enabled_outputs jeo on og.id = jeo.output_id
        where jeo.job_id = :job_id
    """), {"job_id": job_id})
    output_capacity = {r["key"]: r["max_output_capacity_kg"] for r in output_capacity_rs.mappings().all() if r["max_output_capacity_kg"] is not None}
    
    input_capacity_rs = await db.execute(text("""
        select mg.key, mg.max_input_capacity_kg
        from materials_global mg
        join job_enabled_materials jem on mg.id = jem.material_id
        where jem.job_id = :job_id
    """), {"job_id": job_id})
    input_capacity = {r["key"]: r["max_input_capacity_kg"] for r in input_capacity_rs.mappings().all() if r["max_input_capacity_kg"] is not None}
    
    # Get method properties
    min_lot_size_rs = await db.execute(text("""
        select mg.key, mg.min_lot_size
        from methods_global mg
        join job_enabled_methods jem on mg.id = jem.method_id
        where jem.job_id = :job_id
    """), {"job_id": job_id})
    min_lot_size = {r["key"]: r["min_lot_size"] for r in min_lot_size_rs.mappings().all()}
    
    output_values_rs = await db.execute(text("""
        select og.key, og.value_per_kg
        from outputs_global og
        join job_enabled_outputs jeo on og.id = jeo.output_id
        where jeo.job_id = :job_id
    """), {"job_id": job_id})
    output_values = {r["key"]: r["value_per_kg"] for r in output_values_rs.mappings().all()}
    
    # Get substitute make recipes
    substitute_recipe_rs = await db.execute(text("""
        select sg.key as substitute_key, og.key as output_key, srg.ratio_output_per_substitute
        from substitute_recipes_global srg
        join substitutes_global sg on srg.substitute_id = sg.id
        join outputs_global og on srg.output_id = og.id
        join job_enabled_substitutes jes on sg.id = jes.substitute_id
        join job_enabled_outputs jeo on og.id = jeo.output_id
        where jes.job_id = :job_id and jeo.job_id = :job_id
    """), {"job_id": job_id})
    substitute_make_recipe = {(r["substitute_key"], r["output_key"]): r["ratio_output_per_substitute"] for r in substitute_recipe_rs.mappings().all()}
    
    # Get substitution relationships
    can_replace_rs = await db.execute(text("""
        select ig.key as item_key, sg.key as substitute_key
        from substitutes_can_replace_global scrg
        join items_global ig on scrg.item_id = ig.id
        join substitutes_global sg on scrg.substitute_id = sg.id
        join job_enabled_items jei on ig.id = jei.item_id
        join job_enabled_substitutes jes on sg.id = jes.substitute_id
        where jei.job_id = :job_id and jes.job_id = :job_id
    """), {"job_id": job_id})
    substitutes_can_replace = {}
    for r in can_replace_rs.mappings().all():
        if r["item_key"] not in substitutes_can_replace:
            substitutes_can_replace[r["item_key"]] = []
        substitutes_can_replace[r["item_key"]].append(r["substitute_key"])
    
    # Optimization weights from job
    weights = {
        'mass': job['w_mass'],
        'value': job['w_value'],
        'crew': job['w_crew'],
        'energy': job['w_energy'],
        'risk': job['w_risk'],
        'make': job['w_make'],
        'carry': job['w_carry'],
        'shortage': job['w_shortage']
    }
    
    return {
        # Core Entity Lists
        'materials': materials,
        'methods': methods,
        'outputs': outputs,
        'items': items,
        'substitutes': substitutes,
        'weeks': weeks,
        
        # Recipe-based production
        'yields': yields,
        'crew_cost': crew_cost,
        'energy_cost': energy_cost,
        'risk_cost': risk_cost,
        
        # Initial inventories
        'initial_inventory': initial_inventory,
        
        # Item properties
        'item_lifetime': item_lifetime,
        'item_mass': item_mass,
        'item_waste': item_waste,
        
        # Substitute properties
        'substitute_lifetime': substitute_lifetime,
        'substitute_values': substitute_values,
        'substitute_waste': substitute_waste,
        'substitute_assembly_crew': {s: 0.0 for s in substitutes},  # TODO: Add to schema
        'substitute_assembly_energy': {s: 0.0 for s in substitutes},  # TODO: Add to schema
        
        # Demands and deadlines
        'item_demands': item_demands,
        'deadlines': deadlines,
        
        # Resource constraints
        'max_capacity': max_capacity,
        'availability': availability,
        'crew_available': crew_available,
        'energy_available': energy_available,
        
        # Capacity constraints
        'output_capacity': output_capacity,
        'input_capacity': input_capacity,
        
        # Method properties
        'min_lot_size': min_lot_size,
        'output_values': output_values,
        
        # Relationships
        'substitute_make_recipe': substitute_make_recipe,
        'substitutes_can_replace': substitutes_can_replace,
        
        # Optimization weights
        'weights': weights
    }


async def store_optimization_results(db: AsyncSession, job_id: str, results: Dict[str, Any]):
    """
    Store optimization results back to the database in the new result tables format.
    """
    
    # Store summary results
    if 'summary' in results:
        summary = results['summary']
        await db.execute(text("""
            insert into job_result_summary (
                job_id, objective_value, total_processed_kg, total_output_produced_kg,
                total_substitutes_made, total_initial_carriage_weight,
                total_final_carriage_weight, total_carried_weight_loss
            ) values (
                :job_id, :obj_val, :processed, :output_produced, :subs_made,
                :initial_weight, :final_weight, :weight_loss
            ) on conflict (job_id) do update set
                objective_value = excluded.objective_value,
                total_processed_kg = excluded.total_processed_kg,
                total_output_produced_kg = excluded.total_output_produced_kg,
                total_substitutes_made = excluded.total_substitutes_made,
                total_initial_carriage_weight = excluded.total_initial_carriage_weight,
                total_final_carriage_weight = excluded.total_final_carriage_weight,
                total_carried_weight_loss = excluded.total_carried_weight_loss
        """), {
            "job_id": job_id,
            "obj_val": summary.get('objective_value', 0),
            "processed": summary.get('total_processed_kg', 0),
            "output_produced": summary.get('total_output_produced_kg', 0),
            "subs_made": summary.get('total_substitutes_made', 0),
            "initial_weight": summary.get('total_initial_carriage_weight', 0),
            "final_weight": summary.get('total_final_carriage_weight', 0),
            "weight_loss": summary.get('total_carried_weight_loss', 0)
        })
    
    # Store schedule results
    if 'schedule' in results:
        # Clear existing schedule results
        await db.execute(text("delete from job_result_schedule where job_id = :job_id"), {"job_id": job_id})
        
        for schedule_item in results['schedule']:
            # Note: Need to map recipe_id - this requires additional lookup logic
            await db.execute(text("""
                insert into job_result_schedule (
                    id, job_id, week, recipe_id, processed_kg, is_running, materials_processed
                ) values (
                    gen_random_uuid(), :job_id, :week, :recipe_id, :processed_kg, :is_running, :materials
                )
            """), {
                "job_id": job_id,
                "week": schedule_item.get('week'),
                "recipe_id": schedule_item.get('recipe_id'),  # TODO: Map from material/method keys
                "processed_kg": schedule_item.get('processed_kg', 0),
                "is_running": schedule_item.get('is_running', False),
                "materials": schedule_item.get('materials_processed', {})
            })
    
    # Store other result types similarly...
    # (outputs, items, substitutes, substitute_breakdown, weight_loss)
    
    await db.commit()