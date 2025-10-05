# Optimization Queue System

This document describes the queue-based optimization system for the NASA Mission Optimizer.

## Architecture

The system consists of three main components:

1. **Queue Producer** (`app/services/queue.py`) - Submits optimization requests
2. **Optimization Worker** (`optimizing_system/worker.py`) - Processes optimization requests
3. **Queue Consumer** (`app/services/queue.py`) - Retrieves optimization results

## Message Formats

### Input Format (Producer → Worker)

```json
{
  "request_id": "uuid-string",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "mission_id": "mission-123",
    "materials": ["plastic", "textile"],
    "methods": ["extrude", "compress"],
    "outputs": ["filament", "insulation"],
    "items": ["spare_part", "insulation_patch"],
    "substitutes": ["printed_part", "insulation_pad"],
    "weeks": [1, 2, 3, 4, 5, 6, 7, 8],
    "initial_inventory": {
      "materials": { "plastic": 10.0, "textile": 8.0 },
      "outputs": { "filament": 5.0, "insulation": 4.0 },
      "items": { "spare_part": 25.0, "insulation_patch": 20.0 },
      "substitutes": { "printed_part": 0.0, "insulation_pad": 0.0 }
    },
    "item_lifetime": { "spare_part": 1.0, "insulation_patch": 1.0 },
    "item_mass": { "spare_part": 1.0, "insulation_patch": 1.0 },
    "item_waste": {
      "('spare_part', 'plastic')": 1.0,
      "('insulation_patch', 'plastic')": 1.0,
      "('spare_part', 'textile')": 0.0,
      "('insulation_patch', 'textile')": 0.5
    },
    "substitute_waste": {
      "('printed_part', 'plastic')": 0.8,
      "('insulation_pad', 'plastic')": 0.0,
      "('printed_part', 'textile')": 0.0,
      "('insulation_pad', 'textile')": 0.8
    },
    "substitute_lifetime": { "printed_part": 2, "insulation_pad": 2 },
    "item_demands": {
      "('spare_part', 2)": 5.0,
      "('spare_part', 4)": 4.0,
      "('spare_part', 6)": 6.0,
      "('insulation_patch', 3)": 4.0,
      "('insulation_patch', 5)": 5.0,
      "('insulation_patch', 7)": 7.0,
      "('insulation_patch', 8)": 4.0
    },
    "substitute_make_recipe": {
      "('printed_part', 'filament')": 1.0,
      "('insulation_pad', 'insulation')": 1.0
    },
    "substitute_values": { "printed_part": 3.0, "insulation_pad": 2.5 },
    "substitutes_can_replace": {
      "spare_part": ["printed_part"],
      "insulation_patch": ["insulation_pad"]
    },
    "yields": {
      "('plastic', 'extrude', 'filament')": 0.8,
      "('plastic', 'compress', 'filament')": 0.1,
      "('textile', 'extrude', 'filament')": 0.0,
      "('textile', 'compress', 'filament')": 0.0,
      "('plastic', 'extrude', 'insulation')": 0.0,
      "('plastic', 'compress', 'insulation')": 0.0,
      "('textile', 'extrude', 'insulation')": 0.0,
      "('textile', 'compress', 'insulation')": 0.6
    },
    "max_capacity": {
      "('extrude', 1)": 8.0,
      "('extrude', 2)": 8.0,
      "('extrude', 3)": 8.0,
      "('extrude', 4)": 8.0,
      "('extrude', 5)": 8.0,
      "('extrude', 6)": 8.0,
      "('extrude', 7)": 8.0,
      "('extrude', 8)": 8.0,
      "('compress', 1)": 8.0,
      "('compress', 2)": 8.0,
      "('compress', 3)": 8.0,
      "('compress', 4)": 8.0,
      "('compress', 5)": 8.0,
      "('compress', 6)": 8.0,
      "('compress', 7)": 8.0,
      "('compress', 8)": 8.0
    },
    "min_lot_size": { "extrude": 1.0, "compress": 1.0 },
    "crew_cost": { "extrude": 0.5, "compress": 0.8 },
    "energy_cost": { "extrude": 2.0, "compress": 3.0 },
    "crew_available": {
      "1": 12.0,
      "2": 15.0,
      "3": 10.0,
      "4": 18.0,
      "5": 14.0,
      "6": 12.0,
      "7": 16.0,
      "8": 15.0
    },
    "energy_available": {
      "1": 35.0,
      "2": 45.0,
      "3": 30.0,
      "4": 55.0,
      "5": 40.0,
      "6": 35.0,
      "7": 50.0,
      "8": 45.0
    },
    "output_capacity": { "filament": 20.0, "insulation": 20.0 },
    "input_capacity": { "plastic": 50.0, "textile": 30.0 },
    "availability": {
      "('extrude', 1)": 1,
      "('extrude', 2)": 1,
      "('extrude', 3)": 0,
      "('extrude', 4)": 1,
      "('extrude', 5)": 1,
      "('extrude', 6)": 1,
      "('extrude', 7)": 0,
      "('extrude', 8)": 1,
      "('compress', 1)": 1,
      "('compress', 2)": 0,
      "('compress', 3)": 1,
      "('compress', 4)": 0,
      "('compress', 5)": 1,
      "('compress', 6)": 1,
      "('compress', 7)": 1,
      "('compress', 8)": 1
    },
    "risk_cost": { "extrude": 0.1, "compress": 0.2 },
    "output_values": { "filament": 2.0, "insulation": 1.5 },
    "weights": {
      "mass": 1.0,
      "value": 1.0,
      "crew": 0.5,
      "energy": 0.2,
      "risk": 0.3,
      "make": 5.0,
      "carry": -2.0,
      "shortage": 10000.0
    },
    "deadlines": [
      { "item": "spare_part", "week": 4, "amount": 9.0 },
      { "item": "spare_part", "week": 6, "amount": 15.0 },
      { "item": "insulation_patch", "week": 5, "amount": 9.0 },
      { "item": "insulation_patch", "week": 8, "amount": 20.0 }
    ]
  }
}
```

