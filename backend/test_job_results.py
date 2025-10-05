#!/usr/bin/env python3
"""
Test script for job results processing

This script demonstrates how the job results processor handles optimization results
and saves them to the database.
"""

import asyncio
import json
from app.core.db import get_sessionmaker
from app.services.job_results_processor import JobResultsProcessor


async def test_job_results_processing():
    """Test the job results processor with sample data"""
    
    # Sample optimization result (based on model.py _extract_results format)
    sample_result = {
        "request_id": "test-request-123",
        "job_id": "test-job-456", 
        "status": "success",
        "results": {
            "schedule": [
                {
                    "week": 1,
                    "methods": {
                        "extrude": {
                            "processed_kg": 5.2,
                            "is_running": 1,
                            "by_material": {
                                "plastic": 3.0,
                                "textile": 2.2
                            }
                        },
                        "compress": {
                            "processed_kg": 0.0,
                            "is_running": 0,
                            "by_material": {
                                "plastic": 0.0,
                                "textile": 0.0
                            }
                        }
                    }
                },
                {
                    "week": 2,
                    "methods": {
                        "extrude": {
                            "processed_kg": 4.8,
                            "is_running": 1,
                            "by_material": {
                                "plastic": 2.8,
                                "textile": 2.0
                            }
                        },
                        "compress": {
                            "processed_kg": 3.5,
                            "is_running": 1,
                            "by_material": {
                                "plastic": 0.0,
                                "textile": 3.5
                            }
                        }
                    }
                }
            ],
            "outputs": [
                {
                    "output": "filament",
                    "weeks": [
                        {"week": 1, "produced_kg": 4.16, "inventory_kg": 9.16},
                        {"week": 2, "produced_kg": 3.84, "inventory_kg": 13.0}
                    ]
                },
                {
                    "output": "insulation", 
                    "weeks": [
                        {"week": 1, "produced_kg": 0.0, "inventory_kg": 4.0},
                        {"week": 2, "produced_kg": 2.1, "inventory_kg": 6.1}
                    ]
                }
            ],
            "substitutes": [
                {
                    "substitute": "printed_part",
                    "weeks": [
                        {"week": 1, "made": 4.16, "inventory": 4.16, "used_for": {"spare_part": 0.0}},
                        {"week": 2, "made": 3.84, "inventory": 3.0, "used_for": {"spare_part": 5.0}}
                    ]
                },
                {
                    "substitute": "insulation_pad",
                    "weeks": [
                        {"week": 1, "made": 0.0, "inventory": 0.0, "used_for": {"insulation_patch": 0.0}},
                        {"week": 2, "made": 2.1, "inventory": 2.1, "used_for": {"insulation_patch": 0.0}}
                    ]
                }
            ],
            "items": [
                {
                    "item": "spare_part",
                    "weeks": [
                        {"week": 1, "used_total": 0.0, "used_carried": 0.0, "shortage": 5.0},
                        {"week": 2, "used_total": 9.0, "used_carried": 4.0, "shortage": 0.0}
                    ]
                },
                {
                    "item": "insulation_patch",
                    "weeks": [
                        {"week": 1, "used_total": 0.0, "used_carried": 0.0, "shortage": 4.0},
                        {"week": 2, "used_total": 0.0, "used_carried": 0.0, "shortage": 5.0}
                    ]
                }
            ],
            "summary": {
                "objective_value": 1234.56,
                "total_processed_kg": 13.5,
                "total_output_produced_kg": 10.1,
                "total_substitutes_made": 10.1,
                "substitute_breakdown": {
                    "printed_part": 8.0,
                    "insulation_pad": 2.1
                },
                "total_initial_carriage_weight": 45.0,
                "total_final_carriage_weight": 41.0,
                "total_carried_weight_loss": 4.0,
                "carried_weight_loss_by_item": {
                    "spare_part": {
                        "initial_units": 25.0,
                        "units_used": 4.0,
                        "final_units": 21.0,
                        "mass_per_unit": 1.0,
                        "initial_weight": 25.0,
                        "final_weight": 21.0,
                        "total_weight_loss": 4.0
                    },
                    "insulation_patch": {
                        "initial_units": 20.0,
                        "units_used": 0.0,
                        "final_units": 20.0,
                        "mass_per_unit": 1.0,
                        "initial_weight": 20.0,
                        "final_weight": 20.0,
                        "total_weight_loss": 0.0
                    }
                }
            },
            "solver_status": {
                "termination_condition": "optimal",
                "solver_time": 2.34
            }
        }
    }
    
    print("Testing Job Results Processing")
    print("=" * 50)
    
    SessionLocal = get_sessionmaker()
    async with SessionLocal() as db:
        processor = JobResultsProcessor(db)
        
        print("Processing sample optimization result...")
        success = await processor.process_optimization_result(sample_result)
        
        if success:
            print("✅ Successfully processed optimization result")
            print(f"Job ID: {sample_result['job_id']}")
            print(f"Status: {sample_result['status']}")
            print(f"Objective Value: {sample_result['results']['summary']['objective_value']}")
            print(f"Total Processed: {sample_result['results']['summary']['total_processed_kg']} kg")
        else:
            print("❌ Failed to process optimization result")
    
    print("\nTest completed!")


async def test_failed_result():
    """Test processing of failed optimization result"""
    
    failed_result = {
        "request_id": "test-request-failed",
        "job_id": "test-job-failed",
        "status": "failed",
        "error_message": "Optimization solver failed: infeasible problem"
    }
    
    print("\nTesting Failed Result Processing")
    print("=" * 50)
    
    SessionLocal = get_sessionmaker()
    async with SessionLocal() as db:
        processor = JobResultsProcessor(db)
        
        print("Processing failed optimization result...")
        success = await processor.process_optimization_result(failed_result)
        
        if success:
            print("✅ Successfully processed failed result")
            print(f"Job ID: {failed_result['job_id']}")
            print(f"Status: {failed_result['status']}")
            print(f"Error: {failed_result['error_message']}")
        else:
            print("❌ Failed to process failed result")


async def main():
    """Main test function"""
    
    try:
        await test_job_results_processing()
        await test_failed_result()
        
        print("\n" + "=" * 50)
        print("All tests completed!")
        
    except Exception as e:
        print(f"Test error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
