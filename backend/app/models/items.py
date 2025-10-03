from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict

UsagePattern = Literal["throughout", "specific_weeks"]

class ManifestItemCreate(BaseModel):
    mission_id: str
    name: str
    material_id: Optional[str] = None
    qty: float = Field(gt=0)
    unit: str
    mass_per_unit_kg: float = Field(gt=0)
    usage_pattern: UsagePattern
    usage_per_week: Optional[float] = None
    weeks: Optional[List[int]] = None
    usage_per_week_map: Optional[Dict[str, float]] = None
    function_tags: List[str] = []
    notes: Optional[str] = None
