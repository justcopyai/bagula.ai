# Bagula Quick Start Guide

Get your AI agent monitoring and observability platform running in minutes.

## Prerequisites

- Docker and Docker Compose installed
- Node.js >= 18 for SDK usage
- (Optional) OpenAI or Anthropic API key for regression detection

## Step 1: Deploy Bagula Platform

Clone the repository and start the platform services:

```bash
# Clone repository
git clone https://github.com/justcopyai/bagula.ai.git
cd bagula.ai/platform

# Copy environment variables
cp .env.example .env

# (Optional) Add your LLM API keys for regression detection
# Edit .env and add:
# OPENAI_API_KEY=your-key-here
# ANTHROPIC_API_KEY=your-key-here

# Start all services
docker-compose up -d
```

This starts:
- **PostgreSQL + TimescaleDB** (port 5432) - Session storage
- **Redis** (port 6379) - Message queue
- **Bagula API** (port 8000) - REST API for ingestion
- **4 Background Workers** - Detect opportunities (cost, performance, quality, regression)
- **Dashboard** (port 3000) - Web UI for viewing sessions

Verify the platform is running:

```bash
curl http://localhost:8000/health
```

## Step 2: Instrument Your Agent

Install the Bagula client SDK:

```bash
npm install @bagula/client
```

### Basic Usage with Session Tracker

```typescript
import { BagulaClient } from '@bagula/client';

// Initialize client
const bagula = new BagulaClient({
  apiKey: 'bagula-dev-key-12345', // Use your actual API key in production
  endpoint: 'http://localhost:8000',
  debug: true, // Enable debug logging
});

// Get session tracker
const tracker = bagula.getSessionTracker();

async function handleUserRequest(userId: string, request: string) {
  // Start session
  const sessionId = tracker.startSession('my-agent', request, {
    userId,
    environment: 'production',
  });

  // Start first turn
  const turnId = tracker.startTurn(sessionId, {
    type: 'user_message',
    content: request,
  });

  try {
    // Your agent calls LLM
    const response = await callYourLLM(request);

    // Record the LLM call
    tracker.recordLLMCall(sessionId, turnId, {
      provider: 'openai',
      model: 'gpt-4',
      messages: [{ role: 'user', content: request }],
      response: response,
      metrics: {
        tokensInput: response.usage.prompt_tokens,
        tokensOutput: response.usage.completion_tokens,
        tokensTotal: response.usage.total_tokens,
        costUsd: calculateCost(response.usage), // Your cost calculation
        latencyMs: Date.now() - startTime,
      },
    });

    // If agent uses tools, record them
    if (needsToolCall) {
      const toolResult = await myTool.execute(params);

      tracker.recordToolCall(sessionId, turnId, {
        toolName: 'search_database',
        arguments: params,
        result: toolResult,
        latencyMs: 150,
      });
    }

    // Record agent's response
    tracker.recordAgentResponse(sessionId, turnId, {
      message: response.content,
      toolCalls: [],
    });

    // Complete session
    tracker.completeSession(sessionId, {
      status: 'success',
      userSatisfaction: 5, // Optional: 1-5 rating
    });

    return response.content;
  } catch (error) {
    // Mark session as failed
    tracker.completeSession(sessionId, {
      status: 'failed',
      error: error.message,
    });
    throw error;
  }
}
```

### Alternative: Lower-Level Trace API

```typescript
import { BagulaClient } from '@bagula/client';

const bagula = new BagulaClient({
  apiKey: 'bagula-dev-key-12345',
  endpoint: 'http://localhost:8000',
});

// Wrap your agent function
const result = await bagula.traceAgent('my-agent', userInput, async (traceId) => {
  // Track LLM call
  const llmResponse = await bagula.traceLLMCall(
    traceId,
    'gpt-4',
    'openai',
    messages,
    async () => await openai.chat.completions.create({ /* ... */ })
  );

  // Track tool call
  const toolResult = await bagula.traceToolCall(
    traceId,
    'search_database',
    { query: 'users' },
    async () => await myTool.search('users')
  );

  return processResponse(llmResponse, toolResult);
});
```

## Step 3: View Dashboard

Open your browser and navigate to:

```
http://localhost:3000
```

You should see:
- **Sessions Page**: List of all agent executions
- **Session Details**: Drill down into turns, LLM calls, tool calls
- **Opportunities**: Detected improvements for cost, performance, quality

