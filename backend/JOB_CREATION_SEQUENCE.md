# Job Creation Sequence - API Calls Guide

This document provides the complete sequence of API calls needed to create and configure a job before running optimization.

## Prerequisites

1. **Database Setup**: Ensure the new database schema is created
2. **Global Entities**: Populate global entities (materials, methods, outputs, items, substitutes)
3. **Mission**: Create a mission record
4. **Backend Running**: FastAPI backend with consumer active

## API Call Sequence

### Step 1: Create Global Entities (One-time setup)

#### 1.1 Create Materials

```http
POST /global/materials
Content-Type: application/json

{
  "key": "plastic",
  "name": "Plastic Material",
  "category": "polymer",
  "default_mass_per_unit": 1.0,
  "max_input_capacity_kg": 50.0,
  "tags": ["recyclable", "lightweight"],
  "safety_flags": {"flammable": false, "toxic": false}
}
```

```http
POST /global/materials
Content-Type: application/json

{
  "key": "textile",
  "name": "Textile Material",
  "category": "fabric",
  "default_mass_per_unit": 0.8,
  "max_input_capacity_kg": 30.0,
  "tags": ["flexible", "insulating"],
  "safety_flags": {"flammable": true, "toxic": false}
}
```

#### 1.2 Create Methods

```http
POST /global-entities/methods
Content-Type: application/json

{
  "key": "extrude",
  "name": "Extrusion Process",
  "description": "High-temperature extrusion process for material shaping",
  "min_lot_size": 1.0,
  "tools_required": ["extruder", "heater"],
  "availability_default": true
}
```

```http
POST /global-entities/methods
Content-Type: application/json

{
  "key": "compress",
  "name": "Compression Process",
  "description": "High-pressure compression process for material forming",
  "min_lot_size": 1.0,
  "tools_required": ["compressor", "mold"],
  "availability_default": true
}
```

#### 1.3 Create Outputs

```http
POST /global-entities/outputs
Content-Type: application/json

{
  "key": "filament",
  "name": "Plastic Filament",
  "units_label": "kg",
  "value_per_kg": 2.0,
  "max_output_capacity_kg": 20.0
}
```

```http
POST /global-entities/outputs
Content-Type: application/json

{
  "key": "insulation",
  "name": "Insulation Material",
  "units_label": "kg",
  "value_per_kg": 1.5,
  "max_output_capacity_kg": 20.0
}
```

#### 1.4 Create Items

```http
POST /global-entities/items
Content-Type: application/json

{
  "key": "spare_part",
  "name": "Spare Part",
  "units_label": "unit",
  "mass_per_unit": 1.0,
  "lifetime_weeks": 1
}
```

```http
POST /global-entities/items
Content-Type: application/json

{
  "key": "insulation_patch",
  "name": "Insulation Patch",
  "units_label": "unit",
  "mass_per_unit": 1.0,
  "lifetime_weeks": 1
}
```

#### 1.5 Create Substitutes

```http
POST /global-entities/substitutes
Content-Type: application/json

{
  "key": "printed_part",
  "name": "3D Printed Part",
  "value_per_unit": 3.0,
  "lifetime_weeks": 2
}
```

```http
POST /global-entities/substitutes
Content-Type: application/json

{
  "key": "insulation_pad",
  "name": "Insulation Pad",
  "value_per_unit": 2.5,
  "lifetime_weeks": 2
}
```

#### 1.6 Create Recipes

```http
POST /global-entities/recipes
Content-Type: application/json

{
  "material_key": "plastic",
  "method_key": "extrude",
  "crew_cost_per_kg": 0.5,
  "energy_cost_kwh_per_kg": 2.0,
  "risk_cost": 0.1,
  "outputs": [
    {"output_key": "filament", "yield_ratio": 0.8},
    {"output_key": "insulation", "yield_ratio": 0.0}
  ]
}
```

```http
POST /global-entities/recipes
Content-Type: application/json

{
  "material_key": "plastic",
  "method_key": "compress",
  "crew_cost_per_kg": 0.8,
  "energy_cost_kwh_per_kg": 3.0,
  "risk_cost": 0.2,
  "outputs": [
    {"output_key": "filament", "yield_ratio": 0.1},
    {"output_key": "insulation", "yield_ratio": 0.0}
  ]
}
```

