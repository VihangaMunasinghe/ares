from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# === Global Materials ===
class MaterialGlobalCreate(BaseModel):
    key: str
    name: str
    category: str = "other"
    default_mass_per_unit: Optional[float] = 1.0
    max_input_capacity_kg: Optional[float] = None
    tags: List[str] = []
    safety_flags: dict = {}

class MaterialGlobalOut(BaseModel):
    id: UUID
    key: str
    name: str
    category: str
    default_mass_per_unit: Optional[float]
    max_input_capacity_kg: Optional[float]
    tags: List[str]
    safety_flags: dict
    created_by: Optional[UUID] = None
    created_at: datetime

# === Global Methods ===
class MethodGlobalCreate(BaseModel):
    key: str
    name: str
    description: Optional[str] = None
    min_lot_size: float = Field(default=1.0, gt=0)
    tools_required: List[str] = []
    availability_default: bool = True

class MethodGlobalOut(BaseModel):
    id: UUID
    key: str
    name: str
    description: Optional[str]
    min_lot_size: float
    tools_required: List[str]
    availability_default: bool
    created_at: datetime

# === Global Outputs ===
class OutputGlobalCreate(BaseModel):
    key: str
    name: str
    units_label: str = "kg"
    value_per_kg: float = Field(default=0, ge=0)
    max_output_capacity_kg: Optional[float] = None

class OutputGlobalOut(BaseModel):
    id: UUID
    key: str
    name: str
    units_label: str
    value_per_kg: float
    max_output_capacity_kg: Optional[float]
    created_at: datetime

# === Global Items ===
class ItemGlobalCreate(BaseModel):
    key: str
    name: str
    units_label: str = "unit"
    mass_per_unit: Optional[float] = 1.0
    lifetime_weeks: int = Field(default=1, gt=0)

class ItemGlobalOut(BaseModel):
    id: UUID
    key: str
    name: str
    units_label: str
    mass_per_unit: Optional[float]
    lifetime_weeks: int
    created_at: datetime

# === Global Substitutes ===
class SubstituteGlobalCreate(BaseModel):
    key: str
    name: str
    value_per_unit: float = Field(default=0, ge=0)
    lifetime_weeks: int = Field(default=2, gt=0)

class SubstituteGlobalOut(BaseModel):
    id: UUID
    key: str
    name: str
    value_per_unit: float
    lifetime_weeks: int
    created_at: datetime

# === Global Recipes ===
class RecipeGlobalCreate(BaseModel):
    material_id: UUID
    method_id: UUID
    crew_cost_per_kg: float = Field(default=0, ge=0)
    energy_cost_kwh_per_kg: float = Field(default=0, ge=0)
    risk_cost: float = Field(default=0, ge=0)

class RecipeGlobalOut(BaseModel):
    id: str
    material_id: str
    method_id: str
    crew_cost_per_kg: float
    energy_cost_kwh_per_kg: float
    risk_cost: float
    created_at: str

# === Recipe Outputs ===
class RecipeOutputGlobalCreate(BaseModel):
    recipe_id: UUID
    output_id: UUID
    yield_ratio: float = Field(ge=0, le=1)

class RecipeOutputGlobalOut(BaseModel):
    id: UUID
    recipe_id: UUID
    output_id: UUID
    yield_ratio: float

class RecipeOutputDetailedOut(BaseModel):
    recipe_output_id: str
    recipe_id: str
    output_id: str
    yield_ratio: float
    output_key: str
    output_name: str
    units_label: str
    value_per_kg: float
    max_output_capacity_kg: Optional[float]
    output_created_at: str

# === Relationship Models ===
class ItemWasteGlobalCreate(BaseModel):
    item_id: UUID
    material_id: UUID
    waste_per_unit: float = Field(default=0, ge=0)

class ItemWasteGlobalOut(BaseModel):
    id: UUID
    item_id: UUID
    material_id: UUID
    waste_per_unit: float

class SubstituteWasteGlobalCreate(BaseModel):
    substitute_id: UUID
    material_id: UUID
    waste_per_unit: float = Field(default=0, ge=0)

class SubstituteWasteGlobalOut(BaseModel):
    id: UUID
    substitute_id: UUID
    material_id: UUID
    waste_per_unit: float

class SubstituteRecipeGlobalCreate(BaseModel):
    substitute_id: UUID
    output_id: UUID
    ratio_output_per_substitute: float = Field(default=1.0, gt=0)

class SubstituteRecipeGlobalOut(BaseModel):
    id: UUID
    substitute_id: UUID
    output_id: UUID
    ratio_output_per_substitute: float

class SubstitutesCanReplaceGlobalCreate(BaseModel):
    item_id: UUID
    substitute_id: UUID

class SubstitutesCanReplaceGlobalOut(BaseModel):
    id: UUID
    item_id: UUID
    substitute_id: UUID