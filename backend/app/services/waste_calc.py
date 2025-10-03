from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

async def recompute_item_waste(db: AsyncSession, item_id: str):
    """
    Recomputes manifest_item_waste rows for a given manifest item.
    Uses:
      - manifest_items (qty, mass_per_unit_kg, usage pattern, weeks/map)
      - materials -> waste_streams (expected_yield_ratio)
      - missions (duration_weeks if needed for throughout distribution)
    """
    # Load item, mission duration, material’s waste streams
    q = text("""
    with mi as (
      select m.id as mission_id,
             m.duration_weeks,
             i.id as item_id,
             i.material_id,
             i.qty, i.mass_per_unit_kg, i.usage_pattern,
             i.usage_per_week, i.weeks, i.usage_per_week_map
      from manifest_items i
      join missions m on m.id = i.mission_id
      where i.id = :item_id
    ),
    ws as (
      select w.id as waste_id, w.expected_yield_ratio, w.material_id
      from waste_streams w
      where w.material_id = (select material_id from mi)
    )
    select *
    from mi, ws;
    """)
    rows = (await db.execute(q, {"item_id": item_id})).mappings().all()
    if not rows:
        return

    # Clear existing waste rows
    await db.execute(text("delete from manifest_item_waste where item_id = :item_id"), {"item_id": item_id})

    # Build inserts per week per waste_id
    mi = rows[0]
    duration = int(mi["duration_weeks"])
    usage_pattern = mi["usage_pattern"]
    qty = float(mi["qty"])
    mpu = float(mi["mass_per_unit_kg"])

    # determine weekly usage
    weekly_map = {}
    if usage_pattern == "throughout":
        per_week = float(mi["usage_per_week"] or 0)
        for w in range(1, duration + 1):
            weekly_map[w] = per_week
    else:
        # specific weeks
        # usage_per_week_map is json: {"4": 10, "8": 10, ...}
        # or legacy: same value each selected week
        weeks = mi["weeks"] or []
        rawmap = mi["usage_per_week_map"] or {}
        for w in weeks:
            val = rawmap.get(str(w), rawmap.get(w, 0)) if isinstance(rawmap, dict) else 0
            weekly_map[w] = float(val or 0)

    # group waste streams (may be multiple)
    inserts = []
    for r in rows:
        waste_id = r["waste_id"]
        yield_ratio = float(r["expected_yield_ratio"] or 0)
        for w, used in weekly_map.items():
            # expected waste mass = (used units) * mass_per_unit_kg * yield_ratio
            exp_mass = used * mpu * yield_ratio
            if exp_mass <= 0:
                continue
            inserts.append({"waste_id": waste_id, "week": w, "expected_mass_kg": exp_mass})

    if inserts:
        # batch insert
        values_sql = ", ".join(
            [f"(:item_id, :w{idx}, :waste{idx}, :mass{idx})" for idx, _ in enumerate(inserts)]
        )
        params = {"item_id": item_id}
        for idx, ins in enumerate(inserts):
            params[f"w{idx}"] = ins["week"]
            params[f"waste{idx}"] = ins["waste_id"]
            params[f"mass{idx}"] = ins["expected_mass_kg"]

        sql = text(f"""
            insert into manifest_item_waste (item_id, week, waste_id, expected_mass_kg)
            values {values_sql}
            on conflict (item_id, week, waste_id) do update
            set expected_mass_kg = excluded.expected_mass_kg;
        """)
        await db.execute(sql, params)
    await db.commit()
