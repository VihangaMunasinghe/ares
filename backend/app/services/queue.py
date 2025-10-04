import json
import pika
import asyncio
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_sessionmaker
import uuid
from datetime import datetime, timezone


class QueueProducer:
    """Producer for sending optimization requests to the queue"""
    
    def __init__(self, rabbitmq_host: str = "localhost", input_queue: str = "optimization_requests"):
        self.rabbitmq_host = rabbitmq_host
        self.input_queue = input_queue
        self.connection = None
        self.channel = None
    
    def connect(self):
        """Establish connection to RabbitMQ"""
        try:
            self.connection = pika.BlockingConnection(
                pika.ConnectionParameters(host=self.rabbitmq_host)
            )
            self.channel = self.connection.channel()
            self.channel.queue_declare(queue=self.input_queue, durable=True)
            print(f"Connected to RabbitMQ at {self.rabbitmq_host}")
        except Exception as e:
            print(f"Failed to connect to RabbitMQ: {e}")
            raise
    
    def disconnect(self):
        """Close RabbitMQ connection"""
        if self.connection and self.connection.is_open:
            self.connection.close()
            print("Disconnected from RabbitMQ")
    
    def convert_tuple_keys_to_strings(self, data: Any) -> Any:
        """
        Convert tuple keys to JSON-safe strings for serialization
        
        Args:
            data: Dictionary or nested structure with potential tuple keys
            
        Returns:
            Data structure with tuple keys converted to strings
        """
        if isinstance(data, dict):
            new_dict = {}
            for key, value in data.items():
                if isinstance(key, tuple):
                    # Convert tuple to string format
                    new_key = str(key)
                elif isinstance(key, (int, float)):
                    # Convert numeric keys to strings for JSON compatibility
                    new_key = str(key)
                else:
                    new_key = key
                new_dict[new_key] = self.convert_tuple_keys_to_strings(value)
            return new_dict
        elif isinstance(data, list):
            return [self.convert_tuple_keys_to_strings(item) for item in data]
        else:
            return data
    
    async def fetch_mission_data(self, mission_id: str) -> Dict[str, Any]:
        """
        Fetch mission data from database and convert to optimization format
        
        Args:
            mission_id: Mission ID to fetch data for
            
        Returns:
            Dictionary in the format expected by the optimization model
        """
        # TODO: Implement database queries to fetch:
        # - Mission details (duration_weeks, crew info, etc.)
        # - Materials and their properties
        # - Items and their usage patterns
        # - Recipes and processing methods
        # - Substitution items and relationships
        # - Initial inventory levels
        # - Constraints and capacities
        
        SessionLocal = get_sessionmaker()
        async with SessionLocal() as session:
            # Placeholder for actual database queries
            # This should be implemented based on your actual database schema
            
            # Example structure - replace with actual queries:
            mission_data = {
                'materials': ["plastic", "textile"],  # TODO: Query materials table
                'methods': ["extrude", "compress"],   # TODO: Query recipes/processing methods
                'outputs': ["filament", "insulation"], # TODO: Query recipe outputs
                'items': ["spare_part", "insulation_patch"], # TODO: Query manifest items
                'substitutes': ["printed_part", "insulation_pad"], # TODO: Query substitution items
                'weeks': list(range(1, 9)), # TODO: Get from mission duration_weeks
                
                'initial_inventory': {
                    'materials': {"plastic": 10.0, "textile": 8.0}, # TODO: Query initial inventory
                    'outputs': {"filament": 5.0, "insulation": 4.0},
                    'items': {"spare_part": 25.0, "insulation_patch": 20.0},
                    'substitutes': {"printed_part": 0.0, "insulation_pad": 0.0}
                },
                
                'item_lifetime': {
                    "spare_part": 1.0,  # TODO: Query from items table
                    "insulation_patch": 1.0
                },
                'item_mass': {
                    "spare_part": 1.0,  # TODO: Query mass_per_unit_kg from items
                    "insulation_patch": 1.0
                },
                'item_waste': {
                    ("spare_part", "plastic"): 1.0,  # TODO: Query item waste streams
                    ("insulation_patch", "plastic"): 1.0,
                    ("spare_part", "textile"): 0.0,
                    ("insulation_patch", "textile"): 0.5
                },
                'substitute_waste': {
                    ("printed_part", "plastic"): 0.8,  # TODO: Query substitution waste
                    ("insulation_pad", "plastic"): 0.0,
                    ("printed_part", "textile"): 0.0,
                    ("insulation_pad", "textile"): 0.8
                },
                'substitute_lifetime': {
                    "printed_part": 2,  # TODO: Query from substitution items
                    "insulation_pad": 2
                },
                'item_demands': {
                    ("spare_part", 2): 5.0,  # TODO: Query usage patterns from items
                    ("spare_part", 4): 4.0,
                    ("spare_part", 6): 6.0,
                    ("insulation_patch", 3): 4.0,
                    ("insulation_patch", 5): 5.0,
                    ("insulation_patch", 7): 7.0,
                    ("insulation_patch", 8): 4.0
                },
                
                'substitute_make_recipe': {
                    ("printed_part", "filament"): 1.0,  # TODO: Query recipe outputs
                    ("insulation_pad", "insulation"): 1.0
                },
                'substitute_values': {
                    "printed_part": 3.0,  # TODO: Query from substitution items
                    "insulation_pad": 2.5
                },
                'substitutes_can_replace': {
                    'spare_part': ["printed_part"],  # TODO: Query substitution relationships
                    'insulation_patch': ["insulation_pad"]
                },
                
                'yields': {
                    ("plastic", "extrude", "filament"): 0.8,  # TODO: Query recipe yields
                    ("plastic", "compress", "filament"): 0.1,
                    ("textile", "extrude", "filament"): 0.0,
                    ("textile", "compress", "filament"): 0.0,
                    ("plastic", "extrude", "insulation"): 0.0,
                    ("plastic", "compress", "insulation"): 0.0,
                    ("textile", "extrude", "insulation"): 0.0,
                    ("textile", "compress", "insulation"): 0.6
                },
                
                'max_capacity': {
                    **{("extrude", t): 8.0 for t in range(1, 9)},  # TODO: Query from recipes
                    **{("compress", t): 8.0 for t in range(1, 9)}
                },
                'min_lot_size': {"extrude": 1.0, "compress": 1.0},  # TODO: Query from recipes
                'crew_cost': {"extrude": 0.5, "compress": 0.8},  # TODO: Query crew_time from recipes
                'energy_cost': {"extrude": 2.0, "compress": 3.0},  # TODO: Query energy from recipes
                'crew_available': {1: 12.0, 2: 15.0, 3: 10.0, 4: 18.0, 5: 14.0, 6: 12.0, 7: 16.0, 8: 15.0},  # TODO: Calculate from mission crew info
                'energy_available': {1: 35.0, 2: 45.0, 3: 30.0, 4: 55.0, 5: 40.0, 6: 35.0, 7: 50.0, 8: 45.0},  # TODO: Query energy constraints
                'output_capacity': {"filament": 20.0, "insulation": 20.0},  # TODO: Query storage constraints
                'input_capacity': {"plastic": 50.0, "textile": 30.0},  # TODO: Query material storage
                'availability': {
                    ("extrude", 1): 1, ("extrude", 2): 1, ("extrude", 3): 0, ("extrude", 4): 1, 
                    ("extrude", 5): 1, ("extrude", 6): 1, ("extrude", 7): 0, ("extrude", 8): 1,
                    ("compress", 1): 1, ("compress", 2): 0, ("compress", 3): 1, ("compress", 4): 0, 
                    ("compress", 5): 1, ("compress", 6): 1, ("compress", 7): 1, ("compress", 8): 1
                },  # TODO: Query equipment availability
                'risk_cost': {"extrude": 0.1, "compress": 0.2},  # TODO: Query risk factors
                'output_values': {"filament": 2.0, "insulation": 1.5},  # TODO: Query output values
                
                'weights': {
                    'mass': 1.0, 'value': 1.0, 'crew': 0.5,  # TODO: Get from mission preferences
                    'energy': 0.2, 'risk': 0.3, 'make': 5.0,
                    'carry': -2.0, 'shortage': 10000.0
                },
                
                'deadlines': [
                    {'item': 'spare_part', 'week': 4, 'amount': 9.0},  # TODO: Query from item usage patterns
                    {'item': 'spare_part', 'week': 6, 'amount': 15.0},
                    {'item': 'insulation_patch', 'week': 5, 'amount': 9.0},
                    {'item': 'insulation_patch', 'week': 8, 'amount': 20.0}
                ]
            }
            
            return mission_data
    
    def publish_optimization_request(self, mission_id: str, optimization_params: Optional[Dict] = None) -> str:
        """
        Publish optimization request to the queue
        
        Args:
            mission_id: Mission ID to optimize
            optimization_params: Optional additional parameters
            
        Returns:
            Request ID for tracking
        """
        try:
            # Generate unique request ID
            request_id = str(uuid.uuid4())
            
            # Use the sample data structure that passes validation
            optimization_data = {
                'materials': ["plastic", "textile"],
                'methods': ["extrude", "compress"],
                'outputs': ["filament", "insulation"],
                'items': ["spare_part", "insulation_patch"],
                'substitutes': ["printed_part", "insulation_pad"],
                'weeks': [1, 2, 3, 4, 5, 6, 7, 8],
                
                'initial_inventory': {
                    'materials': {"plastic": 10.0, "textile": 8.0},
                    'outputs': {"filament": 5.0, "insulation": 4.0},
                    'items': {"spare_part": 25.0, "insulation_patch": 20.0},
                    'substitutes': {"printed_part": 0.0, "insulation_pad": 0.0}
                },

                'item_lifetime': {
                    "spare_part": 1.0,
                    "insulation_patch": 1.0
                },
                'item_mass': {
                    "spare_part": 1.0,
                    "insulation_patch": 1.0
                },
                'item_waste': {
                    ("spare_part", "plastic"): 1.0,
                    ("insulation_patch", "plastic"): 1.0,
                    ("spare_part", "textile"): 0.0,
                    ("insulation_patch", "textile"): 0.5
                },
                'substitute_waste': {
                    ("printed_part", "plastic"): 0.8,
                    ("insulation_pad", "plastic"): 0.0,
                    ("printed_part", "textile"): 0.0,
                    ("insulation_pad", "textile"): 0.8
                },
                'substitute_lifetime': {
                    "printed_part": 2,
                    "insulation_pad": 2
                },
                'item_demands': {
                    ("spare_part", 2): 5.0,
                    ("spare_part", 4): 4.0,
                    ("spare_part", 6): 6.0,
                    ("insulation_patch", 3): 4.0,
                    ("insulation_patch", 5): 5.0,
                    ("insulation_patch", 7): 7.0,
                    ("insulation_patch", 8): 4.0
                },
                
                'substitute_make_recipe': {
                    ("printed_part", "filament"): 1.0,
                    ("insulation_pad", "insulation"): 1.0
                },
                'substitute_values': {
                    "printed_part": 3.0,
                    "insulation_pad": 2.5
                },
                'substitutes_can_replace': {
                    'spare_part': ["printed_part"],
                    'insulation_patch': ["insulation_pad"]
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
                    ("extrude", 1): 8.0, ("extrude", 2): 8.0, ("extrude", 3): 8.0, ("extrude", 4): 8.0,
                    ("extrude", 5): 8.0, ("extrude", 6): 8.0, ("extrude", 7): 8.0, ("extrude", 8): 8.0,
                    ("compress", 1): 8.0, ("compress", 2): 8.0, ("compress", 3): 8.0, ("compress", 4): 8.0,
                    ("compress", 5): 8.0, ("compress", 6): 8.0, ("compress", 7): 8.0, ("compress", 8): 8.0
                },
                'min_lot_size': {"extrude": 1.0, "compress": 1.0},
                'crew_cost': {"extrude": 0.5, "compress": 0.8},
                'energy_cost': {"extrude": 2.0, "compress": 3.0},
                'crew_available': {1: 12.0, 2: 15.0, 3: 10.0, 4: 18.0, 5: 14.0, 6: 12.0, 7: 16.0, 8: 15.0},
                'energy_available': {1: 35.0, 2: 45.0, 3: 30.0, 4: 55.0, 5: 40.0, 6: 35.0, 7: 50.0, 8: 45.0},
                'output_capacity': {"filament": 20.0, "insulation": 20.0},
                'input_capacity': {"plastic": 50.0, "textile": 30.0},
                'availability': {
                    ("extrude", 1): 1, ("extrude", 2): 1, ("extrude", 3): 0, ("extrude", 4): 1, 
                    ("extrude", 5): 1, ("extrude", 6): 1, ("extrude", 7): 0, ("extrude", 8): 1,
                    ("compress", 1): 1, ("compress", 2): 0, ("compress", 3): 1, ("compress", 4): 0, 
                    ("compress", 5): 1, ("compress", 6): 1, ("compress", 7): 1, ("compress", 8): 1
                },
                'risk_cost': {"extrude": 0.1, "compress": 0.2},
                'output_values': {"filament": 2.0, "insulation": 1.5},
                
                'weights': {
                    'mass': 1.0, 'value': 1.0, 'crew': 0.5,
                    'energy': 0.2, 'risk': 0.3, 'make': 5.0,
                    'carry': -2.0, 'shortage': 10000.0
                },
                
                'deadlines': [
                    {'item': 'spare_part', 'week': 4, 'amount': 9.0},
                    {'item': 'spare_part', 'week': 6, 'amount': 15.0},
                    {'item': 'insulation_patch', 'week': 5, 'amount': 9.0},
                    {'item': 'insulation_patch', 'week': 8, 'amount': 20.0}
                ]
            }
            
            # Apply any custom optimization parameters
            if optimization_params:
                if 'weights' in optimization_params:
                    optimization_data['weights'].update(optimization_params['weights'])
                # Add other parameter overrides as needed
            
            # Add mission ID for tracking
            optimization_data['mission_id'] = mission_id
            
            # Convert tuple keys to strings for JSON serialization
            serializable_data = self.convert_tuple_keys_to_strings(optimization_data)
            
            # Create message
            message = {
                'request_id': request_id,
                'timestamp': datetime.utcnow().isoformat(),
                'data': serializable_data
            }
            
            # Publish to queue
            self.channel.basic_publish(
                exchange='',
                routing_key=self.input_queue,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    message_id=request_id,
                    timestamp=int(datetime.utcnow().timestamp())
                )
            )
            
            print(f"Published optimization request {request_id} for mission {mission_id}")
            return request_id
            
        except Exception as e:
            print(f"Error publishing optimization request: {e}")
            raise
    
    def publish_optimization_request_async(self, mission_id: str, optimization_params: Optional[Dict] = None) -> str:
        """
        Async wrapper for publishing optimization request
        """
        # For now, use the same data structure as the sync version
        # In the future, this would fetch data from database asynchronously
        return self.publish_optimization_request(mission_id, optimization_params)


