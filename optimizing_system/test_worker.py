"""
Test script to send optimization requests to the RabbitMQ worker
"""
import json
import pika
import uuid
import time


def convert_tuple_keys_to_strings(data):
    """
    Convert tuple keys to strings for JSON serialization
    
    Args:
        data: Dictionary that may contain tuple keys
        
    Returns:
        Dictionary with tuple keys converted to strings
    """
    if isinstance(data, dict):
        new_dict = {}
        for key, value in data.items():
            if isinstance(key, tuple):
                # Convert tuple to string like "(item1, item2)"
                new_key = str(key)
            else:
                new_key = key
            new_dict[new_key] = convert_tuple_keys_to_strings(value)
        return new_dict
    elif isinstance(data, list):
        return [convert_tuple_keys_to_strings(item) for item in data]
    else:
        return data


def convert_string_keys_to_tuples(data):
    """
    Convert string keys back to tuples for processing
    
    Args:
        data: Dictionary with string keys that represent tuples
        
    Returns:
        Dictionary with string keys converted back to tuples
    """
    if isinstance(data, dict):
        new_dict = {}
        for key, value in data.items():
            if isinstance(key, str) and key.startswith('(') and key.endswith(')'):
                try:
                    # Convert string like "(item1, item2)" back to tuple
                    # Handle both string and numeric values in tuples
                    items = key[1:-1].split(', ')
                    new_key = tuple(items)
                except:
                    new_key = key
            else:
                new_key = key
            new_dict[new_key] = convert_string_keys_to_tuples(value)
        return new_dict
    elif isinstance(data, list):
        return [convert_string_keys_to_tuples(item) for item in data]
    else:
        return data


def send_optimization_request(data, rabbitmq_host='localhost', 
                              input_queue='optimization_requests'):
    """
    Send an optimization request to the worker
    
    Args:
        data: Dictionary containing optimization data
        rabbitmq_host: RabbitMQ server hostname
        input_queue: Queue name to send requests to
    
    Returns:
        request_id: Unique identifier for this request
    """
    # Generate unique request ID
    request_id = str(uuid.uuid4())
    
    # Create the message with converted data
    message = {
        'request_id': request_id,
        'data': convert_tuple_keys_to_strings(data)
    }
    
    # Connect to RabbitMQ
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host=rabbitmq_host)
    )
    channel = connection.channel()
    
    # Declare queue
    channel.queue_declare(queue=input_queue, durable=True)
    
    # Publish message
    channel.basic_publish(
        exchange='',
        routing_key=input_queue,
        body=json.dumps(message),
        properties=pika.BasicProperties(
            delivery_mode=2,  # Make message persistent
        )
    )
    
    print(f"Sent optimization request with ID: {request_id}")
    
    connection.close()
    return request_id


def listen_for_response(request_id=None, rabbitmq_host='localhost', 
                        output_queue='optimization_responses', timeout=60):
    """
    Listen for optimization responses from the worker
    
    Args:
        request_id: Optional specific request ID to wait for
        rabbitmq_host: RabbitMQ server hostname
        output_queue: Queue name to receive responses from
        timeout: Maximum time to wait in seconds
    
    Returns:
        response: Dictionary containing optimization results
    """
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host=rabbitmq_host)
    )
    channel = connection.channel()
    
    # Declare queue
    channel.queue_declare(queue=output_queue, durable=True)
    
    print(f"Waiting for response (timeout: {timeout}s)...")
    
    response = None
    start_time = time.time()
    
    def callback(ch, method, properties, body):
        nonlocal response
        msg = json.loads(body)
        
        # If we're looking for a specific request ID, check if this is it
        if request_id is None or msg.get('request_id') == request_id:
            response = msg
            ch.basic_ack(delivery_tag=method.delivery_tag)
            ch.stop_consuming()
        else:
            # Not our message, don't acknowledge it
            pass
    
    channel.basic_consume(queue=output_queue, on_message_callback=callback)
    
    # Start consuming with timeout
    try:
        while response is None and (time.time() - start_time) < timeout:
            connection.process_data_events(time_limit=1)
    except KeyboardInterrupt:
        print("\nStopped listening for responses")
    
    connection.close()
    return response