### Output Format (Worker → Consumer)

```json
{
  "request_id": "uuid-string",
  "status": "success",
  "results": {
    "schedule": [
      {
        "week": 1,
        "methods": {
          "extrude": {
            "processed_kg": 8.0,
            "is_running": 1,
            "by_material": { "plastic": 6.0, "textile": 2.0 }
          }
        }
      }
    ],
    "outputs": [
      {
        "output": "filament",
        "weeks": [{ "week": 1, "produced_kg": 4.8, "inventory_kg": 9.8 }]
      }
    ],
    "substitutes": [
      {
        "substitute": "printed_part",
        "weeks": [
          {
            "week": 1,
            "made": 2.0,
            "inventory": 2.0,
            "used_for": { "spare_part": 1.0, "insulation_patch": 0.0 }
          }
        ]
      }
    ],
    "items": [
      {
        "item": "spare_part",
        "weeks": [
          { "week": 1, "used_total": 5.0, "used_carried": 3.0, "shortage": 0.0 }
        ]
      }
    ],
    "summary": {
      "objective_value": -1234.56,
      "total_processed_kg": 64.0,
      "total_output_produced_kg": 38.4,
      "total_substitutes_made": 16.0,
      "substitute_breakdown": { "printed_part": 10.0, "insulation_pad": 6.0 },
      "total_initial_carriage_weight": 45.0,
      "total_final_carriage_weight": 30.0,
      "total_carried_weight_loss": 15.0,
      "carried_weight_loss_by_item": {
        "spare_part": {
          "initial_units": 25.0,
          "units_used": 10.0,
          "final_units": 15.0,
          "mass_per_unit": 1.0,
          "initial_weight": 25.0,
          "final_weight": 15.0,
          "total_weight_loss": 10.0
        }
      }
    },
    "solver_status": {
      "status": "ok",
      "termination_condition": "optimal"
    }
  }
}
```

