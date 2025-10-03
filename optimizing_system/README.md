# ARES Optimization System

Mars recycling optimization system using Pyomo and RabbitMQ.

## Features

- **Optimization Model**: Multi-objective linear programming model for waste processing optimization
- **RabbitMQ Worker**: Asynchronous message-based processing
- **Comprehensive Validation**: Validates all input data structure and relationships

## Installation

1. Install dependencies:

```bash
poetry install
```

2. Ensure RabbitMQ is running:

```bash
# Using Docker
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Or install locally (macOS)
brew install rabbitmq
brew services start rabbitmq
```

3. Install a solver (choose one):

```bash
# CBC (recommended, free)
brew install coin-or-tools/coinor/cbc

# GLPK (free)
brew install glpk

# Or use commercial solvers: CPLEX, Gurobi
```

## Usage

### Running the Worker

Start the RabbitMQ worker to process optimization requests:

```bash
poetry run python worker.py
```

The worker will:

- Listen on queue: `optimization_requests`
- Publish results to: `optimization_responses`

### Sending Optimization Requests

Use the test script to send requests:

```bash
poetry run python test_worker.py
```

Or integrate into your application:

```python
from test_worker import send_optimization_request, listen_for_response

# Prepare your optimization data
data = {
    'materials': ["plastic", "textile"],
    'methods': ["extrude", "compress"],
    'outputs': ["filament", "insulation"],
    'weeks': list(range(1, 9)),
    # ... (see test_worker.py for complete structure)
}

# Send request
request_id = send_optimization_request(data)

# Wait for response
response = listen_for_response(request_id=request_id)

if response['status'] == 'success':
    print(f"Objective value: {response['objective_value']}")
    print(f"Schedule: {response['schedule']}")
```

### Running Standalone

Run the optimization directly without RabbitMQ:

```bash
poetry run python model.py
```

## Data Structure

The optimization model expects the following data structure:

```python
{
    # Basic sets
    'materials': list[str],          # e.g., ["plastic", "textile"]
    'methods': list[str],            # e.g., ["extrude", "compress"]
    'outputs': list[str],            # e.g., ["filament", "insulation"]
    'weeks': list[int],              # e.g., [1, 2, 3, ..., 8]

    # Waste generation
    'waste_generated': {
        (material, week): float      # kg of waste per week
    },

    # Initial inventory
    'initial_inventory': {
        'materials': {material: float},
        'outputs': {output: float}
    },

    # Demands
    'demands': {
        (output, week): float        # kg required by week
    },

    # Production yields
    'yields': {
        (material, method, output): float  # kg output per kg input
    },

    # Capacity constraints
    'max_capacity': {
        (method, week): float        # max kg per week
    },
    'min_lot_size': {
        method: float                # minimum kg when running
    },

    # Resource costs
    'crew_cost': {method: float},          # hours per kg
    'energy_cost': {method: float},        # units per kg
    'risk_cost': {method: float},          # cost per kg

    # Resource availability
    'crew_available': {week: float},       # hours per week
    'energy_available': {week: float},     # units per week

    # Storage capacity
    'output_capacity': {output: float},    # max kg
    'input_capacity': {material: float},   # max kg

    # Method availability
    'availability': {
        (method, week): int          # 0 or 1 (unavailable/available)
    },

    # Output values
    'output_values': {output: float},      # value per kg

    # Objective weights
    'weights': {
        'mass': float,
        'value': float,
        'crew': float,
        'energy': float,
        'risk': float
    },

    # Deadlines (optional)
    'deadlines': [
        {'output': str, 'week': int, 'amount': float}
    ]
}
```

## Response Format

The worker returns responses in the following format:

### Success Response

```json
{
  "request_id": "unique-request-id",
  "status": "success",
  "solver_status": "ok",
  "termination_condition": "optimal",
  "objective_value": 123.45,
  "total_processed_kg": 50.0,
  "total_produced_kg": 40.0,
  "total_value": 80.0,
  "schedule": [
    {
      "week": 1,
      "methods": {
        "extrude": {
          "processed_kg": 5.0,
          "is_running": 1,
          "materials_processed": {
            "plastic": 5.0,
            "textile": 0.0
          }
        },
        "compress": {
          "processed_kg": 0.0,
          "is_running": 0,
          "materials_processed": {
            "plastic": 0.0,
            "textile": 0.0
          }
        }
      }
    }
  ],
  "outputs": [
    {
      "output": "filament",
      "weeks": [
        {
          "week": 1,
          "produced_kg": 4.0,
          "inventory_kg": 4.0
        }
      ]
    }
  ],
  "material_inventory": [
    {
      "material": "plastic",
      "weeks": [
        {
          "week": 1,
          "inventory_kg": 0.0
        }
      ]
    }
  ],
  "summary": {
    "weeks_processed": 8,
    "methods_used": ["extrude"],
    "outputs_produced": ["filament", "insulation"]
  }
}
```

### Error Response

```json
{
  "request_id": "unique-request-id",
  "status": "error",
  "error": "Error message describing what went wrong"
}
```

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  Client/API     │────────▶│    RabbitMQ      │────────▶│  Worker Process │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
       │                                                          │
       │                                                          ▼
       │                    ┌──────────────────┐         ┌─────────────────┐
       │                    │                  │         │                 │
       └───────────────────▶│    RabbitMQ      │◀────────│  Optimization   │
                            │                  │         │  Model (Pyomo)  │
                            └──────────────────┘         └─────────────────┘
```

## Development

### Running Tests

```bash
# Terminal 1: Start worker
poetry run python worker.py

# Terminal 2: Send test request
poetry run python test_worker.py
```

### Environment Variables

You can configure the worker using environment variables:

```bash
export RABBITMQ_HOST=localhost
export INPUT_QUEUE=optimization_requests
export OUTPUT_QUEUE=optimization_responses
```

## Troubleshooting

### RabbitMQ Connection Error

```
Error: [Errno 61] Connection refused
```

**Solution**: Make sure RabbitMQ is running on localhost:5672

### No Solver Found

```
ValueError: No suitable solver found
```

**Solution**: Install at least one solver (CBC, GLPK, CPLEX, or Gurobi)

### Data Validation Failed

The model performs comprehensive validation. Check the error messages for specific issues:

- Missing required keys
- Invalid data types
- Inconsistent relationships between materials/methods/outputs
- Missing combinations in dictionaries

## License

[Your License Here]
