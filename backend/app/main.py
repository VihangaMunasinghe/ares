# app/main.py
from dotenv import load_dotenv
load_dotenv()  # <<< load first

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.db import ping
from app.core.queue import health_check as queue_health_check
from app.routers import missions, global_entities, jobs, metrics
from app.services.queue import QueueConsumer
import asyncio
import threading
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)  

settings = get_settings()
app = FastAPI(title="NASA Mission Optimizer Backend", version="0.1.0")

# Global consumer instance
consumer = None
consumer_thread = None

origins = settings.CORS_ORIGINS or ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    await ping()
    return {"ok": True}

@app.get("/health/detailed")
async def health_detailed():
    """Detailed health check including database and queue status"""
    db_status = "healthy"
    try:
        await ping()
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    queue_status = await queue_health_check()
    
    # Check consumer status
    consumer_status = "healthy" if consumer_thread and consumer_thread.is_alive() else "unhealthy"
    
    return {
        "database": db_status,
        "queue": queue_status,
        "consumer": consumer_status,
        "overall": "healthy" if db_status == "healthy" and queue_status.get("overall") == "healthy" and consumer_status == "healthy" else "unhealthy"
    }

@app.get("/consumer/status")
async def consumer_status():
    """Get consumer status information"""
    global consumer, consumer_thread
    
    status = {
        "consumer_thread_alive": consumer_thread.is_alive() if consumer_thread else False,
        "consumer_connected": consumer is not None,
        "rabbitmq_host": getattr(settings, 'RABBITMQ_HOST', 'localhost'),
        "output_queue": "optimization_responses"
    }
    
    return status

app.include_router(missions.router)
app.include_router(global_entities.router)
app.include_router(jobs.router)
app.include_router(metrics.router)


def start_consumer():
    """Start the queue consumer in a separate thread"""
    global consumer
    
    try:
        rabbitmq_host = getattr(settings, 'RABBITMQ_HOST', 'localhost')
        
        logger.info(f"Starting queue consumer for RabbitMQ at {rabbitmq_host}")
        
        consumer = QueueConsumer(
            rabbitmq_host=rabbitmq_host,
            output_queue="optimization_responses"
        )
        
        consumer.connect()
        logger.info("Queue consumer connected successfully")
        
        # Start consuming (this will block the thread)
        consumer.start_consuming_results()
        
    except Exception as e:
        logger.error(f"Error in consumer thread: {e}")
    finally:
        if consumer:
            consumer.disconnect()
            logger.info("Queue consumer disconnected")


def stop_consumer():
    """Stop the queue consumer"""
    global consumer, consumer_thread
    
    if consumer:
        logger.info("Stopping queue consumer...")
        consumer.disconnect()
        consumer = None
    
    if consumer_thread and consumer_thread.is_alive():
        consumer_thread.join(timeout=5)
        logger.info("Consumer thread stopped")


@app.on_event("startup")
async def startup_event():
    """Start the queue consumer when the app starts"""
    global consumer_thread
    
    logger.info("Starting up NASA Mission Optimizer Backend...")
    
    # Start consumer in a separate thread
    consumer_thread = threading.Thread(target=start_consumer, daemon=True)
    consumer_thread.start()
    
    logger.info("Queue consumer started in background thread")


@app.on_event("shutdown")
async def shutdown_event():
    """Stop the queue consumer when the app shuts down"""
    logger.info("Shutting down NASA Mission Optimizer Backend...")
    stop_consumer()
    logger.info("Shutdown complete")

