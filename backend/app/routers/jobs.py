from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sse_starlette.sse import EventSourceResponse
import asyncio
from app.core.db import get_db 
from app.models.jobs import JobCreate
from app.services.jobs import append_log, cancel_job

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/by-mission/{mission_id}")
async def list_jobs(mission_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from jobs where mission_id=:id order by created_at desc"), {"id": mission_id})
    return [dict(r) for r in rs.mappings().all()]

@router.get("/{job_id}")
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("select * from jobs where id=:id"), {"id": job_id})
    row = rs.mappings().first()
    if not row: raise HTTPException(404, "Job not found")
    return dict(row)

@router.post("")
async def start_job(payload: JobCreate, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("""
        insert into jobs (id, mission_id, created_by, status, params)
        values (gen_random_uuid(), :mid, null, :st, :params)
        returning id;
    """), {"mid": payload.mission_id, "st": payload.status, "params": payload.params})
    jid = rs.mappings().first()["id"]
    await db.commit()
    # demo: append a couple of logs so SSE has something
    await append_log(db, jid, "Optimizer queued")
    return {"job_id": jid, "status": "queued"}

@router.post("/{job_id}/cancel")
async def cancel(job_id: str, db: AsyncSession = Depends(get_db)):
    await cancel_job(db, job_id)
    return {"job_id": job_id, "status": "canceled"}

@router.get("/{job_id}/events")
async def stream_events(job_id: str, db: AsyncSession = Depends(get_db)):
    async def event_generator():
        last_count = -1
        while True:
            rs = await db.execute(text("select ts, level, message from job_logs where job_id=:id order by ts asc"), {"id": job_id})
            logs = rs.mappings().all()
            if len(logs) != last_count:
                # stream only the latest line
                line = logs[-1] if logs else None
                if line:
                    yield {"event": "log", "data": f"{line['ts']} [{line['level']}] {line['message']}"}
                last_count = len(logs)
            await asyncio.sleep(2)
    return EventSourceResponse(event_generator())

@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
async def delete_job(job_id: str, db: AsyncSession = Depends(get_db)):
    rs = await db.execute(text("delete from jobs where id=:id returning id"), {"id": job_id})
    deleted = rs.mappings().first()
    await db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"success": True, "message": "Job deleted successfully."}
