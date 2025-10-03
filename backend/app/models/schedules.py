from pydantic import BaseModel, Field
from typing import Optional

class ScheduleCreate(BaseModel):
    job_id: str
    resource_name: str
    task_label: str
    recipe_id: Optional[str] = None
    start_week: int = Field(ge=1)
    duration_weeks: float = Field(gt=0)
    inputs_json: dict = {}
    crew_hours_required: float = 0
