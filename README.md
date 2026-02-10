# 🧪 Bagula - AI Agent Operations Platform

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18-green)](https://nodejs.org/)

> **Your AI agent worked last week. Now it's confidently wrong. Test it before your users find out.**

Bagula is an open-source AI agent operations platform that helps you test, monitor, and prevent regressions in your AI agents. Built for the new era of probabilistic software, Bagula detects the 7 critical failure modes that traditional testing misses.

## 🌐 Website

**[bagula.ai](https://bagula.ai)** - Learn more and get started

---

## The Problem

AI agents fail differently than traditional software:

1. **🔧 Skill Bloat** - Adding tools beyond ~30 degrades existing capabilities
2. **📝 Context Rot** - Growing prompts push critical instructions into "lost in the middle" zones
3. **🎯 Confident Hallucination** - Agents sound authoritative while accuracy drops
4. **⏱️ Sequential Processing Tax** - Slow API call chains create poor UX
5. **💰 Cost Creep** - Token inflation accumulates undetected
6. **🔗 Multi-Agent Cascades** - Formatting drift breaks downstream partners
7. **🔄 Model Update Surprises** - Provider updates change behavior without code changes

Traditional regression testing doesn't catch these. **Bagula does.**

---

## ✨ Features

### 🧪 **Comprehensive Testing Framework**
- Write tests for AI agents like you write unit tests
- Define expected behavior, tool usage, and output validation
- Run tests in parallel for fast feedback

### 📊 **Baseline Tracking**
- Save agent behavior as baselines
- Compare current performance against historical behavior
- Detect subtle regressions across code changes

### 💰 **Cost & Latency Monitoring**
- Track token usage and API costs per test
- Set budget gates to prevent cost explosions
- Monitor per-step latency for UX optimization

### 🎯 **Confidence Calibration**
- Measure how well agent confidence matches actual accuracy
- Detect overconfident or underconfident behavior
- Expected Calibration Error (ECE) metrics

### 🔗 **Multi-Agent Testing**
- Test collaborative agent workflows
- Detect cascade failures and formatting drift
- Validate agent-to-agent communication

### 🔌 **Multi-Provider Support**
- OpenAI (GPT-4, GPT-4o, GPT-3.5)
- Anthropic (Claude 3 family)
- Custom providers

### 🚀 **CI/CD Integration**
- GitHub Actions plugin
- GitLab CI integration
- Fail builds on regressions or budget violations

---

## 🚀 Quick Start

### Two Ways to Use Bagula

#### Option 1: Observability Platform (Recommended for Production)

**1. Deploy Bagula Platform**
```bash
# Clone repo
git clone https://github.com/bagula-ai/bagula.git
cd bagula/platform

# Start services (API, Database, Workers, Dashboard)
docker-compose up -d
```

**2. Instrument Your Agent**
```bash
npm install @bagula/client
```

```typescript
import { BagulaClient } from '@bagula/client';

const bagula = new BagulaClient({
  apiKey: process.env.BAGULA_API_KEY,
  endpoint: 'http://localhost:8000' // or https://api.bagula.ai
});

// Track complete agent sessions
async function handleUserRequest(request: string) {
  const tracker = bagula.getSessionTracker();

  const sessionId = tracker.startSession('my-agent', request);

  // Your agent does work...
  const turnId = tracker.startTurn(sessionId, {
    type: 'user_message',
    content: request
  });

  // Track LLM calls
  tracker.recordLLMCall(sessionId, turnId, {
    provider: 'openai',
    model: 'gpt-4',
    // ... metrics ...
  });

  // Complete session
  tracker.completeSession(sessionId, {
    status: 'success',
    userSatisfaction: 5
  });
}
```

**3. View Dashboard**
- Open http://localhost:3000
- See real-time monitoring, regressions, anomalies
- All production sessions tracked automatically

---

#### Option 2: CLI Testing (For CI/CD)

**1. Install CLI**
```bash
npm install -g @bagula/cli
```

**2. Initialize**
```bash
bagula init
```

**3. Run Tests**
```bash
bagula run              # Run all tests
bagula run --baseline   # Compare with baseline
bagula ci               # CI mode with strict checks
```

See [CLI docs](./packages/cli/README.md) for details.

---

## 📚 Documentation

### Core Concepts

#### Test Cases

```typescript
{
  "id": "test-1",
  "name": "Handle refund request",
  "input": "I want a refund",
  "expectedBehavior": {
    "outputContains": ["refund"],
    "toolsUsed": ["lookup_order", "process_refund"],
    "maxLatencyMs": 5000,
    "maxCostUsd": 0.01,
    "minConfidence": 0.8
  }
}
```

#### Baselines

Bagula automatically tracks agent behavior as baselines. Compare current runs against baselines to detect:

- Output changes (semantic similarity)
- Tool usage changes
- Performance regressions (latency, cost, tokens)

```bash
# Save baseline
bagula baseline save customer-support --tag production

# Compare with baseline
bagula baseline compare customer-support --tag production
```

#### Budget Gates

Set budgets to prevent cost explosions and performance regressions:

```json
{
  "budgets": {
    "maxLatencyMs": 10000,
    "maxCostPerTestUsd": 0.05,
    "maxTotalCostUsd": 1.0,
    "maxTokensPerTest": 5000
  }
}
```

Tests fail if budgets are exceeded.

---

## 🏗️ Architecture

```
bagula/
├── packages/
│   ├── core/           # Core testing framework
│   ├── cli/            # Command-line interface
│   ├── dashboard/      # Web dashboard (coming soon)
│   ├── integrations/   # Framework integrations
│   └── plugins/        # CI/CD plugins
├── examples/           # Example projects
└── docs/              # Documentation
```

### Using as a Library

```typescript
import { TestRunner, TestSuite, AgentConfig } from '@bagula/core';

const config: AgentConfig = {
  name: 'my-agent',
  model: 'gpt-4',
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
};

const suite: TestSuite = {
  id: 'my-suite',
  name: 'My Test Suite',
  config,
  tests: [
    {
      id: 'test-1',
      name: 'Test greeting',
      input: 'Hello!',
      expectedBehavior: {
        outputContains: ['hello', 'hi'],
      },
    },
  ],
};

const runner = new TestRunner();
const results = await runner.runSuite(suite, {
  compareBaseline: true,
  saveBaseline: true,
});

console.log(`Passed: ${results.summary.passed}/${results.summary.total}`);
```

---

## 🔌 Integrations

### GitHub Actions

```yaml
name: AI Agent Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g @bagula/cli
      - run: bagula ci
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### Framework Integrations

Coming soon:
- LangChain
- CrewAI
- AutoGPT
- Microsoft Semantic Kernel

---

## 💼 Enterprise

Bagula is open-source (Apache 2.0) and free forever. For enterprise features, we offer **Bagula Cloud**:

### Bagula Cloud Features

- 🌐 **Hosted Dashboard** - Beautiful web UI for all your tests
- 📈 **Advanced Analytics** - Trends, anomaly detection, cost forecasting
- 🤖 **Autonomous Root Cause Analysis** - AI agents debug your AI agents
- 🔧 **Auto-Remediation** - Automatically fix regressions
- 👥 **Team Collaboration** - Share results, annotations, and insights
- 🔐 **Enterprise Security** - SSO, audit logs, compliance
- 📞 **Priority Support** - Dedicated support channel

**Learn more at [bagula.ai](https://bagula.ai)**

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/bagula-ai/bagula.git
cd bagula

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
- **GitHub Issues**: [github.com/bagula-ai/bagula/issues](https://github.com/bagula-ai/bagula/issues)
- **Discord**: [Join our community](https://discord.gg/bagula)
- **Twitter**: [@bagula_ai](https://twitter.com/bagula_ai)

---

## 🙏 Acknowledgments

Inspired by the excellent work from:
- The AI agent community
- Traditional testing frameworks (Jest, pytest)
- Monitoring platforms (Datadog, New Relic)

Built with ❤️ for the AI agent builders.

---

**⭐ Star us on GitHub if Bagula helps you build better AI agents!**
