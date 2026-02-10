# @bagula/core

Core testing framework for AI agent regression testing.

## Features

- **Test Runner**: Execute AI agent tests with comprehensive validation
- **Baseline Management**: Track and compare agent behavior over time
- **Metrics Collection**: Monitor cost, latency, and token usage
- **Confidence Calibration**: Analyze how well agent confidence matches accuracy
- **Multi-Provider Support**: Works with OpenAI, Anthropic, and custom providers

## Installation

```bash
npm install @bagula/core
```

## Quick Start

```typescript
import { TestRunner, TestSuite, AgentConfig } from '@bagula/core';

// Define your agent configuration
const agentConfig: AgentConfig = {
  name: 'customer-support-agent',
  model: 'gpt-4',
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
  systemPrompt: 'You are a helpful customer support agent.',
};

// Create test cases
const testSuite: TestSuite = {
  id: 'customer-support-tests',
  name: 'Customer Support Agent Tests',
  config: agentConfig,
  tests: [
    {
      id: 'test-1',
      name: 'Handle refund request',
      input: 'I want to request a refund for order #12345',
      expectedBehavior: {
        outputContains: ['refund', 'order'],
        maxLatencyMs: 5000,
        maxCostUsd: 0.01,
      },
    },
  ],
  budgets: {
    maxLatencyMs: 10000,
    maxCostPerTestUsd: 0.05,
  },
};

// Run tests
const runner = new TestRunner();
const results = await runner.runSuite(testSuite, {
  compareBaseline: true,
  saveBaseline: true,
});

console.log(`Passed: ${results.summary.passed}/${results.summary.total}`);
console.log(`Total cost: $${results.summary.totalCostUsd.toFixed(4)}`);
console.log(`Avg latency: ${results.summary.averageLatencyMs.toFixed(0)}ms`);
```

## License

Apache-2.0
