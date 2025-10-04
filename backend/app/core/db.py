# app/core/db.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
from app.core.config import get_settings

_engine = None
_SessionLocal = None

def _ensure_engine():
    global _engine, _SessionLocal
    if _engine is None:
        settings = get_settings()
        if not settings.SUPABASE_DB_URL:
            raise RuntimeError("SUPABASE_DB_URL is not set. Check your .env or environment.")
        _engine = create_async_engine(settings.SUPABASE_DB_URL, pool_pre_ping=True, future=True)
        _SessionLocal = async_sessionmaker(_engine, expire_on_commit=False, class_=AsyncSession)

def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    _ensure_engine()
    return _SessionLocal

async def ping():
    _ensure_engine()
    async with _engine.begin() as conn:
        await conn.execute(text("select 1"))

# === FastAPI dependency ===
async def get_db():
    SessionLocal = get_sessionmaker()
    session = SessionLocal()
    try:
        yield session
    finally:
        await session.close()
