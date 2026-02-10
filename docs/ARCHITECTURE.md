# Bagula Architecture - Container-Based Observability Platform

## Overview

Bagula is a **container-based AI agent observability platform** that continuously monitors your production AI agents through asynchronous data ingestion.

Unlike traditional testing frameworks, Bagula:
- ✅ Runs as a **service** (not CLI)
- ✅ Receives data **asynchronously** from instrumented agents
- ✅ Monitors **production** agents in real-time
- ✅ Detects regressions **automatically** in the background
- ✅ Provides **dashboard UI** for visualization

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER'S APPLICATION                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  AI Agent (instrumented with Bagula Client SDK)          │  │
│  │                                                           │  │
│  │  import { BagulaClient } from '@bagula/client'           │  │
│  │  const bagula = new BagulaClient({ apiKey: '...' })     │  │
│  │                                                           │  │
│  │  // Track complete session                               │  │
│  │  const tracker = bagula.getSessionTracker()             │  │
│  │  sessionId = tracker.startSession(...)                   │  │
│  │  // ... agent does work ...                              │  │
│  │  tracker.completeSession(sessionId, outcome)            │  │
│  └─────────────────────────────┬─────────────────────────────┘  │
│                                │                                 │
│                                │ Async batch upload              │
│                                │ (HTTP POST /v1/sessions/ingest) │
│                                ▼                                 │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    BAGULA PLATFORM (Docker)                      │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  API Server (FastAPI)                                     │  │
│  │  - POST /v1/sessions/ingest  (receive sessions)          │  │
│  │  - GET  /v1/agents/{name}/sessions                        │  │
│  │  - GET  /v1/agents/{name}/metrics                         │  │
│  │  - GET  /v1/agents/{name}/regressions                     │  │
│  │  - GET  /v1/agents/{name}/anomalies                       │  │
│  └────────────────────────┬──────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL (TimescaleDB)                                 │  │
│  │  - agent_sessions table                                   │  │
│  │  - session_turns table                                    │  │
│  │  - llm_calls table (time-series)                         │  │
│  │  - tool_calls table                                       │  │
│  │  - baselines table                                        │  │
│  │  - anomalies table                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Redis (Message Queue & Cache)                            │  │
│  │  - Session analysis queue                                 │  │
│  │  - Baseline comparison queue                              │  │
│  │  - Anomaly detection queue                                │  │
│  │  - Metrics cache                                          │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          │                                       │
│        ┌─────────────────┼─────────────────┐                    │
│        ▼                 ▼                 ▼                    │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐               │
│  │ Worker 1 │     │ Worker 2 │     │ Worker 3 │               │
│  │ Baseline │     │ Anomaly  │     │ Metrics  │               │
│  │ Compare  │     │ Detection│     │ Aggreg.  │               │
│  └──────────┘     └──────────┘     └──────────┘               │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Dashboard UI (React/Next.js)                             │  │
│  │  http://localhost:3000                                    │  │
│  │  - Real-time agent monitoring                             │  │
│  │  - Session explorer                                       │  │
│  │  - Regression alerts                                      │  │
│  │  - Cost tracking                                          │  │
│  │  - Anomaly dashboard                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## How It Works: Complete Flow

### 1. **User Instruments Their Agent**