if __name__ == "__main__":
    # Sample data for testing
    sample_data = {
        'materials': ["plastic", "textile"],
        'methods': ["extrude", "compress"],
        'outputs': ["filament", "insulation"],
        'weeks': list(range(1, 9)),
        
        'waste_generated': {
            ("plastic", 1): 5.0, ("plastic", 2): 5.0, ("plastic", 3): 5.0, ("plastic", 4): 5.0,
            ("textile", 1): 0.0, ("textile", 2): 3.0, ("textile", 3): 3.0, ("textile", 4): 3.0,
            ("plastic", 5): 5.0, ("plastic", 6): 5.0, ("plastic", 7): 5.0, ("plastic", 8): 5.0,
            ("textile", 5): 3.0, ("textile", 6): 3.0, ("textile", 7): 3.0, ("textile", 8): 3.0,
        },
        
        'initial_inventory': {
            'materials': {"plastic": 0.0, "textile": 0.0},
            'outputs': {"filament": 0.0, "insulation": 0.0}
        },
        
        'demands': {
            ("filament", 5): 4.0,
            ("insulation", 8): 6.0
        },
        
        'yields': {
            ("plastic", "extrude", "filament"): 0.8,
            ("plastic", "compress", "filament"): 0.1,
            ("textile", "extrude", "filament"): 0.0,
            ("textile", "compress", "filament"): 0.0,
            ("plastic", "extrude", "insulation"): 0.0,
            ("plastic", "compress", "insulation"): 0.0,
            ("textile", "extrude", "insulation"): 0.0,
            ("textile", "compress", "insulation"): 0.6
        },
        
        'max_capacity': {
            ("extrude", t): 8.0 for t in range(1, 9)
        },
        'min_lot_size': {"extrude": 1.0, "compress": 1.0},
        'crew_cost': {"extrude": 0.5, "compress": 0.8},
        'energy_cost': {"extrude": 2.0, "compress": 3.0},
        'crew_available': {t: 10.0 for t in range(1, 9)},
        'energy_available': {t: 40.0 for t in range(1, 9)},
        'output_capacity': {"filament": 20.0, "insulation": 20.0},
        'input_capacity': {"plastic": 50.0, "textile": 30.0},
        'availability': {
            (r, t): 1 for r in ["extrude", "compress"] for t in range(1, 9)
        },
        'risk_cost': {"extrude": 0.1, "compress": 0.2},
        'output_values': {"filament": 2.0, "insulation": 1.5},
        
        'weights': {
            'mass': 1.0, 'value': 1.0, 'crew': 0.5,
            'energy': 0.2, 'risk': 0.3
        },
        
        'deadlines': [
            {'output': 'filament', 'week': 5, 'amount': 4.0},
            {'output': 'insulation', 'week': 8, 'amount': 6.0}
        ]
    }
    
    # Add compress capacity
    sample_data['max_capacity'].update({("compress", t): 5.0 for t in range(1, 9)})
    sample_data['availability'][("compress", 4)] = 0
    
    print("="*60)
    print("SENDING OPTIMIZATION REQUEST TO RABBITMQ WORKER")
    print("="*60)
    
    # Send request
    request_id = send_optimization_request(sample_data)
    
    # Wait for response
    response = listen_for_response(request_id=request_id, timeout=120)
    
    if response:
        print("\n" + "="*60)
        print("RECEIVED OPTIMIZATION RESPONSE")
        print("="*60)
        print(json.dumps(response, indent=2))
        
        if response['status'] == 'success':
            results = response['results']
            print(f"\nOptimization succeeded!")
            print(f"Objective value: {results['objective_value']}")
            print(f"Total processed: {results['total_processed_kg']:.2f} kg")
            print(f"Total produced: {results['total_produced_kg']:.2f} kg")
            print(f"Total value: ${results['total_value']:.2f}")
            print(f"Solver status: {results['solver_status']}")
            print(f"Termination condition: {results['termination_condition']}")
            print(f"Methods used: {', '.join(results['summary']['methods_used'])}")
            print(f"Outputs produced: {', '.join(results['summary']['outputs_produced'])}")
        else:
            print(f"\nOptimization failed!")
            print(f"Error: {response.get('error', 'Unknown error')}")
    else:
        print("\nNo response received within timeout period")

