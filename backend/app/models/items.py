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

class ManifestItemOut(BaseModel):
    id: str
    mission_id: str
    name: str
    material_id: Optional[str] = None
    qty: float
    unit: str
    mass_per_unit_kg: float
    usage_pattern: UsagePattern
    usage_per_week: Optional[float] = None
    weeks: Optional[List[int]] = None
    usage_per_week_map: Optional[Dict[str, float]] = None
    function_tags: List[str] = []
    notes: Optional[str] = None
    created_at: str
    updated_at: str

class ManifestItemWasteOut(BaseModel):
    id: str
    item_id: str
    week: int
    waste_id: str
    expected_mass_kg: float
    created_at: str

# Substitution Items Models
class SubstitutionItemCreate(BaseModel):
    mission_id: str
    name: str
    lifetime_weeks: int = Field(default=1, ge=1)
    notes: Optional[str] = None

class SubstitutionItemOut(BaseModel):
    id: str
    mission_id: str
    name: str
    lifetime_weeks: int
    notes: Optional[str] = None
    created_at: str
    updated_at: str

class ItemSubstitutionCreate(BaseModel):
    item_id: str
    substitute_id: str

class ItemSubstitutionOut(BaseModel):
    id: str
    item_id: str
    substitute_id: str
    created_at: str

class SubstitutionItemWasteCreate(BaseModel):
    substitution_id: str
    week: int = Field(ge=1)
    waste_id: str
    expected_mass_kg: float = Field(ge=0)

class SubstitutionItemWasteOut(BaseModel):
    id: str
    substitution_id: str
    week: int
    waste_id: str
    expected_mass_kg: float
    created_at: str

class SubstitutionItemInputCreate(BaseModel):
    substitution_id: str
    material_id: str
    qty_per_unit_kg: float = Field(gt=0)

class SubstitutionItemInputOut(BaseModel):
    id: str
    substitution_id: str
    material_id: str
    qty_per_unit_kg: float
    created_at: str
