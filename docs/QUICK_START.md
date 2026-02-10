# 🚀 Quick Start Guide

Get started with Bagula in 5 minutes.

## Prerequisites

- Node.js >= 18
- npm >= 9
- OpenAI or Anthropic API key

## Installation

```bash
npm install -g @bagula/cli
```

## Step 1: Initialize

Create a new directory and initialize Bagula:

```bash
mkdir my-agent-tests
cd my-agent-tests
bagula init
```

This creates a `bagula.config.json` file with example tests.

## Step 2: Set API Key

```bash
export OPENAI_API_KEY="sk-..."
# or
export ANTHROPIC_API_KEY="sk-ant-..."
```

## Step 3: Customize Tests

Edit `bagula.config.json` to add your agent's tests:

```json
{
  "suites": [
    {
      "id": "my-suite",
      "name": "My Agent Tests",
      "config": {
        "name": "my-agent",
        "model": "gpt-4",
        "provider": "openai",
        "systemPrompt": "You are a helpful assistant."
      },
      "tests": [
        {
          "id": "test-1",
          "name": "Test greeting",
          "input": "Hello!",
          "expectedBehavior": {
            "outputContains": ["hello", "hi"],
            "maxLatencyMs": 5000,
            "maxCostUsd": 0.01
          }
        }
      ]
    }
  ]
}
```

## Step 4: Run Tests

```bash
bagula run
```

You should see output like:

```
🧪 Bagula - AI Agent Testing

Running 1 suite(s)...

✓ My Agent Tests: 1/1 passed

📊 Summary

┌─────────────────────┬───────┬────────┬────────┬─────────┬──────────┬────────┐
│ Suite               │ Tests │ Passed │ Failed │ Latency │ Cost     │ Tokens │
├─────────────────────┼───────┼────────┼────────┼─────────┼──────────┼────────┤
│ my-suite            │ 1     │ 1      │ 0      │ 1234ms  │ $0.0012  │ 456    │
└─────────────────────┴───────┴────────┴────────┴─────────┴──────────┴────────┘

✅ All tests passed
```

## Step 5: Save Baseline

Once your tests pass, save them as a baseline:

```bash
bagula run --save-baseline
```

## Step 6: Compare with Baseline

Make changes to your agent and run again:

```bash
bagula run --baseline
```

Bagula will compare the new results with your baseline and flag any regressions.

## Next Steps

### Add More Tests

Add more test cases to cover different scenarios:

```json
{
  "tests": [
    {
      "id": "test-tool-usage",
      "name": "Test tool calling",
      "input": "Look up order #12345",
      "expectedBehavior": {
        "toolsUsed": ["lookup_order"],
        "outputContains": ["order"]
      }
    }
  ]
}
```

### Set Budget Gates

Prevent cost explosions with budget limits:

```json
{
  "budgets": {
    "maxLatencyMs": 10000,
    "maxCostPerTestUsd": 0.05,
    "maxTotalCostUsd": 1.0
  }
}
```

### Generate Reports

Create HTML or Markdown reports:

```bash
bagula report --format html --output report.html
```

### CI/CD Integration

Add to your GitHub Actions:

```yaml
- name: Run AI Agent Tests
  uses: bagula-ai/bagula-action@v1
  with:
    config: bagula.config.json
    baseline: true
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Common Patterns

### Testing Tool Usage

```json
{
  "expectedBehavior": {
    "toolsUsed": ["tool_name"],
    "toolsNotUsed": ["other_tool"]
  }
}
```

### Testing Output Quality

```json
{
  "expectedBehavior": {
    "outputContains": ["expected", "keywords"],
    "outputNotContains": ["bad", "words"],
    "minConfidence": 0.8
  }
}
```

### Testing Performance

```json
{
  "expectedBehavior": {
    "maxLatencyMs": 5000,
    "maxCostUsd": 0.01,
    "maxTokens": 1000
  }
}
```

## Troubleshooting

### Tests are failing

1. Check your API key is set correctly
2. Verify your system prompt and model
3. Review the test expectations
4. Check for API rate limits

### Baseline comparisons are too strict

Adjust the similarity threshold in your code or use tags for different baselines.

### Cost is too high

1. Use a cheaper model (gpt-3.5-turbo, claude-haiku)
2. Set stricter budget limits
3. Reduce max_tokens in config
4. Optimize your prompts

## Get Help

- 📚 [Full Documentation](https://bagula.ai/docs)
- 💬 [Discord Community](https://discord.gg/CjeXJxfSQ8)
- 🐛 [Report Issues](https://github.com/justcopyai/bagula.ai/issues)
- 📧 [Email Support](mailto:hello@bagula.ai)
- 🏢 [Built by JustCopy.ai](https://justcopy.ai)

---

**Ready to build reliable AI agents? Let's go! 🚀**
