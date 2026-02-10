# Bagula Platform - Container-Based Service

This is the **Bagula Platform** - a containerized service that receives and processes AI agent telemetry data.

## Quick Start

### 1. Start the Platform

```bash
docker-compose up -d
```

This starts:
- **API Server** (port 8000) - Ingestion endpoints
- **PostgreSQL** (TimescaleDB) - Time-series database
- **Redis** - Message queue
- **3 Background Workers** - Process data async
- **Dashboard UI** (port 3000) - Web interface

### 2. Verify Services

```bash
# Check health
curl http://localhost:8000/health

# Check metrics
curl http://localhost:8000/metrics
```

### 3. Instrument Your Agent

```bash
npm install @bagula/client
```

```typescript
import { BagulaClient } from '@bagula/client';

const bagula = new BagulaClient({
  apiKey: 'your-api-key',
  endpoint: 'http://localhost:8000'
});

// Track agent sessions
const tracker = bagula.getSessionTracker();
const sessionId = tracker.startSession('my-agent', 'user request');

// ... agent does work ...

tracker.completeSession(sessionId, { status: 'success' });
```

Sessions are automatically sent to the platform for analysis.

### 4. View Dashboard

Open http://localhost:3000 to see:
- Real-time agent monitoring
- Cost tracking
- Latency metrics
- Regression alerts
- Anomaly detection

## API Endpoints

### Ingestion
- `POST /v1/sessions/ingest` - Receive agent sessions (used by client SDK)

### Query
- `GET /v1/sessions/{id}` - Get specific session
- `GET /v1/agents/{name}/sessions` - List agent sessions
- `GET /v1/agents/{name}/metrics` - Get aggregated metrics
- `GET /v1/agents/{name}/regressions` - Detected regressions
- `GET /v1/agents/{name}/anomalies` - Detected anomalies

### System
- `GET /health` - Health check
- `GET /metrics` - Platform metrics

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://bagula:password@localhost:5432/bagula

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Workers
WORKER_CONCURRENCY=10
```

## Architecture

See [ARCHITECTURE.md](../docs/ARCHITECTURE.md) for complete details.

```
User's Agent → Client SDK → [Platform] → Database
                              ↓
                          Background
                           Workers
                              ↓
                          Dashboard
```

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run API locally
uvicorn app.main:app --reload

# Run worker locally
python -m app.workers.baseline_worker

# Run tests
pytest
```

## Production Deployment

### Docker Compose (Single Server)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes (Scalable)
```bash
kubectl apply -f k8s/
```

### Cloud (Managed)
Use Bagula Cloud at https://bagula.ai - no infrastructure needed!

## License

Apache 2.0 - See [LICENSE](../LICENSE)
