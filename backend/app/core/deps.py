from .db import SessionLocal

async def get_db():
    session = SessionLocal()
    try:
        yield session
    finally:
        await session.close()