```http
POST /global-entities/recipes
Content-Type: application/json

{
  "material_key": "textile",
  "method_key": "compress",
  "crew_cost_per_kg": 0.7,
  "energy_cost_kwh_per_kg": 2.8,
  "risk_cost": 0.18,
  "outputs": [
    {"output_key": "filament", "yield_ratio": 0.0},
    {"output_key": "insulation", "yield_ratio": 0.6}
  ]
}
```

#### 1.7 Create Relationships

```http
POST /global-entities/item-waste
Content-Type: application/json

{
  "item_key": "spare_part",
  "material_key": "plastic",
  "waste_per_unit": 1.0
}
```

```http
POST /global-entities/substitute-recipes
Content-Type: application/json

{
  "substitute_key": "printed_part",
  "output_key": "filament",
  "ratio_output_per_substitute": 1.0
}
```

```http
POST /global-entities/substitutes-can-replace
Content-Type: application/json

{
  "item_key": "spare_part",
  "substitute_key": "printed_part"
}
```

### Step 2: Create Mission

```http
POST /missions
Content-Type: application/json

{
  "name": "Mars Sample Mission",
  "description": "Sample mission for testing optimization system",
  "mission_start_date": "2024-06-01",
  "duration_weeks": 8,
  "transit_weeks": 2,
  "surface_weeks": 4,
  "return_weeks": 2,
  "crew_count": 4,
  "crew_hours_per_week": 40.0,
  "printer_capacity_kg_per_week": 10.0,
  "tools_available": ["extruder", "compressor", "heater", "mold"],
  "status": "Planned"
}
```

**Response**: Save the `mission_id` from the response.

### Step 3: Create Job

```http
POST /jobs
Content-Type: application/json

{
  "mission_id": "{{mission_id}}",
  "total_weeks": 8,
  "w_mass": 1.0,
  "w_value": 1.0,
  "w_crew": 0.5,
  "w_energy": 0.2,
  "w_risk": 0.3,
  "w_make": 5.0,
  "w_carry": -2.0,
  "w_shortage": 10000.0,
  "params": {}
}
```

**Response**: Save the `job_id` from the response.

### Step 4: Configure Job Entities

#### 4.1 Enable Materials

```http
POST /jobs/{{job_id}}/enabled-materials
Content-Type: application/json

{
  "material_key": "plastic"
}
```

```http
POST /jobs/{{job_id}}/enabled-materials
Content-Type: application/json

{
  "material_key": "textile"
}
```

#### 4.2 Enable Methods

```http
POST /jobs/{{job_id}}/enabled-methods
Content-Type: application/json

{
  "method_key": "extrude"
}
```

```http
POST /jobs/{{job_id}}/enabled-methods
Content-Type: application/json

{
  "method_key": "compress"
}
```

#### 4.3 Enable Outputs

```http
POST /jobs/{{job_id}}/enabled-outputs
Content-Type: application/json

{
  "output_key": "filament"
}
```

```http
POST /jobs/{{job_id}}/enabled-outputs
Content-Type: application/json

{
  "output_key": "insulation"
}
```

#### 4.4 Enable Items

```http
POST /jobs/{{job_id}}/enabled-items
Content-Type: application/json

{
  "item_key": "spare_part"
}
```

```http
POST /jobs/{{job_id}}/enabled-items
Content-Type: application/json

{
  "item_key": "insulation_patch"
}
```

#### 4.5 Enable Substitutes

```http
POST /jobs/{{job_id}}/enabled-substitutes
Content-Type: application/json

{
  "substitute_key": "printed_part"
}
```

```http
POST /jobs/{{job_id}}/enabled-substitutes
Content-Type: application/json

{
  "substitute_key": "insulation_pad"
}
```

### Step 5: Set Initial Inventories

#### 5.1 Material Inventory

```http
POST /jobs/{{job_id}}/material-inventory
Content-Type: application/json

{
  "material_key": "plastic",
  "qty_kg": 10.0
}
```

```http
POST /jobs/{{job_id}}/material-inventory
Content-Type: application/json

{
  "material_key": "textile",
  "qty_kg": 8.0
}
```

#### 5.2 Output Inventory

```http
POST /jobs/{{job_id}}/output-inventory
Content-Type: application/json

{
  "output_key": "filament",
  "qty_kg": 5.0
}
```

```http
POST /jobs/{{job_id}}/output-inventory
Content-Type: application/json

{
  "output_key": "insulation",
  "qty_kg": 4.0
}
```

#### 5.3 Item Inventory

```http
POST /jobs/{{job_id}}/item-inventory
Content-Type: application/json

{
  "item_key": "spare_part",
  "qty_units": 25.0
}
```

