# app/routers/metrics.py
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db

router = APIRouter(prefix="/metrics", tags=["metrics"])


class MetricBlock(BaseModel):
    count: int
    delta: int | None = None
    extra: int | None = None  # e.g., "in progress" for jobs


class MetricsSummary(BaseModel):
    active_missions: MetricBlock
    total_recipes: MetricBlock
    global_items: MetricBlock  # Changed from planned_items since items are now global
    pending_jobs: MetricBlock


@router.get("/summary", response_model=MetricsSummary)
async def get_summary_metrics(
    db: AsyncSession = Depends(get_db),
    mission_id: Optional[UUID] = Query(
        None,
        description="If provided, Jobs are filtered to this mission; Missions, Recipes & Items remain global."
    ),
):
    # Build conditional WHERE for jobs ONLY if mission_id is present.
    job_where = "/* no mission filter */"
    params: dict = {}

    if mission_id:
        job_where = "where j.mission_id = :mission_id"
        params["mission_id"] = str(mission_id)  # asyncpg will coerce to uuid

    sql = text(f"""
    with bounds as (
        select
            date_trunc('week',  now() at time zone 'utc') as week_start,
            date_trunc('month', now() at time zone 'utc') as month_start
    ),
    active_mission_counts as (
        select
            count(*) filter (where status = 'Running')                                          as active_total,
            count(*) filter (where status = 'Running' and created_at >= b.week_start)           as active_new_this_week
        from missions m
        cross join bounds b
    ),
    recipe_counts as (
        select
            count(*)                                                                            as recipes_total,
            count(*) filter (where created_at >= b.month_start)                                 as recipes_new_this_month
        from recipes_global r
        cross join bounds b
    ),
    item_counts as (
        select
            count(*)                                                                            as items_total
        from items_global ig
        /* Global items - no mission filter available */
    ),
    job_counts as (
        select
            count(*) filter (where status in ('pending'))                                       as jobs_pending,
            count(*) filter (where status in ('running'))                                       as jobs_in_progress
        from jobs j
        {job_where}
    )
    select
        a.active_total,
        a.active_new_this_week,
        r.recipes_total,
        r.recipes_new_this_month,
        i.items_total,
        j.jobs_pending,
        j.jobs_in_progress
    from active_mission_counts a,
         recipe_counts r,
         item_counts i,
         job_counts j;
    """)

    rs = await db.execute(sql, params)
    row = rs.mappings().first() or {}

    return MetricsSummary(
        active_missions=MetricBlock(
            count=int(row.get("active_total", 0)),
            delta=int(row.get("active_new_this_week", 0)),
        ),
        total_recipes=MetricBlock(
            count=int(row.get("recipes_total", 0)),
            delta=int(row.get("recipes_new_this_month", 0)),
        ),
        global_items=MetricBlock(
            count=int(row.get("items_total", 0)),
        ),
        pending_jobs=MetricBlock(
            count=int(row.get("jobs_pending", 0)),
            extra=int(row.get("jobs_in_progress", 0)),
        ),
    )
