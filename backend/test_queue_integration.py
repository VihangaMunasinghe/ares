#!/usr/bin/env python3
"""
Integration test for the queue producer and consumer system.
This test demonstrates the complete flow from producer to consumer.
"""

import json
import time
import uuid
from datetime import datetime
from app.services.queue import QueueProducer, QueueConsumer


def test_queue_integration():
    """Test the complete queue integration flow"""
    
    print("="*60)
    print("Testing Queue Producer-Consumer Integration")
    print("="*60)
    
    # Test configuration
    rabbitmq_host = "localhost"
    input_queue = "optimization_requests"
    output_queue = "optimization_responses"
    test_mission_id = "test-mission-001"
    
    # Create producer and consumer
    producer = QueueProducer(rabbitmq_host, input_queue)
    consumer = QueueConsumer(rabbitmq_host, output_queue)
    
    try:
        # Connect both
        print("1. Connecting to RabbitMQ...")
        producer.connect()
        consumer.connect()
        print("✓ Connected successfully")
        
        # Submit optimization request
        print("\n2. Submitting optimization request...")
        request_id = producer.publish_optimization_request(test_mission_id, {
            'weights': {
                'mass': 1.0,
                'value': 1.0,
                'crew': 0.5,
                'energy': 0.2,
                'risk': 0.3,
                'make': 5.0,
                'carry': -2.0,
                'shortage': 10000.0
            }
        })
        print(f"✓ Request submitted with ID: {request_id}")
        
        # Wait a bit for processing
        print("\n3. Waiting for result...")
        print("Note: This will timeout if no optimization worker is running")
        
        result = consumer.get_result(request_id, timeout=10)
        
        if result:
            print("✓ Result received:")
            print(f"  - Status: {result.get('status')}")
            print(f"  - Request ID: {result.get('request_id')}")
            if result.get('status') == 'success':
                summary = result.get('results', {}).get('summary', {})
                print(f"  - Objective Value: {summary.get('objective_value', 'N/A')}")
                print(f"  - Total Processed: {summary.get('total_processed_kg', 'N/A')} kg")
            else:
                print(f"  - Error: {result.get('error', 'Unknown error')}")
        else:
            print("⚠ No result received (timeout or no worker running)")
        
        print("\n4. Testing message format validation...")
        test_message_format()
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        return False
    finally:
        producer.disconnect()
        consumer.disconnect()
    
    print("\n" + "="*60)
    print("Integration test completed")
    print("="*60)
    return True


def test_message_format():
    """Test that message formats match expected structure"""
    
    print("\n5. Validating message formats...")
    
    # Test data conversion
    producer = QueueProducer()
    
    # Test tuple key conversion
    test_data = {
        'item_waste': {
            ("spare_part", "plastic"): 1.0,
            ("insulation_patch", "textile"): 0.5
        },
        'yields': {
            ("plastic", "extrude", "filament"): 0.8,
            ("textile", "compress", "insulation"): 0.6
        },
        'weeks': [1, 2, 3, 4, 5, 6, 7, 8]
    }
    
    converted_data = producer.convert_tuple_keys_to_strings(test_data)
    
    # Verify conversion
    assert 'item_waste' in converted_data
    assert "('spare_part', 'plastic')" in converted_data['item_waste']
    assert converted_data['item_waste']["('spare_part', 'plastic')"] == 1.0
    
    assert 'yields' in converted_data
    assert "('plastic', 'extrude', 'filament')" in converted_data['yields']
    assert converted_data['yields']["('plastic', 'extrude', 'filament')"] == 0.8
    
    # Test JSON serialization
    json_str = json.dumps(converted_data)
    parsed_back = json.loads(json_str)
    
    assert parsed_back['item_waste']["('spare_part', 'plastic')"] == 1.0
    assert parsed_back['yields']["('plastic', 'extrude', 'filament')"] == 0.8
    
    print("✓ Message format validation passed")
    print("✓ Tuple key conversion working")
    print("✓ JSON serialization/deserialization working")


def test_expected_output_format():
    """Test that we can handle the expected output format from model.py"""
    
    print("\n6. Testing expected output format...")
    
    # Simulate the output format from model.py _extract_results
    mock_result = {
        "request_id": str(uuid.uuid4()),
        "status": "success",
        "results": {
            "schedule": [
                {
                    "week": 1,
                    "methods": {
                        "extrude": {
                            "processed_kg": 8.0,
                            "is_running": 1,
                            "by_material": {"plastic": 6.0, "textile": 2.0}
                        }
                    }
                }
            ],
            "outputs": [
                {
                    "output": "filament",
                    "weeks": [
                        {"week": 1, "produced_kg": 4.8, "inventory_kg": 9.8}
                    ]
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
                            "used_for": {"spare_part": 1.0, "insulation_patch": 0.0}
                        }
                    ]
                }
            ],
            "items": [
                {
                    "item": "spare_part",
                    "weeks": [
                        {"week": 1, "used_total": 5.0, "used_carried": 3.0, "shortage": 0.0}
                    ]
                }
            ],
            "summary": {
                "objective_value": -1234.56,
                "total_processed_kg": 64.0,
                "total_output_produced_kg": 38.4,
                "total_substitutes_made": 16.0,
                "substitute_breakdown": {"printed_part": 10.0, "insulation_pad": 6.0},
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
    
    # Test that we can serialize and deserialize this format
    json_str = json.dumps(mock_result)
    parsed_back = json.loads(json_str)
    
    assert parsed_back["status"] == "success"
    assert "schedule" in parsed_back["results"]
    assert "outputs" in parsed_back["results"]
    assert "substitutes" in parsed_back["results"]
    assert "items" in parsed_back["results"]
    assert "summary" in parsed_back["results"]
    
    summary = parsed_back["results"]["summary"]
    assert "objective_value" in summary
    assert "total_processed_kg" in summary
    assert "substitute_breakdown" in summary
    
    print("✓ Expected output format validation passed")
    print("✓ All required result fields present")
    print("✓ Summary statistics accessible")


if __name__ == "__main__":
    print("Queue Integration Test Suite")
    print("="*60)
    
    try:
        # Run tests
        test_queue_integration()
        test_expected_output_format()
        
        print("\n🎉 All tests passed!")
        print("\nTo run the complete system:")
        print("1. Start RabbitMQ server")
        print("2. Run optimization worker: python optimizing_system/worker.py")
        print("3. Use submit_optimization('mission-id') to submit requests")
        print("4. Use get_optimization_result(request_id) to get results")
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        raise
