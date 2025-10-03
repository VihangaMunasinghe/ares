from pydantic import BaseModel, Field
from typing import Literal, Optional, List

MissionStatus = Literal["Planned", "Running", "Completed", "Archived"]

class MissionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    mission_start_date: Optional[str] = None
    duration_weeks: int = Field(gt=0)
    transit_weeks: int
    surface_weeks: int
    return_weeks: int
    crew_count: int = Field(ge=0)
    crew_hours_per_week: float = Field(ge=0)
    printer_capacity_kg_per_week: float = Field(ge=0)
    tools_available: List[str] = []
    status: MissionStatus = "Planned"

class MissionOut(MissionCreate):
    id: str
    owner_id: Optional[str] = None
