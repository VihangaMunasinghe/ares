from pydantic import BaseModel, Field
from typing import Optional

# === Summary Results ===
class JobResultSummaryOut(BaseModel):
    job_id: str
    objective_value: float
    total_processed_kg: float
    total_output_produced_kg: float
    total_substitutes_made: float
    total_initial_carriage_weight: float
    total_final_carriage_weight: float
    total_carried_weight_loss: float
    created_at: str

# === Detailed Results ===
class JobResultScheduleOut(BaseModel):
    id: str
    job_id: str
    week: int
    recipe_id: str
    processed_kg: float
    is_running: bool
    materials_processed: dict

class JobResultOutputOut(BaseModel):
    id: str
    job_id: str
    output_id: str
    week: int
    produced_kg: float
    inventory_kg: float

class JobResultItemOut(BaseModel):
    id: str
    job_id: str
    item_id: str
    week: int
    used_total: float
    used_carried: float
    shortage: float

class JobResultSubstituteOut(BaseModel):
    id: str
    job_id: str
    substitute_id: str
    week: int
    made: float
    inventory: float
    used_for_items: dict

class JobResultSubstituteBreakdownOut(BaseModel):
    job_id: str
    substitute_id: str
    total_made: float

class JobResultWeightLossOut(BaseModel):
    job_id: str
    item_id: str
    initial_units: float
    units_used: float
    final_units: float
    mass_per_unit: float
    initial_weight: float
    final_weight: float
    total_weight_loss: float