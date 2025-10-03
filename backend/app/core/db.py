from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
from .config import get_settings

settings = get_settings()
engine = create_async_engine(settings.SUPABASE_DB_URL, pool_pre_ping=True, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def ping():
    async with engine.begin() as conn:
        await conn.execute(text("select 1"))