```typescript
// user-app/agent.ts
import { BagulaClient } from '@bagula/client';
import OpenAI from 'openai';

const bagula = new BagulaClient({
  apiKey: process.env.BAGULA_API_KEY,
  endpoint: 'https://api.bagula.ai', // or self-hosted
  batchSize: 50,        // Send every 50 sessions
  flushInterval: 10000, // Or every 10 seconds
});

async function handleCustomerRequest(request: string, userId: string) {
  const tracker = bagula.getSessionTracker();

  // Start tracking this work session
  const sessionId = tracker.startSession(
    'customer-support-agent',
    request,
    { userId, metadata: { channel: 'web' } }
  );

  // Agent does work...
  let turnCount = 0;
  while (turnCount < 5) {
    turnCount++;

    // Start turn
    const turnId = tracker.startTurn(sessionId, {
      type: 'user_message',
      content: request
    });

    // Call LLM
    const llmStart = Date.now();
    const response = await openai.chat.completions.create({...});
    const llmEnd = Date.now();

    // Track LLM call
    tracker.recordLLMCall(sessionId, turnId, {
      callId: `llm-${turnCount}`,
      provider: 'openai',
      model: 'gpt-4',
      startTime: llmStart,
      endTime: llmEnd,
      messages: [...],
      response: response.choices[0].message,
      metrics: {
        tokensInput: response.usage.prompt_tokens,
        tokensOutput: response.usage.completion_tokens,
        tokensTotal: response.usage.total_tokens,
        costUsd: calculateCost('gpt-4', response.usage),
        latencyMs: llmEnd - llmStart,
      },
    });

    // If tools called, track them
    if (response.tool_calls) {
      for (const toolCall of response.tool_calls) {
        const toolStart = Date.now();
        const result = await executeTool(toolCall.name, toolCall.arguments);
        const toolEnd = Date.now();

        toolCalls.push({
          toolId: toolCall.id,
          toolName: toolCall.name,
          arguments: toolCall.arguments,
          startTime: toolStart,
          endTime: toolEnd,
          result: result,
          latencyMs: toolEnd - toolStart,
        });
      }

      tracker.recordAgentResponse(sessionId, turnId, {
        message: response.content,
        toolCalls: toolCalls,
      });

      continue; // Next turn
    }

    // Done
    break;
  }

  // Complete session
  tracker.completeSession(sessionId, {
    status: 'success',
    result: finalResponse,
    userSatisfaction: 5,
  });

  return finalResponse;
}

// Sessions are automatically batched and sent async to Bagula
```

### 2. **Client SDK Batches & Sends Asynchronously**

The `BagulaClient`:
- Collects completed sessions in memory
- Batches them (default: 50 sessions)
- Sends via HTTP POST every N seconds (default: 10s)
- Non-blocking - doesn't slow down your app
- Retries on failure
- Flushes on app shutdown

```typescript
// Inside BagulaClient
private onSessionComplete(session: AgentSession): void {
  this.sessionQueue.push(session);

  if (this.sessionQueue.length >= this.config.batchSize) {
    this.flush(); // Send to Bagula async
  }
}

async flush(): Promise<void> {
  const batch = this.sessionQueue.splice(0, this.batchSize);

  await this.httpClient.post('/v1/sessions/ingest', {
    sessions: batch,
    timestamp: Date.now(),
  });
}
```

### 3. **Bagula Platform Receives Data**

```python
# platform/app/main.py
@app.post("/v1/sessions/ingest")
async def ingest_sessions(request: IngestRequest, api_key: str = Depends(verify_api_key)):
    sessions = request.sessions

    # 1. Store in database (async)
    await session_store.store_sessions(sessions, api_key)

    # 2. Queue for background analysis
    for session in sessions:
        await queue_manager.enqueue_session_analysis(session.session_id)

    return {"success": True, "sessions_received": len(sessions)}
```

**What happens:**
- Sessions stored in PostgreSQL (TimescaleDB)
- Each session queued in Redis for background processing
- API returns immediately (fast)

### 4. **Background Workers Process Data**

#### Worker 1: Baseline Comparison

```python
# platform/app/workers/baseline_worker.py
async def process_session(session_id: str):
    session = await db.get_session(session_id)
    baseline = await db.get_baseline(session.agent_name)

    if baseline:
        differences = compare_sessions(session, baseline)

        if differences:
            await db.store_regression({
                'session_id': session_id,
                'agent_name': session.agent_name,
                'differences': differences,
                'severity': calculate_severity(differences),
                'detected_at': datetime.now()
            })

            # Alert if critical
            if any(d['severity'] == 'critical' for d in differences):
                await alert_manager.send_alert(...)
    else:
        # First session - save as baseline
        await db.save_baseline(session)
```

