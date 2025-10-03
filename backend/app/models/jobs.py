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
    status: JobStatus
    params: dict
    result_summary: Optional[dict] = None
    created_at: str
    updated_at: str
