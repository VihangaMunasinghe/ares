# app/main.py
from dotenv import load_dotenv
load_dotenv()  # <<< load first

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.db import ping
from app.core.queue import health_check as queue_health_check
from app.routers import missions, global_entities, jobs, metrics
from app.services.queue import QueueConsumer
import asyncio
import threading
import logging
import os
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)  

settings = get_settings()
app = FastAPI(title="NASA Mission Optimizer Backend", version="0.1.0")

# Global consumer instance
consumer = None
consumer_thread = None

# CORS configuration
origins = settings.CORS_ORIGINS or ["*"]

# If CORS_ORIGINS is not set or is empty, allow all origins for development
if not origins or origins == [] or origins == ["*"]:
    origins = ["*"]

print(f"CORS Origins configured: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

def validate_environment():
    """Validate environment configuration and provide setup guidance"""
    issues = []
    warnings = []
    
    # Check required environment variables
    if not os.getenv("SUPABASE_DB_URL"):
        issues.append("SUPABASE_DB_URL is not set")
    
    if not os.getenv("RABBITMQ_HOST"):
        issues.append("RABBITMQ_HOST is not set (required for optimization)")
    
    # Check .env file exists
    env_file = Path(".env")
    if not env_file.exists():
        warnings.append(".env file not found - using system environment variables")
    
    # Check dependencies
    try:
        import greenlet
    except ImportError:
        issues.append("greenlet package not installed (required for SQLAlchemy async)")
    
    try:
        import pika
    except ImportError:
        issues.append("pika package not installed (required for RabbitMQ)")
    
    return {
        "issues": issues,
        "warnings": warnings,
        "env_file_exists": env_file.exists(),
        "setup_required": len(issues) > 0
    }

@app.get("/health")
async def health():
    await ping()
    return {"ok": True}

@app.get("/cors-test")
async def cors_test():
    """Test endpoint to verify CORS is working"""
    return {
        "message": "CORS is working!",
        "cors_origins": origins,
        "timestamp": "2024-01-01T00:00:00Z"
    }

@app.get("/setup")
async def setup_info():
    """Get setup information and environment validation"""
    env_validation = validate_environment()
    
    setup_guide = {
        "environment_validation": env_validation,
        "setup_steps": [
            "1. Create .env file with required configuration",
            "2. Install dependencies: pip install -r requirements.txt", 
            "3. Start RabbitMQ service",
            "4. Configure database connection",
            "5. Run: uvicorn app.main:app --reload"
        ],
        "sample_env_content": """# Database Configuration
SUPABASE_DB_URL=postgresql+asyncpg://username:password@localhost:5432/database_name

# RabbitMQ Configuration (REQUIRED)
RABBITMQ_HOST=localhost

# Application Configuration
AUTH_DISABLED=true
CORS_ORIGINS=*"""
    }
    
    return setup_guide

@app.post("/setup/create-env")
async def create_env_file():
    """Create .env file with default configuration"""
    env_file = Path(".env")
    
    if env_file.exists():
        raise HTTPException(status_code=409, detail=".env file already exists")
    
    env_content = """# Database Configuration
SUPABASE_DB_URL=postgresql+asyncpg://username:password@localhost:5432/database_name

# Supabase Configuration (Optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
AUTH_DISABLED=true
CORS_ORIGINS=*

# RabbitMQ Configuration (REQUIRED for optimization)
RABBITMQ_HOST=localhost
"""
    
    try:
        with open(env_file, 'w') as f:
            f.write(env_content)
        
        return {
            "success": True,
            "message": ".env file created successfully",
            "note": "Please edit the .env file with your actual configuration values"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create .env file: {str(e)}")

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
    
    # Validate environment
    env_validation = validate_environment()
    
    if env_validation["setup_required"]:
        logger.warning("Environment setup issues detected:")
        for issue in env_validation["issues"]:
            logger.warning(f"  - {issue}")
        logger.warning("Visit /setup endpoint for setup guidance")
    
    if env_validation["warnings"]:
        for warning in env_validation["warnings"]:
            logger.warning(f"  - {warning}")
    
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

