from pydantic import BaseModel
from typing import Optional, Literal, Any

JobStatus = Literal["pending","running","canceled","failed","done"]

class JobCreate(BaseModel):
    mission_id: str
    params: dict = {}
    status: JobStatus = "pending"

class JobOut(BaseModel):
    id: str
    mission_id: str
    created_by: str
    status: JobStatus
    params: dict
    result_summary: Optional[dict] = None
    result_bundle: Optional[dict] = None
    created_at: str
    updated_at: str

class JobLogCreate(BaseModel):
    job_id: str
    level: str = "info"
    message: str

class JobLogOut(BaseModel):
    id: str
    job_id: str
    ts: str
    level: str
    message: str