## Step 4: Understand Opportunities

Bagula automatically detects opportunities in 4 categories:

### 💰 Cost Optimization
- Expensive tool calls (>$0.10 per call)
- Redundant LLM calls (duplicate inputs)
- Model downgrade opportunities (GPT-4 → GPT-3.5 for simple tasks)
- Excessive token usage (>5000 tokens)

### ⚡ Performance
- Slow tool executions (>5s)
- LLM timeout risks (>25s)
- Excessive turns (>10 turns for simple requests)
- Sequential operations that could be parallelized

### 🎯 Quality
- High tool failure rates (>20%)
- Error patterns and retry loops
- Incomplete sessions
- Missing error handling

### 📉 Regression
- Semantic changes from baseline
- Behavior drift over time
- Uses cheap LLM (GPT-3.5-turbo) to compare sessions

## Step 5: Set Baselines for Regression Detection

Save a "good" session as a baseline:

```bash
curl -X POST http://localhost:8000/v1/baselines \
  -H "Authorization: Bearer bagula-dev-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "my-agent",
    "sessionId": "your-session-id",
    "tags": ["production", "v1.0"]
  }'
```

Future sessions will be automatically compared against this baseline.

## Production Deployment

### Environment Variables

Update your `.env` file for production:

```bash
# Database
DATABASE_URL=postgresql://bagula:STRONG_PASSWORD@database:5432/bagula

# Redis
REDIS_URL=redis://redis:6379/0

# LLM API Keys (for regression detection)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Server
NODE_ENV=production
LOG_LEVEL=info

# Opportunity Detection Thresholds (optional tuning)
COST_EXPENSIVE_THRESHOLD_USD=0.10
PERFORMANCE_SLOW_TOOL_THRESHOLD_MS=5000
QUALITY_TOOL_FAILURE_THRESHOLD=0.20
```

### Generate API Keys

For production, generate proper API keys:

```sql
-- Connect to PostgreSQL
psql -U bagula -d bagula

-- Insert new API key
INSERT INTO api_keys (key_hash, name, organization, active)
VALUES ('your-secure-api-key-hash', 'Production Key', 'Your Org', TRUE);
```

Use this key in your agent instrumentation.

### Scaling Workers

To handle high throughput, scale background workers:

```bash
# Scale cost detection workers
docker-compose up -d --scale worker-cost=3

# Scale all workers
docker-compose up -d --scale worker-cost=2 --scale worker-performance=2 --scale worker-quality=2 --scale worker-regression=1
```

## Troubleshooting

### Platform Not Starting

Check logs:
```bash
docker-compose logs api
docker-compose logs database
docker-compose logs redis
```

Verify ports are not in use:
```bash
lsof -i :8000  # API
lsof -i :3000  # Dashboard
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

### Sessions Not Appearing

1. Check API is receiving data:
```bash
curl http://localhost:8000/health
```

2. Check client SDK debug logs:
```typescript
const bagula = new BagulaClient({
  /* ... */
  debug: true, // Enable debug logging
});
```

3. Check worker logs:
```bash
docker-compose logs worker-cost
docker-compose logs worker-performance
```

### Dashboard Shows Empty State

1. Verify API endpoint in dashboard config:
```bash
# Check dashboard environment
docker-compose exec dashboard env | grep NEXT_PUBLIC_API_URL
```

2. Check API key is correct:
```bash
# In dashboard .env.local
NEXT_PUBLIC_API_KEY=bagula-dev-key-12345
```

## Next Steps

- **Integrate with CI/CD**: Monitor agent tests in your pipelines
- **Set up Alerts**: Configure notifications for high-severity opportunities
- **Customize Thresholds**: Tune detection thresholds for your use case
- **Export Data**: Use the API to export session data for analysis
- **Build Custom Dashboards**: Use the REST API to build custom visualizations

## API Reference

See [API Reference](./api-reference.md) for complete API documentation.

## Support

- **GitHub Issues**: https://github.com/justcopyai/bagula.ai/issues
- **Discord**: https://discord.gg/CjeXJxfSQ8
- **Documentation**: https://bagula.ai/docs

---

**Built by [JustCopy.ai](https://justcopy.ai)** | Open source under Apache 2.0 License
