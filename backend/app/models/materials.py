from pydantic import BaseModel, Field
from typing import Optional, List, Literal

MaterialCategory = Literal["plastic","metal","textile","foam","composite","other"]

class MaterialCreate(BaseModel):
    name: str
    category: MaterialCategory = "other"
    default_mass_per_unit: Optional[float] = None
    default_tags: List[str] = []
    safety_flags: dict = {}

class WasteStreamCreate(BaseModel):
    material_id: str
    name: str
    expected_yield_ratio: float = Field(ge=0, le=1)
    availability_json: dict = {"mode":"continuous"}
    notes: Optional[str] = None