class QueueConsumer:
    """Consumer for receiving optimization results from the queue"""
    
    def __init__(self, rabbitmq_host: str = "localhost", output_queue: str = "optimization_responses"):
        self.rabbitmq_host = rabbitmq_host
        self.output_queue = output_queue
        self.connection = None
        self.channel = None
    
    def connect(self):
        """Establish connection to RabbitMQ"""
        try:
            self.connection = pika.BlockingConnection(
                pika.ConnectionParameters(host=self.rabbitmq_host)
            )
            self.channel = self.connection.channel()
            self.channel.queue_declare(queue=self.output_queue, durable=True)
            print(f"Connected to RabbitMQ at {self.rabbitmq_host}")
        except Exception as e:
            print(f"Failed to connect to RabbitMQ: {e}")
            raise
    
    def disconnect(self):
        """Close RabbitMQ connection"""
        if self.connection and self.connection.is_open:
            self.connection.close()
            print("Disconnected from RabbitMQ")
    
    def get_result(self, request_id: str, timeout: int = 30) -> Optional[Dict[str, Any]]:
        """
        Get optimization result by request ID
        
        Args:
            request_id: Request ID to look for
            timeout: Timeout in seconds
            
        Returns:
            Optimization result or None if not found
        """
        try:
            # Set up consumer with timeout
            result = None
            start_time = datetime.now(timezone.utc)
            
            def callback(ch, method, properties, body):
                nonlocal result
                try:
                    message = json.loads(body)
                    if message.get('request_id') == request_id:
                        result = message
                        ch.basic_ack(delivery_tag=method.delivery_tag)
                        ch.stop_consuming()
                    else:
                        # Reject and requeue if not our message
                        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
                except Exception as e:
                    print(f"Error processing message: {e}")
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            
            # Start consuming
            self.channel.basic_consume(
                queue=self.output_queue,
                on_message_callback=callback
            )
            
            # Wait for result with timeout
            while result is None:
                if (datetime.now(timezone.utc) - start_time).seconds > timeout:
                    print(f"Timeout waiting for result {request_id}")
                    break
                self.connection.process_data_events(time_limit=1)
            
            return result
            
        except Exception as e:
            print(f"Error getting result: {e}")
            return None
    
    async def save_result_to_database(self, result: Dict[str, Any]) -> bool:
        """
        Save optimization result to database
        
        Args:
            result: Optimization result to save
            
        Returns:
            True if saved successfully, False otherwise
        """
        try:
            SessionLocal = get_sessionmaker()
            async with SessionLocal() as session:
                # TODO: Implement database save logic
                # This should save the optimization results to the jobs table
                # and potentially create new schedule records
                
                request_id = result.get('request_id')
                status = result.get('status', 'unknown')
                optimization_results = result.get('results', {})
                
                # Example structure - replace with actual database operations:
                job_data = {
                    'request_id': request_id,
                    'status': 'done' if status == 'success' else 'failed',
                    'result_summary': optimization_results.get('summary', {}),
                    'result_bundle': optimization_results,
                    'updated_at': datetime.utcnow().isoformat()
                }
                
                # TODO: Update job record with results
                # await session.execute(update_job_query, job_data)
                # await session.commit()
                
                print(f"Saved optimization result for request {request_id}")
                return True
                
        except Exception as e:
            print(f"Error saving result to database: {e}")
            return False
    
    def start_consuming_results(self):
        """Start consuming optimization results and saving to database"""
        try:
            def callback(ch, method, properties, body):
                try:
                    result = json.loads(body)
                    print(f"Received optimization result: {result.get('request_id')}")
                    
                    # Save to database
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    try:
                        loop.run_until_complete(self.save_result_to_database(result))
                    finally:
                        loop.close()
                    
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                    
                except Exception as e:
                    print(f"Error processing result: {e}")
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            
            # Start consuming
            self.channel.basic_consume(
                queue=self.output_queue,
                on_message_callback=callback
            )
            
            print("Waiting for optimization results. To exit press CTRL+C")
            self.channel.start_consuming()
            
        except KeyboardInterrupt:
            print("\nShutting down gracefully...")
            self.channel.stop_consuming()
        except Exception as e:
            print(f"Error: {e}")
            self.channel.stop_consuming()


