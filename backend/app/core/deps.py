from .db import SessionLocal
from contextlib import asynccontextmanager

@asynccontextmanager
async def get_db():
    session = SessionLocal()
    try:
        yield session
    finally:
        await session.close()
