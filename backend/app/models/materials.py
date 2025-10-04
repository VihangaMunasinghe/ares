from pydantic import BaseModel, Field
from typing import Optional, List, Literal

MaterialCategory = Literal["plastic","metal","textile","foam","composite","other"]

class MaterialCreate(BaseModel):
    mission_id: Optional[str] = None
    name: str
    category: MaterialCategory = "other"
    default_mass_per_unit: Optional[float] = None
    default_tags: List[str] = []
    safety_flags: dict = {}

class MaterialOut(BaseModel):
    id: str
    mission_id: Optional[str] = None
    name: str
    category: MaterialCategory
    default_mass_per_unit: Optional[float] = None
    default_tags: List[str] = []
    safety_flags: dict = {}
    created_by: Optional[str] = None
    created_at: str
    updated_at: str

class WasteStreamCreate(BaseModel):
    material_id: str
    name: str
    expected_yield_ratio: float = Field(ge=0, le=1)
    availability_json: dict = {"mode":"continuous"}
    notes: Optional[str] = None

class WasteStreamOut(BaseModel):
    id: str
    material_id: str
    name: str
    expected_yield_ratio: float
    availability_json: dict
    notes: Optional[str] = None
    created_at: str
    updated_at: str
