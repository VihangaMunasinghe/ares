from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from uuid import UUID

JobStatus = Literal[
    "draft",           # Step 1: Job created, basic details saved
    "entities_config", # Step 2: Entities selected and enabled
    "inventory_config", # Step 3: Inventories configured
    "demands_config",  # Step 4: Demands and deadlines configured
    "resources_config", # Step 5: Resources and capacity configured
    "ready",           # Step 6: Ready to run
    "pending",         # Queued for execution
    "running",         # Currently executing
    "completed",       # Successfully completed
    "failed",          # Failed during execution
    "cancelled"        # Cancelled by user
]

# === Main Job Model ===
class JobCreate(BaseModel):
    mission_id: UUID
    total_weeks: int = Field(ge=1)
    w_mass: float = 1.0
    w_value: float = 1.0
    w_crew: float = 0.5
    w_energy: float = 0.2
    w_risk: float = 0.3
    w_make: float = 0.0
    w_carry: float = 0.0
    w_shortage: float = 10000.0
    params: dict = {}

class JobOut(BaseModel):
    id: UUID
    mission_id: UUID
    created_by: Optional[UUID] = None
    status: JobStatus
    total_weeks: int
    w_mass: float
    w_value: float
    w_crew: float
    w_energy: float
    w_risk: float
    w_make: float
    w_carry: float
    w_shortage: float
    params: dict
    result_summary: Optional[dict] = None
    result_bundle: Optional[dict] = None
    solver_status: Optional[dict] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    created_at: str
    updated_at: str

# === Entity Enablement Models ===
class JobEnabledMaterialCreate(BaseModel):
    job_id: str
    material_id: str

class JobEnabledMethodCreate(BaseModel):
    job_id: str
    method_id: str

class JobEnabledOutputCreate(BaseModel):
    job_id: str
    output_id: str

class JobEnabledItemCreate(BaseModel):
    job_id: str
    item_id: str

class JobEnabledSubstituteCreate(BaseModel):
    job_id: str
    substitute_id: str

# === Inventory Models ===
class JobMaterialInventoryCreate(BaseModel):
    job_id: str
    material_id: str
    qty_kg: float = Field(default=0, ge=0)

class JobMaterialInventoryOut(BaseModel):
    job_id: str
    material_id: str
    qty_kg: float

class JobOutputInventoryCreate(BaseModel):
    job_id: str
    output_id: str
    qty_kg: float = Field(default=0, ge=0)

class JobOutputInventoryOut(BaseModel):
    job_id: str
    output_id: str
    qty_kg: float

class JobItemInventoryCreate(BaseModel):
    job_id: str
    item_id: str
    qty_units: float = Field(default=0, ge=0)

class JobItemInventoryOut(BaseModel):
    job_id: str
    item_id: str
    qty_units: float

class JobSubstituteInventoryCreate(BaseModel):
    job_id: str
    substitute_id: str
    qty_units: float = Field(default=0, ge=0)

class JobSubstituteInventoryOut(BaseModel):
    job_id: str
    substitute_id: str
    qty_units: float

# === Demand and Deadline Models ===
class JobItemDemandCreate(BaseModel):
    job_id: str
    item_id: str
    week: int = Field(ge=1)
    amount: float = Field(ge=0)

class JobItemDemandOut(BaseModel):
    job_id: str
    item_id: str
    week: int
    amount: float

class JobDeadlineCreate(BaseModel):
    job_id: str
    item_id: str
    week: int = Field(ge=1)
    amount: float = Field(ge=0)

class JobDeadlineOut(BaseModel):
    job_id: str
    item_id: str
    week: int
    amount: float

# === Resource and Capacity Models ===
class JobWeekResourceCreate(BaseModel):
    job_id: str
    week: int = Field(ge=1)
    crew_available: float = Field(default=0, ge=0)
    energy_available: float = Field(default=0, ge=0)

class JobWeekResourceOut(BaseModel):
    job_id: str
    week: int
    crew_available: float
    energy_available: float

class JobMethodCapacityCreate(BaseModel):
    job_id: str
    method_id: str
    week: int = Field(ge=1)
    max_capacity_kg: float = Field(default=0, ge=0)
    available: bool = True

class JobMethodCapacityOut(BaseModel):
    job_id: str
    method_id: str
    week: int
    max_capacity_kg: float
    available: bool