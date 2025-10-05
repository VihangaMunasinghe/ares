import json
import pika
import asyncio
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_sessionmaker
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from app.services.mission_data_builder import MissionDataBuilder
from app.services.job_results_processor import JobResultsProcessor


class DecimalEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles Decimal objects"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


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
        """Close RabbitMQ connection safely"""
        try:
            if hasattr(self, 'connection') and self.connection and not self.connection.is_closed:
                try:
                    self.connection.close()
                    print("Disconnected from RabbitMQ")
                except Exception as e:
                    print(f"Warning: Could not close connection gracefully: {e}")
        except Exception as e:
            print(f"Error during disconnect: {e}")
    
    def convert_tuple_keys_to_strings(self, data: Any) -> Any:
        """
        Convert tuple keys to JSON-safe strings and handle Decimal objects for serialization
        
        Args:
            data: Dictionary or nested structure with potential tuple keys and Decimal values
            
        Returns:
            Data structure with tuple keys converted to strings and Decimals to floats
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
        elif isinstance(data, Decimal):
            return float(data)
        else:
            return data
    
    async def fetch_mission_data(self, job_id: str) -> Dict[str, Any]:
        """
        Fetch mission data from database and convert to optimization format
        
        Args:
            job_id: Job ID to fetch data for (not mission_id)
            
        Returns:
            Dictionary in the format expected by the optimization model
        """
        
        SessionLocal = get_sessionmaker()
        async with SessionLocal() as session:
            # Use the mission data builder to get real data from database
            builder = MissionDataBuilder(session)
            mission_data = await builder.build_mission_data(job_id)
            return mission_data
    
    async def publish_optimization_request(self, job_id: str, optimization_params: Optional[Dict] = None) -> str:
        """
        Publish optimization request to the queue
        
        Args:
            job_id: Job ID to optimize
            optimization_params: Optional additional parameters
            
        Returns:
            Request ID for tracking
        """
        try:
            # Ensure we're connected
            if not self.channel:
                raise RuntimeError("Queue not connected. Call connect() first.")
            
            # Fetch mission data from database
            optimization_data = await self.fetch_mission_data(job_id)
            
            # Apply any custom optimization parameters
            if optimization_params:
                if 'weights' in optimization_params:
                    optimization_data['weights'].update(optimization_params['weights'])
                # Add other parameter overrides as needed
            
            # Add job ID for tracking
            optimization_data['job_id'] = job_id
            
            # Convert tuple keys to strings for JSON serialization
            serializable_data = self.convert_tuple_keys_to_strings(optimization_data)
            
            # Create message
            message = {
                'request_id': job_id,
                'job_id': job_id,  # Add job_id at top level for worker
                'timestamp': datetime.utcnow().isoformat(),
                'data': serializable_data
            }
            
            # Publish to queue
            self.channel.basic_publish(
                exchange='',
                routing_key=self.input_queue,
                body=json.dumps(message, cls=DecimalEncoder),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    message_id=job_id,
                    timestamp=int(datetime.utcnow().timestamp())
                )
            )
            
            print(f"Published optimization request {job_id} for job {job_id}")
            return job_id
            
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
    
    def get_result(self, job_id: str, timeout: int = 30) -> Optional[Dict[str, Any]]:
        """
        Get optimization result by request ID
        
        Args:
            job_id: Job ID to look for
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
                    if message.get('request_id') == job_id:
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
                    print(f"Timeout waiting for result {job_id}")
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
        session = None
        try:
            SessionLocal = get_sessionmaker()
            session = SessionLocal()
            
            processor = JobResultsProcessor(session)
            success = await processor.process_optimization_result(result)
            
            if success:
                job_id = result.get('job_id', 'unknown')
                print(f"Successfully saved optimization result for request {job_id}")
                return True
            else:
                print(f"Failed to save optimization result")
                return False
                
        except Exception as e:
            print(f"Error saving result to database: {e}")
            if session:
                try:
                    await session.rollback()
                except Exception as rollback_error:
                    print(f"Error during rollback: {rollback_error}")
            return False
        finally:
            if session:
                try:
                    await session.close()
                except Exception as close_error:
                    print(f"Error closing session: {close_error}")
    
    def start_consuming_results(self):
        """Start consuming optimization results and saving to database"""
        loop = asyncio.get_event_loop()

        def callback(ch, method, properties, body):
            try:
                result = json.loads(body)
                job_id = result.get('job_id', 'unknown')
                print(f"Received optimization result: {job_id}")

                async def process():
                    try:
                        success = await self.save_result_to_database(result)
                        if success:
                            print(f"Successfully processed optimization result for job {job_id}")
                        else:
                            print(f"Failed to process optimization result for job {job_id}")
                        ch.basic_ack(delivery_tag=method.delivery_tag)
                    except Exception as db_error:
                        print(f"Database error processing result for job {job_id}: {db_error}")
                        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

                # Schedule coroutine in existing loop
                loop.create_task(process())

            except json.JSONDecodeError as e:
                print(f"Invalid JSON in message: {e}")
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
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