## API Endpoints

### Submit Optimization Request

```http
POST /optimization/submit
Content-Type: application/json

{
  "mission_id": "mission-123",
  "params": {
    "weights": {
      "mass": 1.0,
      "value": 1.0,
      "crew": 0.5,
      "energy": 0.2,
      "risk": 0.3,
      "make": 5.0,
      "carry": -2.0,
      "shortage": 10000.0
    }
  }
}
```

### Get Optimization Result

```http
GET /optimization/result/{request_id}?timeout=300
```

### Get Optimization Status

```http
GET /optimization/status/{request_id}
```

### Submit and Wait

```http
POST /optimization/submit-and-wait?timeout=300
Content-Type: application/json

{
  "mission_id": "mission-123",
  "params": {}
}
```

### Health Check

```http
GET /optimization/health
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start RabbitMQ

```bash
# Using Docker
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Or install locally
# Follow RabbitMQ installation guide for your OS
```

### 3. Start the Optimization Worker

```bash
cd optimizing_system
poetry run python main.py
```

### 4. Start the Backend API

```bash
cd backend
uvicorn app.main:app --reload
```

### 5. Run Integration Tests

```bash
cd backend
python test_queue_integration.py
```

## Usage Examples

### Python API Usage

```python
from app.services.queue import submit_optimization, get_optimization_result

# Submit optimization request
request_id = submit_optimization("mission-123", {
    "weights": {
        "mass": 1.0,
        "value": 1.0,
        "crew": 0.5,
        "energy": 0.2,
        "risk": 0.3,
        "make": 5.0,
        "carry": -2.0,
        "shortage": 10000.0
    }
})

# Get result (with 5 minute timeout)
result = get_optimization_result(request_id, timeout=300)

if result and result["status"] == "success":
    summary = result["results"]["summary"]
    print(f"Objective value: {summary['objective_value']}")
    print(f"Total processed: {summary['total_processed_kg']} kg")
```

### HTTP API Usage

```bash
# Submit request
curl -X POST "http://localhost:8000/optimization/submit" \
  -H "Content-Type: application/json" \
  -d '{"mission_id": "mission-123", "params": {"weights": {"mass": 1.0, "value": 1.0, "crew": 0.5, "energy": 0.2, "risk": 0.3, "make": 5.0, "carry": -2.0, "shortage": 10000.0}}}'

# Get result
curl "http://localhost:8000/optimization/result/{request_id}"
```

## Configuration

The system uses the following configuration (from `optimizing_system/config.py`):

- `RABBITMQ_HOST`: RabbitMQ server hostname (default: "localhost")
- `INPUT_QUEUE`: Input queue name (default: "optimization_requests")
- `OUTPUT_QUEUE`: Output queue name (default: "optimization_responses")
- `PREFETCH_COUNT`: Number of messages to prefetch (default: 1)

## Database Integration TODOs

The following database integration points need to be implemented:

1. **Mission Data Fetching** - Query missions, materials, items, recipes from database
2. **Result Storage** - Save optimization results to jobs table
3. **Schedule Creation** - Create schedule records from optimization results
4. **Inventory Updates** - Update inventory levels based on optimization results

## Error Handling

The system handles errors gracefully:

- **Connection Errors**: Automatic reconnection attempts
- **Message Errors**: Dead letter queue for failed messages
- **Timeout Errors**: Configurable timeouts for long-running optimizations
- **Data Errors**: Validation and error reporting in responses

## Monitoring

Monitor the system using:

- RabbitMQ Management UI: `http://localhost:15672`
- API Health Check: `GET /optimization/health`
- Worker Logs: Check optimization worker console output
- Queue Metrics: Available in RabbitMQ Management UI
