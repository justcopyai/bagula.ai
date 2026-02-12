# Simple Agent Example

This example demonstrates how to instrument a basic AI agent with Bagula monitoring.

## What It Does

The example agent:
- Processes user requests using OpenAI GPT-3.5-turbo
- Executes tools (weather lookup, database search)
- Records all LLM calls and tool executions
- Sends session data to Bagula platform
- Automatically triggers opportunity detection

## Prerequisites

1. **Bagula Platform Running**:
   ```bash
   cd ../../platform
   docker-compose up -d
   ```

2. **OpenAI API Key**:
   - Get your key from https://platform.openai.com/api-keys

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

3. **Run the example**:
   ```bash
   npm start
   ```

## What to Expect

The example will:
1. Run 4 different scenarios
2. Send session data to Bagula after each scenario
3. Print session IDs and dashboard links
4. Complete in ~15 seconds

**Sample Output:**
```
🚀 Bagula Simple Agent Example

🤖 Agent starting for user user-1...
📝 Request: "Hello! How are you today?"

[Bagula] Started trace: abc-123...
[Bagula] Added span: llm_call - openai:gpt-3.5-turbo
✅ Agent completed successfully
💬 Response: "Hello! I'm doing well, thank you for asking..."

📊 Session ID: abc-123-def-456
🔗 View in dashboard: http://localhost:3000/sessions/abc-123-def-456
```

## View Results

Open the dashboard:
```
http://localhost:3000
```

You should see:
- 4 sessions from different users
- Session details with LLM calls and tool executions
- Detected opportunities for optimization

## What Bagula Will Detect

After running this example, Bagula workers will analyze the sessions and may detect:

### Cost Opportunities
- If using GPT-4 for simple requests, suggests GPT-3.5-turbo
- Identifies expensive tool calls

### Performance Opportunities
- Flags slow tool executions
- Suggests parallel tool execution

### Quality Opportunities
- Detects any tool failures
- Identifies incomplete sessions

### Regression Opportunities
- After setting a baseline, compares new sessions against it

## Customize the Example

### Add More Tools

```typescript
const tools = {
  async myCustomTool(param: string): Promise<string> {
    // Your tool implementation
    return result;
  },
};

// Record in Bagula
tracker.recordToolCall(sessionId, turnId, {
  toolName: 'myCustomTool',
  arguments: { param },
  result,
  latencyMs: duration,
});
```

### Use Different LLM Models

```typescript
// Try GPT-4 to see cost differences
const model = 'gpt-4';

const completion = await openai.chat.completions.create({
  model,
  /* ... */
});

// Bagula will flag this as expensive vs GPT-3.5-turbo
```

### Add User Feedback

```typescript
// Collect user feedback
const rating = getUserRating(); // 1-5

tracker.recordUserFeedback(sessionId, turnId, {
  rating,
  comment: 'Very helpful!',
});
```

## Next Steps

- **Set a Baseline**: Save a good session as baseline for regression detection
- **Tune Thresholds**: Adjust opportunity detection thresholds in platform/.env
- **Scale Up**: Run more sessions to generate meaningful analytics
- **Integrate**: Add Bagula to your production agents

## Troubleshooting

### "Failed to send events" Error

Make sure the Bagula platform is running:
```bash
docker-compose -f ../../platform/docker-compose.yml ps
```

All services should be "Up".

### "OpenAI API Error"

Check your API key is valid:
```bash
echo $OPENAI_API_KEY
```

### Sessions Not Appearing in Dashboard

1. Check API is reachable:
   ```bash
   curl http://localhost:8000/health
   ```

2. Check worker logs:
   ```bash
   docker-compose -f ../../platform/docker-compose.yml logs worker-cost
   ```

## Learn More

- [Bagula Documentation](../../docs/quickstart.md)
- [API Reference](../../docs/api-reference.md)
- [Dashboard Guide](../../packages/dashboard/README.md)
