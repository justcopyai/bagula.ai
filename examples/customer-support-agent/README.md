# Customer Support Agent Example

This example demonstrates how to use Bagula to test a customer support chatbot.

## Setup

1. Install dependencies:

```bash
npm install -g @bagula/cli
```

2. Set your API key:

```bash
export OPENAI_API_KEY="your-api-key-here"
```

## Running Tests

```bash
# Run all tests
bagula run

# Run with baseline comparison
bagula run --baseline

# Save results as baseline
bagula run --save-baseline

# Run in CI mode
bagula ci
```

## Test Coverage

This example includes tests for:

- ✅ **Refund requests** - Agent should use tools to lookup and process refunds
- ✅ **Order tracking** - Agent should track shipments
- ✅ **General inquiries** - Agent should respond without using tools
- ✅ **Angry customers** - Agent should remain professional
- ✅ **Multiple issues** - Agent should handle complex requests
- ✅ **Unclear requests** - Agent should ask clarifying questions
- ✅ **Out-of-scope questions** - Agent should politely decline

## Budget Gates

This example enforces:
- Max 10 seconds latency per test
- Max $0.05 per test
- Max $0.50 total cost for suite

## Expected Results

All tests should pass with:
- 100% pass rate
- Average latency < 5 seconds
- Total cost < $0.20

## Baseline Tracking

After running tests, save as baseline:

```bash
bagula baseline save customer-support-suite --tag production
```

Future runs will compare against this baseline to detect regressions.
