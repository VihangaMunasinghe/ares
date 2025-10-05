# app/core/queue.py
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.queue import QueueProducer
from app.core.config import get_settings

_producer = None

def _ensure_producer():
    """Ensure QueueProducer is initialized"""
    global _producer
    if _producer is None:
        settings = get_settings()
        
        # Get RabbitMQ settings from environment or use defaults
        rabbitmq_host = getattr(settings, 'RABBITMQ_HOST', 'localhost')
        
        _producer = QueueProducer(rabbitmq_host=rabbitmq_host, input_queue="optimization_requests")
        print(f"Initialized QueueProducer for {rabbitmq_host}")

def get_producer() -> QueueProducer:
    """Get or create QueueProducer instance"""
    _ensure_producer()
    return _producer

async def ping_queue():
    """Test queue connectivity"""
    try:
        producer = get_producer()
        # Simple test - try to connect
        producer.connect()
        producer.disconnect()
        return True
    except Exception as e:
        print(f"Queue ping failed: {e}")
        return False

# === FastAPI dependency ===
async def get_queue():
    """FastAPI dependency for queue operations"""
    producer = get_producer()
    try:
        yield producer
    finally:
        # Don't disconnect here as the producer might be reused
        pass

# === Queue Operations ===

async def publish_optimization_request(job_id: str, optimization_params=None) -> str:
    """
    Publish optimization request to the queue
    
    Args:
        job_id: Job ID to optimize
        optimization_params: Optional additional parameters
        
    Returns:
        Request ID for tracking
    """
    producer = get_producer()
    try:
        producer.connect()
        request_id = await producer.publish_optimization_request(job_id, optimization_params)
        return request_id
    finally:
        producer.disconnect()

def close_queue():
    """Close queue connection if needed"""
    global _producer
    if _producer and _producer.connection and _producer.connection.is_open:
        _producer.disconnect()
        print("Queue connection closed")

# === Health Check ===

async def health_check():
    """Check queue system health"""
    try:
        is_queue_healthy = await ping_queue()
        
        return {
            "queue": "healthy" if is_queue_healthy else "unhealthy",
            "overall": "healthy" if is_queue_healthy else "unhealthy"
        }
    except Exception as e:
        return {
            "queue": "unhealthy",
            "overall": "unhealthy",
            "error": str(e)
        }