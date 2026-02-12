/**
 * Simple AI Agent Example with Bagula Monitoring
 *
 * This example demonstrates how to instrument an AI agent
 * to send session data to Bagula for monitoring and analysis.
 */

import { config } from 'dotenv';
import OpenAI from 'openai';
import { BagulaClient } from '@bagula/client';

// Load environment variables
config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Bagula Client
const bagula = new BagulaClient({
  apiKey: process.env.BAGULA_API_KEY || 'bagula-dev-key-12345',
  endpoint: process.env.BAGULA_ENDPOINT || 'http://localhost:8000',
  debug: true, // Enable debug logging
});

// Get session tracker
const tracker = bagula.getSessionTracker();

// Simple tools for the agent
const tools = {
  async getCurrentWeather(location: string): Promise<string> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simulate weather data
    const weather = ['sunny', 'cloudy', 'rainy', 'snowy'];
    const temp = Math.floor(Math.random() * 30) + 10;
    const condition = weather[Math.floor(Math.random() * weather.length)];

    return `Weather in ${location}: ${condition}, ${temp}°C`;
  },

  async searchDatabase(query: string): Promise<string[]> {
    // Simulate database search
    await new Promise((resolve) => setTimeout(resolve, 300));

    return [
      `Result 1 for "${query}"`,
      `Result 2 for "${query}"`,
      `Result 3 for "${query}"`,
    ];
  },
};

/**
 * Calculate cost for OpenAI API call
 */
function calculateCost(model: string, usage: { prompt_tokens: number; completion_tokens: number }): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 30, output: 60 }, // per million tokens (in dollars)
    'gpt-4-turbo': { input: 10, output: 30 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  };

  const prices = pricing[model] || pricing['gpt-3.5-turbo'];
  const inputCost = (usage.prompt_tokens / 1_000_000) * prices.input;
  const outputCost = (completion_tokens / 1_000_000) * prices.output;

  return inputCost + outputCost;
}

/**
 * Main agent function - processes user requests
 */
async function runAgent(userId: string, userRequest: string): Promise<string> {
  console.log(`\n🤖 Agent starting for user ${userId}...`);
  console.log(`📝 Request: "${userRequest}"\n`);

  // Start Bagula session
  const sessionId = tracker.startSession('simple-agent', userRequest, {
    userId,
    environment: 'development',
  });

  // Start first turn
  const turnId = tracker.startTurn(sessionId, {
    type: 'user_message',
    content: userRequest,
  });

  try {
    // Call LLM
    const model = 'gpt-3.5-turbo';
    const startTime = Date.now();

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. You can check weather and search a database.',
        },
        {
          role: 'user',
          content: userRequest,
        },
      ],
      temperature: 0.7,
    });

    const latency = Date.now() - startTime;
    const response = completion.choices[0].message.content || '';

    // Record LLM call in Bagula
    tracker.recordLLMCall(sessionId, turnId, {
      provider: 'openai',
      model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: userRequest },
      ],
      response: completion,
      metrics: {
        tokensInput: completion.usage?.prompt_tokens || 0,
        tokensOutput: completion.usage?.completion_tokens || 0,
        tokensTotal: completion.usage?.total_tokens || 0,
        costUsd: calculateCost(model, completion.usage || { prompt_tokens: 0, completion_tokens: 0 }),
        latencyMs: latency,
      },
    });

    // Simulate tool usage if request mentions weather
    if (userRequest.toLowerCase().includes('weather')) {
      const location = extractLocation(userRequest) || 'New York';
      const toolStartTime = Date.now();

      try {
        const weatherResult = await tools.getCurrentWeather(location);
        const toolLatency = Date.now() - toolStartTime;

        // Record tool call
        tracker.recordToolCall(sessionId, turnId, {
          toolName: 'getCurrentWeather',
          arguments: { location },
          result: weatherResult,
          latencyMs: toolLatency,
        });

        console.log(`🛠️ Tool call: getCurrentWeather(${location})`);
        console.log(`   Result: ${weatherResult}`);
      } catch (error: any) {
        tracker.recordToolCall(sessionId, turnId, {
          toolName: 'getCurrentWeather',
          arguments: { location },
          error: error.message,
          latencyMs: Date.now() - toolStartTime,
        });
      }
    }

    // Record agent's response
    tracker.recordAgentResponse(sessionId, turnId, {
      message: response,
      toolCalls: [],
    });

    // Complete session successfully
    tracker.completeSession(sessionId, {
      status: 'success',
      userSatisfaction: 5,
    });

    console.log(`✅ Agent completed successfully`);
    console.log(`💬 Response: "${response}"\n`);
    console.log(`📊 Session ID: ${sessionId}`);
    console.log(`🔗 View in dashboard: http://localhost:3000/sessions/${sessionId}\n`);

    return response;
  } catch (error: any) {
    console.error(`❌ Agent failed:`, error.message);

    // Mark session as failed
    tracker.completeSession(sessionId, {
      status: 'failed',
      error: error.message,
    });

    throw error;
  }
}

/**
 * Extract location from user request (simple heuristic)
 */
function extractLocation(request: string): string | null {
  const match = request.match(/in ([A-Z][a-z]+(?: [A-Z][a-z]+)*)/);
  return match ? match[1] : null;
}

/**
 * Run example scenarios
 */
async function main() {
  console.log('🚀 Bagula Simple Agent Example\n');
  console.log('Make sure Bagula platform is running:');
  console.log('  docker-compose up -d\n');

  const scenarios = [
    { userId: 'user-1', request: 'Hello! How are you today?' },
    { userId: 'user-2', request: 'What is the weather like in San Francisco?' },
    { userId: 'user-3', request: 'Tell me about artificial intelligence' },
    { userId: 'user-4', request: 'What is the weather in Tokyo?' },
  ];

  for (const scenario of scenarios) {
    try {
      await runAgent(scenario.userId, scenario.request);

      // Wait a bit between requests
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Scenario failed:', error);
    }
  }

  // Wait for final flush
  console.log('\n⏳ Waiting for data to be sent to Bagula...');
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('\n✅ All scenarios complete!');
  console.log('🔗 View dashboard: http://localhost:3000\n');

  // Shutdown Bagula client
  await bagula.shutdown();
  process.exit(0);
}

// Run the example
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
