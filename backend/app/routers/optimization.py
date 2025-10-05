"""
Optimization API endpoints for submitting and retrieving optimization requests
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.services.queue import submit_optimization, get_optimization_result
import uuid

router = APIRouter(prefix="/optimization", tags=["optimization"])


class OptimizationRequest(BaseModel):
    mission_id: str
    params: Optional[Dict[str, Any]] = None


class OptimizationResponse(BaseModel):
    request_id: str
    status: str
    message: str


class OptimizationResult(BaseModel):
    request_id: str
    status: str
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@router.post("/submit", response_model=OptimizationResponse)
async def submit_optimization_request(request: OptimizationRequest):
    """
    Submit an optimization request for a mission
    
    Args:
        request: Optimization request containing mission_id and optional parameters
        
    Returns:
        Response with request_id for tracking
    """
    try:
        request_id = submit_optimization(
            mission_id=request.mission_id,
            optimization_params=request.params
        )
        
        return OptimizationResponse(
            request_id=request_id,
            status="submitted",
            message=f"Optimization request submitted for mission {request.mission_id}"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit optimization request: {str(e)}"
        )


@router.get("/result/{request_id}", response_model=OptimizationResult)
async def get_optimization_result_endpoint(request_id: str, timeout: int = 300):
    """
    Get optimization result by request ID
    
    Args:
        request_id: Request ID to look for
        timeout: Timeout in seconds (default 5 minutes)
        
    Returns:
        Optimization result or error if not found/timeout
    """
    try:
        result = get_optimization_result(request_id, timeout)
        
        if result is None:
            raise HTTPException(
                status_code=404,
                detail=f"Optimization result not found for request {request_id}"
            )
        
        return OptimizationResult(
            request_id=result.get("request_id"),
            status=result.get("status"),
            results=result.get("results"),
            error=result.get("error")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve optimization result: {str(e)}"
        )


@router.get("/status/{request_id}")
async def get_optimization_status(request_id: str):
    """
    Get optimization status by request ID (quick check without waiting)
    
    Args:
        request_id: Request ID to check
        
    Returns:
        Status information
    """
    try:
        # Quick check with short timeout
        result = get_optimization_result(request_id, timeout=1)
        
        if result is None:
            return {
                "request_id": request_id,
                "status": "pending",
                "message": "Optimization is still processing or not found"
            }
        
        return {
            "request_id": request_id,
            "status": result.get("status"),
            "message": "Optimization completed" if result.get("status") == "success" else "Optimization failed"
        }
        
    except Exception as e:
        return {
            "request_id": request_id,
            "status": "error",
            "message": f"Error checking status: {str(e)}"
        }


@router.post("/submit-and-wait", response_model=OptimizationResult)
async def submit_optimization_and_wait(
    request: OptimizationRequest, 
    timeout: int = 300
):
    """
    Submit optimization request and wait for result
    
    Args:
        request: Optimization request
        timeout: Maximum wait time in seconds
        
    Returns:
        Complete optimization result
    """
    try:
        # Submit request
        request_id = submit_optimization(
            mission_id=request.mission_id,
            optimization_params=request.params
        )
        
        # Wait for result
        result = get_optimization_result(request_id, timeout)
        
        if result is None:
            raise HTTPException(
                status_code=408,
                detail=f"Optimization timed out after {timeout} seconds"
            )
        
        return OptimizationResult(
            request_id=result.get("request_id"),
            status=result.get("status"),
            results=result.get("results"),
            error=result.get("error")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit and wait for optimization: {str(e)}"
        )


@router.get("/health")
async def optimization_health_check():
    """
    Health check for optimization system
    
    Returns:
        Health status
    """
    try:
        # Test queue connection
        from app.services.queue import QueueProducer, QueueConsumer
        
        producer = QueueProducer()
        consumer = QueueConsumer()
        
        producer.connect()
        consumer.connect()
        
        producer.disconnect()
        consumer.disconnect()
        
        return {
            "status": "healthy",
            "message": "Optimization system is operational",
            "components": {
                "queue_producer": "connected",
                "queue_consumer": "connected",
                "rabbitmq": "accessible"
            }
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": f"Optimization system error: {str(e)}",
            "components": {
                "queue_producer": "error",
                "queue_consumer": "error",
                "rabbitmq": "inaccessible"
            }
        }
