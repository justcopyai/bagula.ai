# 🔍 Bagula - AI Agent Monitoring Platform

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18-green)](https://nodejs.org/)
[![Built by](https://img.shields.io/badge/Built%20by-JustCopy.ai-purple)](https://justcopy.ai)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-5865F2)](https://discord.gg/CjeXJxfSQ8)

> **Monitor, analyze, and optimize your AI agents in production. Every LLM call. Every tool execution. Every opportunity to improve.**

Bagula is an open-source monitoring and observability platform for AI agents. Built by [JustCopy.ai](https://justcopy.ai), Bagula gives you complete visibility into your agent's behavior in production and automatically detects opportunities for cost optimization, performance improvement, and quality enhancement.

## 🌐 Website

**[bagula.ai](https://bagula.ai)** - Learn more and get started

---

## The Problem

AI agents in production are a black box:

1. **💰 Hidden Costs** - Expensive tool calls and redundant LLM requests drain budgets
2. **⏱️ Performance Blind Spots** - Slow operations and timeouts hurt user experience
3. **🎯 Quality Issues** - Failed tool calls, errors, and retries go unnoticed
4. **📉 Silent Regressions** - Behavior changes over time without anyone knowing
5. **🔍 No Visibility** - Can't debug or understand what agents are actually doing

**You need to see what's happening inside your agents. Bagula gives you that visibility.**

---

## ✨ Features

### 🔍 **Complete Session Recording**
- Track every LLM call with full request/response
- Monitor all tool executions with arguments and results
- Record user feedback and outcomes
- Full conversation history with timing data

### 💰 **Cost Optimization Detection**
- Identify expensive tool patterns (>$0.10 per call)
- Detect redundant LLM calls (same input within 5 min)
- Suggest model downgrades (GPT-4 → GPT-3.5 for simple tasks)
- Flag excessive token usage

### ⚡ **Performance Monitoring**
- Track latency for every operation
- Detect slow tool executions (>5s)
- Identify timeout risks
- Find opportunities for parallelization

### 🎯 **Quality Analysis**
- Monitor tool failure rates
- Detect error patterns
- Identify retry loops
- Track incomplete sessions

### 📉 **Regression Detection**
- Compare against baselines using LLM-based semantic analysis
- Automatic detection of behavior changes
- Severity scoring for changes
- Historical trend tracking

### 📊 **Beautiful Dashboard**
- Session explorer with drill-down capabilities
- LLM call viewer with request/response tabs
- Tool execution timeline
- Opportunity cards with actionable insights
- Cost and performance metrics

### 🔌 **Easy Integration**
- Simple SDK for TypeScript/JavaScript
- Works with any agent framework
- Asynchronous batching (non-blocking)
- Docker-based platform deployment

---

## 🚀 Quick Start

Bagula provides two components:
1. **@bagula/client** - NPM package for instrumenting your agents
2. **bagula/platform** - Docker container with the full monitoring platform

You can either:
- **Self-host**: Run the platform yourself (free, open source)
- **Use Bagula Cloud**: We host it for you (managed service)

### Option A: Self-Hosted (Docker Compose)

```bash
# Clone repo
git clone https://github.com/justcopyai/bagula.ai.git
cd bagula.ai/platform

# Start all services
docker-compose up -d

# Verify platform is running
curl http://localhost:8000/health
```

This starts:
- **API Server** (port 8000) - Receives session data
- **PostgreSQL + TimescaleDB** - Stores session data
- **Redis** - Message queue for workers
- **4 Background Workers** - Detect opportunities
- **Dashboard** (port 3000) - View sessions and insights

### Option B: Self-Hosted (Docker Container)

```bash
# Pull the official Bagula container
docker pull ghcr.io/justcopyai/bagula/platform:latest

# Run with your own PostgreSQL and Redis
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  ghcr.io/justcopyai/bagula/platform:latest
```

### Option C: Bagula Cloud (Managed)

No infrastructure needed - we run it for you.

1. Sign up at [bagula.cloud](https://bagula.cloud)
2. Get your API key
3. Instrument your agents (see Step 2 below)

---

### Step 2: Instrument Your Agent

### Step 2: Instrument Your Agent

```bash
npm install @bagula/client
```

```typescript
import { BagulaClient } from '@bagula/client';

const bagula = new BagulaClient({
  apiKey: process.env.BAGULA_API_KEY,
  endpoint: 'http://localhost:8000'
});

// Get session tracker
const tracker = bagula.getSessionTracker();

// Track agent execution
async function handleUserRequest(userId: string, request: string) {
  // Start session
  const sessionId = tracker.startSession('my-agent', request, { userId });

  // Start turn
  const turnId = tracker.startTurn(sessionId, {
    type: 'user_message',
    content: request
  });

  // Your agent calls LLM
  const llmResponse = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: request }]
  });

  // Record LLM call
  tracker.recordLLMCall(sessionId, turnId, {
    provider: 'openai',
    model: 'gpt-4',
    messages: [{ role: 'user', content: request }],
    response: llmResponse,
    metrics: {
      tokensInput: llmResponse.usage.prompt_tokens,
      tokensOutput: llmResponse.usage.completion_tokens,
      tokensTotal: llmResponse.usage.total_tokens,
      costUsd: 0.03, // Calculate based on pricing
      latencyMs: 2300
    }
  });

  // If agent uses tools, record them
  tracker.recordToolCall(sessionId, turnId, {
    toolName: 'search_database',
    arguments: { query: 'user data' },
    result: { found: true },
    latencyMs: 150
  });

  // Record agent's response
  tracker.recordAgentResponse(sessionId, turnId, {
    message: llmResponse.choices[0].message.content,
    toolCalls: []
  });

  // Complete session
  tracker.completeSession(sessionId, {
    status: 'success',
    userSatisfaction: 5
  });

  return llmResponse.choices[0].message.content;
}
```

### Step 3: View Dashboard

**Self-Hosted:**
Open http://localhost:3000 to view your sessions

**Bagula Cloud:**
Login to https://dashboard.bagula.cloud

You'll see:
- All agent sessions with full drill-down
- LLM calls with request/response details
- Tool executions with timing
- Detected opportunities for improvement
- Cost and performance metrics over time

---

## 🐳 Using the Container

Bagula publishes an official Docker container that includes the complete platform:

```bash
# Pull latest version
docker pull ghcr.io/justcopyai/bagula/platform:latest

# Or specific version
docker pull ghcr.io/justcopyai/bagula/platform:v0.1.0
```

The container includes:
- API server (Fastify/TypeScript)
- Background workers (cost, performance, quality, regression)
- Dashboard (Next.js)

**Required Environment Variables:**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/bagula
REDIS_URL=redis://host:6379/0
NODE_ENV=production
```

**Optional Configuration:**
```bash
OPENAI_API_KEY=sk-...              # For regression detection
ANTHROPIC_API_KEY=sk-ant-...       # Alternative for regression detection
COST_EXPENSIVE_THRESHOLD_USD=0.10  # Cost alert threshold
PERFORMANCE_SLOW_TOOL_THRESHOLD_MS=5000  # Performance alert threshold
```

---

## 📚 Documentation

### Core Concepts

#### Sessions

A **session** represents a complete interaction between a user and your agent, from initial request to final outcome. Each session contains:

- **Turns**: Individual conversation exchanges
- **LLM Calls**: Every call to an LLM provider with full request/response
- **Tool Calls**: Every tool execution with arguments and results
- **Metrics**: Cost, latency, tokens for the entire session

#### Opportunities

Bagula automatically detects **opportunities** for improvement:

**Cost Optimization:**
- Expensive tool patterns
- Redundant LLM calls
- Model downgrade opportunities
- Excessive token usage

**Performance:**
- Slow tool executions
- LLM timeout risks
- Excessive turns
- Parallelization opportunities

**Quality:**
- High tool failure rates
- Error patterns
- Retry loops
- Incomplete sessions

**Regression Detection:**
- Semantic changes from baseline
- Behavior drift over time
- Outcome changes

Each opportunity includes:
- Severity (low/medium/high)
- Description of the issue
- Suggested action
- Estimated impact (cost savings, latency reduction)

#### Baselines

Save a session as a **baseline** to detect regressions:

```typescript
// Save current session as baseline
await api.saveBaseline('my-agent', sessionId);

// Future sessions are automatically compared
// Opportunities created when significant changes detected
```

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Your Agent    │
│  (instrumented) │
└────────┬────────┘
         │ @bagula/client SDK
         │ (batches sessions)
         ▼
┌─────────────────┐
│   Bagula API    │ ◄──── HTTP POST /v1/sessions/ingest
│   (FastAPI)     │
└────────┬────────┘
         │
         ├──► PostgreSQL + TimescaleDB (session storage)
         │
         └──► Redis Queue
                │
                ├──► Cost Worker (detects expensive patterns)
                ├──► Performance Worker (finds slow operations)
                ├──► Quality Worker (identifies errors)
                └──► Regression Worker (compares vs baseline)
                      │
                      ▼
                ┌────────────────┐
                │  Opportunities │
                │     Table      │
                └────────┬───────┘
                         │
                         ▼
                ┌─────────────────┐
                │    Dashboard    │
                │ (React/Next.js) │
                └─────────────────┘
```

### Repository Structure

```
bagula/
├── packages/
│   ├── client/         # TypeScript SDK for instrumenting agents
│   └── dashboard/      # React/Next.js web dashboard
├── platform/           # Python/FastAPI backend
│   ├── app/
│   │   ├── main.py           # API endpoints
│   │   ├── database.py       # PostgreSQL integration
│   │   ├── queue.py          # Redis queue manager
│   │   ├── analyzer.py       # Metrics and analysis
│   │   └── workers/          # Background opportunity detection
│   ├── init-db.sql           # Database schema
│   └── docker-compose.yml    # Full platform deployment
└── docs/               # Documentation
```

---

## 🔌 Framework Integration Examples

Bagula works with any agent framework. Here are some examples:

### LangChain

```typescript
import { BagulaClient } from '@bagula/client';
import { ChatOpenAI } from 'langchain/chat_models/openai';

const bagula = new BagulaClient({ /* config */ });
const tracker = bagula.getSessionTracker();

// Wrap your LangChain calls
const sessionId = tracker.startSession('langchain-agent', userInput);
const turnId = tracker.startTurn(sessionId, { type: 'user_message', content: userInput });

const model = new ChatOpenAI();
const startTime = Date.now();
const response = await model.call([{ role: 'user', content: userInput }]);
const latency = Date.now() - startTime;

tracker.recordLLMCall(sessionId, turnId, {
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: userInput }],
  response: response,
  metrics: { latencyMs: latency, /* ... */ }
});

tracker.completeSession(sessionId, { status: 'success' });
```

### Custom Agents

Works with any agent implementation - just add tracking calls around your LLM and tool invocations.

---

## ☁️ Bagula Cloud (Managed Service)

Bagula is **100% open source and free** to self-host forever. For teams who want a managed solution, we offer **Bagula Cloud**:

### What's Included

**Core Platform** (uses the open source container)
- All features from open source
- Automatic updates
- Managed infrastructure
- 99.9% uptime SLA

**Cloud-Exclusive Features**
- 👥 **Multi-Tenancy** - Multiple organizations and teams
- 🔐 **Authentication** - SSO (SAML/OIDC), team invitations, role-based access
- 💳 **Usage-Based Billing** - Only pay for what you use
- 📊 **Advanced Analytics** - Trends, forecasting, custom dashboards
- 🤖 **AI-Powered Insights** - Automatic root cause analysis
- 🔧 **Auto-Remediation** - Apply optimizations automatically
- 📞 **Priority Support** - Dedicated support with SLA
- 🔌 **Integrations** - Slack, PagerDuty, DataDog, and more

### How It Works

Bagula Cloud uses the **exact same open source container** (`ghcr.io/justcopyai/bagula/platform`) that you can run yourself. We add a lightweight proxy layer for:

- **Multi-tenancy**: Isolates data by organization
- **Authentication**: User login and team management (via Clerk)
- **Billing**: Usage tracking and subscriptions (via Stripe)

```
┌──────────────────────────────────────────┐
│          Bagula Cloud                    │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │   Auth + Billing Layer (Closed)   │ │  ← Cloud-only
│  │   (Clerk, Stripe, Multi-tenancy)  │ │
│  └─────────────┬──────────────────────┘ │
│                │                          │
│  ┌─────────────▼──────────────────────┐ │
│  │  Open Source Container             │ │  ← You can run this
│  │  ghcr.io/justcopyai/bagula/platform│ │
│  │  (API, Workers, Dashboard)         │ │
│  └────────────────────────────────────┘ │
│                                          │
│  RDS PostgreSQL + ElastiCache Redis      │
└──────────────────────────────────────────┘
```

This architecture ensures:
✅ Open source stays 100% functional
✅ No vendor lock-in
✅ Easy migration between self-hosted and cloud
✅ Same features in both versions

### Pricing

- **Starter**: $29/month - 10K sessions, 50K LLM calls
- **Pro**: $99/month - 50K sessions, 250K LLM calls, + usage
- **Enterprise**: Custom - Unlimited, SSO, dedicated support

**[Start Free Trial →](https://bagula.cloud)**

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/justcopyai/bagula.ai.git
cd bagula.ai

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Start development mode
npm run dev
```

---

## 📄 License

Apache License 2.0 - See [LICENSE](LICENSE) for details.

---

## 🌟 Why "Bagula"?

The name comes from the concept of a "guard" or "watchman" - someone who vigilantly watches over something important. Bagula watches over your AI agents, ensuring they remain reliable and trustworthy.

---

## 📞 Contact & Support

- **Website**: [bagula.ai](https://bagula.ai)
- **GitHub Issues**: [github.com/justcopyai/bagula.ai/issues](https://github.com/justcopyai/bagula.ai/issues)
- **Discord**: [Join our community](https://discord.gg/CjeXJxfSQ8)
- **X/Twitter**: [@justcopy_ai](https://x.com/justcopy_ai)

---

## 🏢 Built by JustCopy.ai

Bagula is built and maintained by [**JustCopy.ai**](https://justcopy.ai) - AI-powered tools for developers and enterprises.

### Other Products
- **JustCopy.ai** - AI development platform with advanced agent capabilities
- **Bagula** - Open source AI agent operations and monitoring

---

## 🙏 Acknowledgments

Inspired by the excellent work from:
- The AI agent community
- Traditional testing frameworks (Jest, pytest)
- Monitoring platforms (Datadog, New Relic)

Built with ❤️ by the [JustCopy.ai](https://justcopy.ai) team for AI agent builders everywhere.

---

**⭐ Star us on GitHub if Bagula helps you build better AI agents!**
