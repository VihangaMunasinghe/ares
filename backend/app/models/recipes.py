from pydantic import BaseModel, Field
from typing import Optional, List

class RecipeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    per_day_capacity_kg: float = Field(ge=0)
    volume_constraints: dict = {}
    tools_required: List[str] = []
    feasibility_score_default: float = Field(ge=0, le=1)
    crew_time_min_per_kg: float = Field(ge=0)
    energy_kwh_per_kg: float = Field(ge=0)
    water_l_per_kg: float = Field(ge=0)
    safety_flags: dict = {}
    version: str = "v1"

class RecipeOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    per_day_capacity_kg: float
    volume_constraints: dict = {}
    tools_required: List[str] = []
    feasibility_score_default: float
    crew_time_min_per_kg: float
    energy_kwh_per_kg: float
    water_l_per_kg: float
    safety_flags: dict = {}
    version: str
    created_by: Optional[str] = None
    created_at: str
    updated_at: str

class RecipeInputCreate(BaseModel):
    recipe_id: str
    waste_id: str
    min_qty_kg: float = Field(ge=0)
    preferred_qty_kg: Optional[float] = None

class RecipeInputOut(BaseModel):
    id: str
    recipe_id: str
    waste_id: str
    min_qty_kg: float
    preferred_qty_kg: Optional[float] = None
    created_at: str

class RecipeOutputCreate(BaseModel):
    recipe_id: str
    output_function: str
    qty_per_kg_in: float = Field(ge=0)
    units_label: str = "kg_per_kg"
    notes: Optional[str] = None

class RecipeOutputOut(BaseModel):
    id: str
    recipe_id: str
    output_function: str
    qty_per_kg_in: float
    units_label: str
    notes: Optional[str] = None

class RecipeMaterialScoreCreate(BaseModel):
    recipe_id: str
    material_id: str
    feasibility_score: Optional[float] = Field(default=None, ge=0, le=1)
    expected_yield: Optional[float] = None
    crew_time_modifier: Optional[float] = None
    risk_numeric: Optional[float] = None

class RecipeMaterialScoreOut(BaseModel):
    id: str
    recipe_id: str
    material_id: str
    feasibility_score: Optional[float] = None
    expected_yield: Optional[float] = None
    crew_time_modifier: Optional[float] = None
    risk_numeric: Optional[float] = None
