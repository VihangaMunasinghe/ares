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

class MissionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    mission_start_date: Optional[str] = None
    duration_weeks: Optional[int] = None
    transit_weeks: Optional[int] = None
    surface_weeks: Optional[int] = None
    return_weeks: Optional[int] = None
    crew_count: Optional[int] = None
    crew_hours_per_week: Optional[float] = None
    printer_capacity_kg_per_week: Optional[float] = None
    tools_available: Optional[list[str]] = None
    status: Optional[str] = None
