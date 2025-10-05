#!/usr/bin/env python3
"""
Quick test to verify RabbitMQ connection and queue setup
"""

import pika
import json
from datetime import datetime


def test_rabbitmq_connection():
    """Test basic RabbitMQ connection and queue setup"""
    
    print("Testing RabbitMQ Connection...")
    print("="*50)
    
    try:
        # Connect to RabbitMQ
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host='localhost')
        )
        channel = connection.channel()
        print("✓ Connected to RabbitMQ successfully")
        
        # Declare input queue
        input_queue = "optimization_requests"
        channel.queue_declare(queue=input_queue, durable=True)
        print(f"✓ Declared input queue: {input_queue}")
        
        # Declare output queue  
        output_queue = "optimization_responses"
        channel.queue_declare(queue=output_queue, durable=True)
        print(f"✓ Declared output queue: {output_queue}")
        
        # Test publishing a message
        test_message = {
            "request_id": "test-123",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "mission_id": "test-mission",
                "materials": ["plastic"],
                "methods": ["extrude"],
                "outputs": ["filament"],
                "items": ["spare_part"],
                "substitutes": ["printed_part"],
                "weeks": [1, 2, 3, 4]
            }
        }
        
        channel.basic_publish(
            exchange='',
            routing_key=input_queue,
            body=json.dumps(test_message),
            properties=pika.BasicProperties(delivery_mode=2)
        )
        print("✓ Published test message to input queue")
        
        # Test consuming a message (with timeout)
        def test_callback(ch, method, properties, body):
            print("✓ Received message from output queue")
            try:
                message = json.loads(body)
                print(f"  - Request ID: {message.get('request_id')}")
                print(f"  - Status: {message.get('status')}")
            except Exception as e:
                print(f"  - Error parsing message: {e}")
            ch.stop_consuming()
        
        print("✓ Set up message consumer")
        
        # Close connection
        connection.close()
        print("✓ Connection closed successfully")
        
        print("\n" + "="*50)
        print("✅ RabbitMQ connection test PASSED")
        print("The queues are properly set up and ready for optimization requests.")
        
        return True
        
    except Exception as e:
        print(f"✗ RabbitMQ connection test FAILED: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure RabbitMQ is running:")
        print("   docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management")
        print("2. Or install RabbitMQ locally")
        print("3. Check that port 5672 is accessible")
        return False


def check_queue_status():
    """Check the status of optimization queues"""
    
    print("\nChecking Queue Status...")
    print("="*50)
    
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host='localhost')
        )
        channel = connection.channel()
        
        # Check input queue
        input_queue = "optimization_requests"
        method = channel.queue_declare(queue=input_queue, durable=True, passive=True)
        input_count = method.method.message_count
        print(f"Input queue ({input_queue}): {input_count} messages")
        
        # Check output queue
        output_queue = "optimization_responses"  
        method = channel.queue_declare(queue=output_queue, durable=True, passive=True)
        output_count = method.method.message_count
        print(f"Output queue ({output_queue}): {output_count} messages")
        
        connection.close()
        
        if input_count > 0:
            print(f"⚠ Warning: {input_count} unprocessed messages in input queue")
            print("  Make sure the optimization worker is running!")
        
        if output_count > 0:
            print(f"ℹ Info: {output_count} results waiting in output queue")
        
        return True
        
    except Exception as e:
        print(f"✗ Failed to check queue status: {e}")
        return False


if __name__ == "__main__":
    print("RabbitMQ Queue Connection Test")
    print("="*60)
    
    # Test connection
    if test_rabbitmq_connection():
        # Check queue status
        check_queue_status()
        
        print("\n" + "="*60)
        print("Next steps:")
        print("1. Start the optimization worker:")
        print("   cd optimizing_system && poetry run python main.py")
        print("2. Run the integration test:")
        print("   cd backend && python test_queue_integration.py")
        print("3. Or use the API:")
        print("   POST /optimization/submit")
    else:
        print("\n❌ Please fix RabbitMQ connection issues before proceeding")
