"""
Configuration for the optimization worker
"""
import os


class Config:
    """Configuration settings for the RabbitMQ worker"""
    
    # RabbitMQ settings
    RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
    RABBITMQ_PORT = int(os.getenv('RABBITMQ_PORT', 5672))
    RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'guest')
    RABBITMQ_PASS = os.getenv('RABBITMQ_PASS', 'guest')
    
    # Queue names
    INPUT_QUEUE = os.getenv('INPUT_QUEUE', 'optimization_requests')
    OUTPUT_QUEUE = os.getenv('OUTPUT_QUEUE', 'optimization_responses')
    
    # Worker settings
    PREFETCH_COUNT = int(os.getenv('PREFETCH_COUNT', 1))  # Process one message at a time
    
    # Optimization settings
    SOLVER_TIMEOUT = int(os.getenv('SOLVER_TIMEOUT', 300))  # seconds

