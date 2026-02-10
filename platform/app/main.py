"""
Bagula Platform - Ingestion API
FastAPI application for receiving agent session data
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import asyncio
from app.database import SessionStore
from app.queue import QueueManager
from app.analyzer import SessionAnalyzer

app = FastAPI(
    title="Bagula Platform",
    description="AI Agent Operations Platform - Ingestion API",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
session_store = SessionStore()
queue_manager = QueueManager()
session_analyzer = SessionAnalyzer()


# ============================================================================
# Data Models
# ============================================================================

class Turn(BaseModel):
    turn_id: str = Field(alias="turnId")
    turn_number: int = Field(alias="turnNumber")
    timestamp: int
    trigger: dict
    agent_response: Optional[dict] = Field(None, alias="agentResponse")
    llm_calls: List[dict] = Field(alias="llmCalls")
    user_feedback: Optional[dict] = Field(None, alias="userFeedback")

    class Config:
        populate_by_name = True


class SessionMetrics(BaseModel):
    total_turns: int = Field(alias="totalTurns")
    total_llm_calls: int = Field(alias="totalLLMCalls")
    total_tool_calls: int = Field(alias="totalToolCalls")
    total_tokens: int = Field(alias="totalTokens")
    total_cost: float = Field(alias="totalCost")
    total_latency: int = Field(alias="totalLatency")
    average_latency_per_turn: float = Field(alias="averageLatencyPerTurn")
    average_cost_per_turn: float = Field(alias="averageCostPerTurn")
    time_to_first_response: Optional[int] = Field(None, alias="timeToFirstResponse")
    time_to_resolution: Optional[int] = Field(None, alias="timeToResolution")

    class Config:
        populate_by_name = True


class AgentSession(BaseModel):
    session_id: str = Field(alias="sessionId")
    agent_name: str = Field(alias="agentName")
    user_id: Optional[str] = Field(None, alias="userId")
    start_time: int = Field(alias="startTime")
    end_time: Optional[int] = Field(None, alias="endTime")
    initial_request: str = Field(alias="initialRequest")
    final_outcome: Optional[dict] = Field(None, alias="finalOutcome")
    turns: List[Turn]
    metrics: SessionMetrics
    metadata: Optional[dict] = None
    tags: Optional[List[str]] = None

    class Config:
        populate_by_name = True


class IngestRequest(BaseModel):
    sessions: List[AgentSession]
    timestamp: int


class IngestResponse(BaseModel):
    success: bool
    sessions_received: int
    message: str


# ============================================================================
# Authentication
# ============================================================================

async def verify_api_key(authorization: str = Header(...)):
    """Verify API key from Authorization header"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    api_key = authorization[7:]  # Remove "Bearer " prefix

    # TODO: Validate API key against database
    # For now, simple check
    if not api_key or len(api_key) < 10:
        raise HTTPException(status_code=401, detail="Invalid API key")

    return api_key


# ============================================================================
# Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "bagula-platform",
        "version": "0.1.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/v1/sessions/ingest", response_model=IngestResponse)
async def ingest_sessions(
    request: IngestRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Ingest agent sessions asynchronously

    This is the main ingestion endpoint that:
    1. Receives batches of completed agent sessions
    2. Validates and stores them
    3. Queues them for background analysis
    """
    try:
        sessions = request.sessions

        # Store sessions in database (async)
        await session_store.store_sessions(sessions, api_key)

        # Queue for background analysis
        for session in sessions:
            await queue_manager.enqueue_session_analysis(session.session_id)

        return IngestResponse(
            success=True,
            sessions_received=len(sessions),
            message=f"Successfully received {len(sessions)} session(s)"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/v1/sessions/{session_id}")
async def get_session(
    session_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Get a specific session by ID"""
    session = await session_store.get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return session


@app.get("/v1/agents/{agent_name}/sessions")
async def list_agent_sessions(
    agent_name: str,
    limit: int = 100,
    offset: int = 0,
    api_key: str = Depends(verify_api_key)
):
    """List sessions for a specific agent"""
    sessions = await session_store.list_sessions(
        agent_name=agent_name,
        limit=limit,
        offset=offset
    )

    return {
        "agent_name": agent_name,
        "sessions": sessions,
        "count": len(sessions),
        "limit": limit,
        "offset": offset
    }


@app.get("/v1/agents/{agent_name}/metrics")
async def get_agent_metrics(
    agent_name: str,
    hours: int = 24,
    api_key: str = Depends(verify_api_key)
):
    """Get aggregated metrics for an agent"""
    metrics = await session_analyzer.get_agent_metrics(agent_name, hours)

    return metrics


@app.get("/v1/agents/{agent_name}/regressions")
async def get_agent_regressions(
    agent_name: str,
    hours: int = 24,
    api_key: str = Depends(verify_api_key)
):
    """Detect regressions for an agent"""
    regressions = await session_analyzer.detect_regressions(agent_name, hours)

    return {
        "agent_name": agent_name,
        "time_window_hours": hours,
        "regressions": regressions
    }


@app.get("/v1/agents/{agent_name}/anomalies")
async def get_agent_anomalies(
    agent_name: str,
    hours: int = 24,
    api_key: str = Depends(verify_api_key)
):
    """Detect anomalies in agent behavior"""
    anomalies = await session_analyzer.detect_anomalies(agent_name, hours)

    return {
        "agent_name": agent_name,
        "time_window_hours": hours,
        "anomalies": anomalies
    }


# ============================================================================
# Background Tasks
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize background workers on startup"""
    print("🚀 Starting Bagula Platform...")

    # Start background workers
    asyncio.create_task(queue_manager.start_workers())

    print("✅ Bagula Platform started")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("👋 Shutting down Bagula Platform...")

    await queue_manager.stop_workers()
    await session_store.close()

    print("✅ Shutdown complete")


# ============================================================================
# Metrics & Monitoring
# ============================================================================

@app.get("/metrics")
async def get_platform_metrics():
    """Get platform-level metrics (for Prometheus, etc.)"""
    return {
        "sessions_processed": await session_store.count_sessions(),
        "queue_size": await queue_manager.get_queue_size(),
        "active_agents": await session_store.count_active_agents(),
    }
