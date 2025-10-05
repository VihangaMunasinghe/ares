import json
import pika
from model import MarsRecyclingOptimizer
from pyomo.environ import value
from config import Config


def convert_string_keys_to_tuples(data):
    """
    Convert string keys back to tuples and integers for processing
    
    Args:
        data: Dictionary with string keys that represent tuples or integers
        
    Returns:
        Dictionary with string keys converted back to tuples or integers
    """
    if isinstance(data, dict):
        new_dict = {}
        for key, value in data.items():
            if isinstance(key, str):
                if key.startswith('(') and key.endswith(')'):
                    # Convert tuple strings back to tuples
                    try:
                        items = key[1:-1].split(', ')
                        converted_items = []
                        for item in items:
                            item = item.strip("'\"")
                            try:
                                if '.' in item:
                                    converted_items.append(float(item))
                                else:
                                    converted_items.append(int(item))
                            except ValueError:
                                converted_items.append(item)
                        new_key = tuple(converted_items)
                    except:
                        new_key = key
                else:
                    # Try to convert single string keys to integers
                    try:
                        if key.isdigit():
                            new_key = int(key)
                        elif '.' in key:
                            new_key = float(key)
                        else:
                            new_key = key
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


class OptimizationWorker:
    def __init__(self, rabbitmq_host=None, input_queue=None, output_queue=None):
        """
        Initialize the RabbitMQ worker
        
        Args:
            rabbitmq_host: RabbitMQ server hostname (defaults to Config.RABBITMQ_HOST)
            input_queue: Queue name to consume optimization requests from (defaults to Config.INPUT_QUEUE)
            output_queue: Queue name to publish optimization results to (defaults to Config.OUTPUT_QUEUE)
        """
        self.rabbitmq_host = rabbitmq_host or Config.RABBITMQ_HOST
        self.input_queue = input_queue or Config.INPUT_QUEUE
        self.output_queue = output_queue or Config.OUTPUT_QUEUE
        self.connection = None
        self.channel = None
        
    def connect(self):
        """Establish connection to RabbitMQ"""
        print(f"Connecting to RabbitMQ at {self.rabbitmq_host}...")
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=self.rabbitmq_host)
        )
        self.channel = self.connection.channel()
        
        # Declare queues
        self.channel.queue_declare(queue=self.input_queue, durable=True)
        self.channel.queue_declare(queue=self.output_queue, durable=True)
        
        print(f"Connected. Listening on queue: {self.input_queue}")
        
    def process_message(self, ch, method, properties, body):
        """
        Process incoming optimization request
        
        Args:
            ch: Channel
            method: Delivery method
            properties: Message properties
            body: Message body (JSON string)
        """
        print(f"\n{'='*60}")
        print("Received optimization request")
        print(f"{'='*60}")
        
        try:
            # Parse the incoming message
            data = json.loads(body)
            job_id = data.get('job_id', 'unknown')
            optimization_data = data.get('data', {})
            
            # Convert string keys back to tuples
            optimization_data = convert_string_keys_to_tuples(optimization_data)
            
            print(f"Job ID: {job_id}")
            
            # Run the optimization
            model = MarsRecyclingOptimizer()
            model.setup(optimization_data)
            model.solve()
            
            # Get structured results from the model
            optimization_results = model.get_results()
            # Normalize solver_status to a simple JSON-safe summary
            try:
                solver_info = getattr(model.solver_results, 'solver', None)
                cleaned_status = {
                    'status': str(getattr(solver_info, 'status', 'unknown')) if solver_info is not None else 'unknown',
                    'termination_condition': str(getattr(solver_info, 'termination_condition', 'unknown')) if solver_info is not None else 'unknown',
                }
                optimization_results['solver_status'] = cleaned_status
            except Exception:
                optimization_results['solver_status'] = str(optimization_results.get('solver_status', 'unknown'))
            
            # Build response
            response = {
                'job_id': job_id,
                'status': 'success',
                'results':optimization_results
            }
            
        except Exception as e:
            print(f"Error processing request: {str(e)}")
            response = {
                'request_id': data.get('request_id', 'unknown') if 'data' in locals() else 'unknown',
                'status': 'error',
                'error': str(e)
            }
        
        # Publish response to output queue
        self._publish_response(response)
        
        # Acknowledge the message
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print(f"{'='*60}\n")
        
    
    def _publish_response(self, response):
        """Publish the optimization response to the output queue"""
        try:
            message = json.dumps(response)
            self.channel.basic_publish(
                exchange='',
                routing_key=self.output_queue,
                body=message,
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                )
            )
            print(f"Response published to queue: {self.output_queue}")
        except Exception as e:
            print(f"Error publishing response: {str(e)}")
    
    def start(self):
        """Start consuming messages from the input queue"""
        try:
            self.connect()
            
            # Set QoS to process one message at a time
            self.channel.basic_qos(prefetch_count=Config.PREFETCH_COUNT)
            
            # Start consuming
            self.channel.basic_consume(
                queue=self.input_queue,
                on_message_callback=self.process_message
            )
            
            print("Waiting for optimization requests. To exit press CTRL+C")
            self.channel.start_consuming()
            
        except KeyboardInterrupt:
            print("\nShutting down gracefully...")
            self.stop()
        except Exception as e:
            print(f"Error: {str(e)}")
            self.stop()
    
    def stop(self):
        """Close the RabbitMQ connection"""
        if self.channel and self.channel.is_open:
            self.channel.stop_consuming()
        if self.connection and self.connection.is_open:
            self.connection.close()
        print("Worker stopped")


if __name__ == "__main__":
    # Create and start the worker (uses Config defaults)
    worker = OptimizationWorker()
    worker.start()