#### Worker 2: Anomaly Detection

```python
# platform/app/workers/anomaly_worker.py
async def detect_anomalies(session_id: str):
    session = await db.get_session(session_id)
    historical_data = await db.get_agent_history(
        session.agent_name,
        days=7
    )

    # Check for statistical anomalies
    anomalies = []

    # Cost anomaly
    avg_cost = np.mean([s.metrics.total_cost for s in historical_data])
    std_cost = np.std([s.metrics.total_cost for s in historical_data])

    if session.metrics.total_cost > avg_cost + (3 * std_cost):
        anomalies.append({
            'type': 'cost_spike',
            'severity': 'major',
            'message': f'Cost is 3σ above normal: ${session.metrics.total_cost:.4f}'
        })

    # Latency anomaly
    avg_latency = np.mean([s.metrics.total_latency for s in historical_data])
    if session.metrics.total_latency > avg_latency * 2:
        anomalies.append({
            'type': 'latency_spike',
            'severity': 'major',
            'message': f'Latency 2x above normal: {session.metrics.total_latency}ms'
        })

    # Tool usage change
    common_tools = get_most_common_tools(historical_data)
    session_tools = [tc['toolName'] for turn in session.turns
                     for tc in turn.agent_response.get('toolCalls', [])]

    missing_tools = set(common_tools) - set(session_tools)
    if missing_tools:
        anomalies.append({
            'type': 'tool_usage_change',
            'severity': 'minor',
            'message': f'Tools no longer used: {missing_tools}'
        })

    if anomalies:
        await db.store_anomalies(session_id, anomalies)
```

#### Worker 3: Metrics Aggregation

```python
# platform/app/workers/metrics_worker.py
async def aggregate_metrics(agent_name: str):
    """
    Continuously aggregate metrics for real-time dashboard
    """
    sessions = await db.get_recent_sessions(agent_name, hours=1)

    aggregated = {
        'agent_name': agent_name,
        'time_window': '1h',
        'total_sessions': len(sessions),
        'success_rate': sum(1 for s in sessions if s.final_outcome.status == 'success') / len(sessions),
        'avg_cost': np.mean([s.metrics.total_cost for s in sessions]),
        'avg_latency': np.mean([s.metrics.total_latency for s in sessions]),
        'p95_latency': np.percentile([s.metrics.total_latency for s in sessions], 95),
        'total_cost': sum(s.metrics.total_cost for s in sessions),
        'avg_satisfaction': np.mean([s.final_outcome.user_satisfaction for s in sessions if s.final_outcome.user_satisfaction]),
        'timestamp': datetime.now()
    }

    await redis.set(f'metrics:{agent_name}:1h', json.dumps(aggregated), ex=3600)
```

### 5. **Dashboard Displays Results**

The React dashboard:
- Queries API endpoints in real-time
- Shows live metrics, sessions, regressions
- Provides alerts and notifications
- Allows drill-down into specific sessions

---

## Database Schema