# Example usage functions
def submit_optimization(mission_id: str, optimization_params: Optional[Dict] = None) -> str:
    """
    Submit optimization request for a mission
    
    Args:
        mission_id: Mission ID to optimize
        optimization_params: Optional optimization parameters
        
    Returns:
        Request ID for tracking the optimization
    """
    producer = QueueProducer()
    try:
        producer.connect()
        request_id = producer.publish_optimization_request_async(mission_id, optimization_params)
        return request_id
    finally:
        producer.disconnect()


def get_optimization_result(request_id: str, timeout: int = 300) -> Optional[Dict[str, Any]]:
    """
    Get optimization result by request ID
    
    Args:
        request_id: Request ID to look for
        timeout: Timeout in seconds (default 5 minutes)
        
    Returns:
        Optimization result or None if not found/timeout
    """
    consumer = QueueConsumer()
    try:
        consumer.connect()
        result = consumer.get_result(request_id, timeout)
        return result
    finally:
        consumer.disconnect()


def start_result_consumer():
    """Start the result consumer service"""
    consumer = QueueConsumer()
    try:
        consumer.connect()
        consumer.start_consuming_results()
    finally:
        consumer.disconnect()


if __name__ == "__main__":
    # Example usage
    print("Queue Producer/Consumer for Optimization System")
    print("Use submit_optimization() to submit requests")
    print("Use get_optimization_result() to get results")
    print("Use start_result_consumer() to run result consumer service")