```http
POST /jobs/{{job_id}}/item-inventory
Content-Type: application/json

{
  "item_key": "insulation_patch",
  "qty_units": 20.0
}
```

#### 5.4 Substitute Inventory

```http
POST /jobs/{{job_id}}/substitute-inventory
Content-Type: application/json

{
  "substitute_key": "printed_part",
  "qty_units": 0.0
}
```

```http
POST /jobs/{{job_id}}/substitute-inventory
Content-Type: application/json

{
  "substitute_key": "insulation_pad",
  "qty_units": 0.0
}
```

### Step 6: Set Demands and Deadlines

#### 6.1 Item Demands

```http
POST /jobs/{{job_id}}/item-demands
Content-Type: application/json

{
  "item_key": "spare_part",
  "week": 2,
  "amount": 5.0
}
```

```http
POST /jobs/{{job_id}}/item-demands
Content-Type: application/json

{
  "item_key": "spare_part",
  "week": 4,
  "amount": 4.0
}
```

```http
POST /jobs/{{job_id}}/item-demands
Content-Type: application/json

{
  "item_key": "insulation_patch",
  "week": 3,
  "amount": 4.0
}
```

#### 6.2 Deadlines

```http
POST /jobs/{{job_id}}/deadlines
Content-Type: application/json

{
  "item_key": "spare_part",
  "week": 4,
  "amount": 9.0
}
```

```http
POST /jobs/{{job_id}}/deadlines
Content-Type: application/json

{
  "item_key": "insulation_patch",
  "week": 5,
  "amount": 9.0
}
```

### Step 7: Set Resources and Capacity

#### 7.1 Weekly Resources

```http
POST /jobs/{{job_id}}/week-resources
Content-Type: application/json

{
  "week": 1,
  "crew_available": 12.0,
  "energy_available": 35.0
}
```

```http
POST /jobs/{{job_id}}/week-resources
Content-Type: application/json

{
  "week": 2,
  "crew_available": 15.0,
  "energy_available": 45.0
}
```

_Continue for all 8 weeks..._

#### 7.2 Method Capacity

```http
POST /jobs/{{job_id}}/method-capacity
Content-Type: application/json

{
  "method_key": "extrude",
  "week": 1,
  "max_capacity_kg": 8.0,
  "available": true
}
```

```http
POST /jobs/{{job_id}}/method-capacity
Content-Type: application/json

{
  "method_key": "compress",
  "week": 1,
  "max_capacity_kg": 8.0,
  "available": true
}
```

_Continue for all methods and weeks..._

### Step 8: Run Optimization

```http
POST /jobs/{{job_id}}/run
Content-Type: application/json
```

**Response**:

```json
{
  "success": true,
  "message": "Job started",
  "job_id": "{{job_id}}"
}
```

### Step 9: Monitor Progress

#### Check Job Status

```http
GET /jobs/{{job_id}}
```

#### Check Consumer Status

```http
GET /consumer/status
```

#### Check Health

```http
GET /health/detailed
```

### Step 10: Get Results (After Completion)

#### Summary Results

```http
GET /jobs/{{job_id}}/results/summary
```

#### Schedule Results

```http
GET /jobs/{{job_id}}/results/schedule
```

#### Output Results

```http
GET /jobs/{{job_id}}/results/outputs
```

#### All Results

```http
GET /jobs/{{job_id}}/results/full
```

## Notes

1. **Entity Keys**: Use consistent keys across all entities (e.g., "plastic", "spare_part")
2. **UUIDs**: The system will generate UUIDs internally and map them to keys
3. **Validation**: Each API call includes validation - check responses for errors
4. **Order**: Follow the sequence - global entities first, then job configuration
5. **Consumer**: Ensure the consumer is running to process optimization results

## Environment Variables

Create a `.env` file in the backend directory with the following configuration:

```env
# Database Configuration
SUPABASE_DB_URL=postgresql+asyncpg://username:password@localhost:5432/database_name

# Supabase Configuration (Optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
AUTH_DISABLED=true
CORS_ORIGINS=*

# RabbitMQ Configuration (REQUIRED for optimization)
RABBITMQ_HOST=localhost
```

**Important**: The `RABBITMQ_HOST` is required for the optimization system to work. Without it, jobs will fail to start.

## Quick Test Script

You can use tools like Postman, curl, or create a Python script to execute these API calls in sequence.
