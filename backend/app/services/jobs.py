from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime

async def append_log(db: AsyncSession, job_id: str, message: str, level: str = "info"):
    await db.execute(
        text("insert into job_logs (id, job_id, ts, level, message) values (gen_random_uuid(), :jid, now(), :lvl, :msg)"),
        {"jid": job_id, "lvl": level, "msg": message},
    )
    await db.commit()

async def cancel_job(db: AsyncSession, job_id: str):
    await db.execute(text("update jobs set status='canceled', updated_at=now() where id=:jid"), {"jid": job_id})
    await append_log(db, job_id, "Job canceled by user", "warn")