```sql
-- Main sessions table
CREATE TABLE agent_sessions (
    session_id UUID PRIMARY KEY,
    agent_name VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    api_key_id UUID NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    initial_request TEXT NOT NULL,
    final_outcome JSONB,
    metadata JSONB,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable for time-series performance
SELECT create_hypertable('agent_sessions', 'start_time');

-- Session turns
CREATE TABLE session_turns (
    turn_id UUID PRIMARY KEY,
    session_id UUID REFERENCES agent_sessions(session_id),
    turn_number INTEGER NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    trigger JSONB NOT NULL,
    agent_response JSONB,
    user_feedback JSONB
);

-- LLM calls (time-series)
CREATE TABLE llm_calls (
    call_id UUID PRIMARY KEY,
    session_id UUID REFERENCES agent_sessions(session_id),
    turn_id UUID REFERENCES session_turns(turn_id),
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    tokens_input INTEGER,
    tokens_output INTEGER,
    tokens_total INTEGER,
    cost_usd DECIMAL(10, 6),
    latency_ms INTEGER,
    messages JSONB,
    response JSONB
);

SELECT create_hypertable('llm_calls', 'start_time');

-- Tool calls
CREATE TABLE tool_calls (
    tool_id UUID PRIMARY KEY,
    session_id UUID REFERENCES agent_sessions(session_id),
    turn_id UUID REFERENCES session_turns(turn_id),
    tool_name VARCHAR(255) NOT NULL,
    arguments JSONB,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    result JSONB,
    error TEXT,
    latency_ms INTEGER
);

-- Baselines
CREATE TABLE baselines (
    baseline_id UUID PRIMARY KEY,
    agent_name VARCHAR(255) NOT NULL,
    session_id UUID REFERENCES agent_sessions(session_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metrics JSONB NOT NULL,
    tags TEXT[]
);

-- Detected regressions
CREATE TABLE regressions (
    regression_id UUID PRIMARY KEY,
    session_id UUID REFERENCES agent_sessions(session_id),
    agent_name VARCHAR(255) NOT NULL,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    differences JSONB NOT NULL,
    severity VARCHAR(20) NOT NULL,
    resolved BOOLEAN DEFAULT FALSE
);

-- Detected anomalies
CREATE TABLE anomalies (
    anomaly_id UUID PRIMARY KEY,
    session_id UUID REFERENCES agent_sessions(session_id),
    agent_name VARCHAR(255) NOT NULL,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    anomaly_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    details JSONB NOT NULL,
    resolved BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX idx_sessions_agent_name ON agent_sessions(agent_name);
CREATE INDEX idx_sessions_start_time ON agent_sessions(start_time DESC);
CREATE INDEX idx_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX idx_llm_calls_session ON llm_calls(session_id);
CREATE INDEX idx_tool_calls_session ON tool_calls(session_id);
CREATE INDEX idx_regressions_agent ON regressions(agent_name, detected_at DESC);
CREATE INDEX idx_anomalies_agent ON anomalies(agent_name, detected_at DESC);
```

---

## Deployment

### Option 1: Docker Compose (Development)

```bash
cd platform
docker-compose up -d
```

Services available:
- **API**: http://localhost:8000
- **Dashboard**: http://localhost:3000
- **Database**: localhost:5432
- **Redis**: localhost:6379

### Option 2: Kubernetes (Production)

```bash
kubectl apply -f k8s/
```

Includes:
- Horizontal pod autoscaling
- Persistent volumes
- Load balancing
- Health checks
- Resource limits

### Option 3: Cloud (Bagula Cloud)

```bash
# Use managed service
export BAGULA_API_KEY="your-key"
export BAGULA_ENDPOINT="https://api.bagula.ai"

# Client automatically sends to cloud
```

---

## Key Advantages of This Architecture

1. **Non-blocking** - Client SDK doesn't slow down your app
2. **Real-time** - Continuous monitoring of production agents
3. **Scalable** - Workers process data in background, can scale independently
4. **Historical** - All data stored for trend analysis
5. **Automatic** - Detects regressions without manual test writing
6. **Complete** - Captures entire sessions, not just individual calls
7. **Production-ready** - Built for real production workloads

---

## What Gets Detected Automatically

From your LinkedIn article's 7 failure modes:

1. **Skill Bloat** ✅ - Detects when tool usage degrades after adding more tools
2. **Context Rot** ✅ - Tracks when agents stop following instructions
3. **Confident Hallucination** ✅ - Compares confidence vs user satisfaction
4. **Sequential Processing Tax** ✅ - Latency anomaly detection
5. **Cost Creep** ✅ - Cost spike detection with alerts
6. **Multi-Agent Cascades** ✅ - Tracks sessions across multiple agents
7. **Model Update Surprises** ✅ - Baseline comparison catches behavior changes

---

## Next Steps

1. Deploy platform: `docker-compose up`
2. Instrument your agent with `@bagula/client`
3. Watch dashboard for real-time monitoring
4. Get alerted on regressions automatically

**Questions?** See `/docs/QUICK_START.md` for step-by-step guide.
