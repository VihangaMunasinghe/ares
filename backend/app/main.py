# app/main.py
from dotenv import load_dotenv
load_dotenv()  # <<< load first

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.db import ping
from app.routers import missions, global_entities, jobs, metrics  

settings = get_settings()
app = FastAPI(title="NASA Mission Optimizer Backend", version="0.1.0")

origins = settings.CORS_ORIGINS or ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    await ping()
    return {"ok": True}

app.include_router(missions.router)
app.include_router(global_entities.router)
app.include_router(jobs.router)
app.include_router(metrics.router)