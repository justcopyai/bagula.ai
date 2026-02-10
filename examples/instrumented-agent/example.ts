/**
 * Example: How to instrument your AI agent with Bagula
 */

import { BagulaClient } from '@bagula/client';
import OpenAI from 'openai';

// Initialize Bagula client
const bagula = new BagulaClient({
  apiKey: process.env.BAGULA_API_KEY!,
  endpoint: process.env.BAGULA_ENDPOINT || 'http://localhost:8000',
  debug: true,
});

// Your OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Example tools
const tools = {
  async lookup_order(orderId: string) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      orderId,
      status: 'shipped',
      total: 99.99,
      items: ['Product A', 'Product B'],
    };
  },

  async process_refund(orderId: string, reason: string) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      refundId: `REF-${Date.now()}`,
      amount: 99.99,
      status: 'processed',
    };
  },

  async search_knowledge_base(query: string) {
    // Simulate search
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      results: [
        { title: 'Refund Policy', excerpt: 'We offer 30-day refunds...' },
        { title: 'Shipping Info', excerpt: 'Standard shipping takes...' },
      ],
    };
  },
};

/**
 * Customer support agent with Bagula instrumentation
 */
async function customerSupportAgent(userRequest: string, userId: string) {
  const tracker = bagula.getSessionTracker();

  // 1. Start session
  const sessionId = tracker.startSession(
    'customer-support-agent',
    userRequest,
    {
      userId,
      metadata: {
        channel: 'web',
        priority: 'normal',
      },
      tags: ['support', 'production'],
    }
  );

  console.log(`\n🚀 Started session: ${sessionId}`);
  console.log(`📝 User request: "${userRequest}"\n`);

  try {
    const conversationHistory: any[] = [
      {
        role: 'system',
        content: 'You are a helpful customer support agent. Use tools to help customers.',
      },
    ];

    let turnCount = 0;
    let finalResponse = '';

    // Agent loop - may take multiple turns
    while (turnCount < 5) {
      turnCount++;

      // 2. Start a turn
      const turnId = tracker.startTurn(sessionId, {
        type: turnCount === 1 ? 'user_message' : 'agent_followup',
        content: turnCount === 1 ? userRequest : 'continuing...',
      });

      console.log(`\n--- Turn ${turnCount} ---`);

      if (turnCount === 1) {
        conversationHistory.push({
          role: 'user',
          content: userRequest,
        });
      }

      // 3. Call LLM - tracked
      const llmCallStart = Date.now();
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: conversationHistory,
        tools: [
          {
            type: 'function',
            function: {
              name: 'lookup_order',
              description: 'Look up order details by order ID',
              parameters: {
                type: 'object',
                properties: {
                  orderId: { type: 'string', description: 'Order ID' },
                },
                required: ['orderId'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'process_refund',
              description: 'Process a refund for an order',
              parameters: {
                type: 'object',
                properties: {
                  orderId: { type: 'string' },
                  reason: { type: 'string' },
                },
                required: ['orderId', 'reason'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'search_knowledge_base',
              description: 'Search company knowledge base',
              parameters: {
                type: 'object',
                properties: {
                  query: { type: 'string' },
                },
                required: ['query'],
              },
            },
          },
        ],
      });

      const llmCallEnd = Date.now();
      const choice = response.choices[0];
      const message = choice.message;

      // Record LLM call
      tracker.recordLLMCall(sessionId, turnId, {
        callId: `llm-${turnCount}`,
        provider: 'openai',
        model: 'gpt-4',
        startTime: llmCallStart,
        endTime: llmCallEnd,
        messages: conversationHistory.map((m: any) => ({
          role: m.role,
          content: m.content,
          timestamp: Date.now(),
        })),
        response: {
          content: message.content || '',
          toolCalls: message.tool_calls,
          finishReason: choice.finish_reason,
        },
        metrics: {
          tokensInput: response.usage?.prompt_tokens || 0,
          tokensOutput: response.usage?.completion_tokens || 0,
          tokensTotal: response.usage?.total_tokens || 0,
          costUsd: calculateCost('gpt-4', response.usage),
          latencyMs: llmCallEnd - llmCallStart,
        },
      });

      console.log(`💬 LLM response: ${message.content || '(tool calls)'}`);
      console.log(`📊 Tokens: ${response.usage?.total_tokens}, Cost: $${calculateCost('gpt-4', response.usage).toFixed(4)}`);

      // 4. Handle tool calls if any
      const toolCalls: any[] = [];

      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log(`\n🔧 Executing ${message.tool_calls.length} tool(s):`);

        conversationHistory.push({
          role: 'assistant',
          content: message.content,
          tool_calls: message.tool_calls,
        });

        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          console.log(`  → ${toolName}(${JSON.stringify(toolArgs)})`);

          // Execute tool with tracking
          const toolStart = Date.now();
          let toolResult;

          try {
            toolResult = await (tools as any)[toolName](...Object.values(toolArgs));
            const toolEnd = Date.now();

            console.log(`    ✅ Result: ${JSON.stringify(toolResult).substring(0, 100)}...`);

            toolCalls.push({
              toolId: toolCall.id,
              toolName,
              arguments: toolArgs,
              startTime: toolStart,
              endTime: toolEnd,
              result: toolResult,
              latencyMs: toolEnd - toolStart,
            });

            conversationHistory.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            });
          } catch (error: any) {
            console.log(`    ❌ Error: ${error.message}`);

            toolCalls.push({
              toolId: toolCall.id,
              toolName,
              arguments: toolArgs,
              startTime: toolStart,
              endTime: Date.now(),
              error: error.message,
              latencyMs: Date.now() - toolStart,
            });
          }
        }

        // Record agent response with tool calls
        tracker.recordAgentResponse(sessionId, turnId, {
          message: message.content || undefined,
          toolCalls,
        });

        // Continue to next turn for LLM to process tool results
        continue;
      }

      // 5. No more tool calls - we have final response
      finalResponse = message.content || '';

      tracker.recordAgentResponse(sessionId, turnId, {
        message: finalResponse,
      });

      conversationHistory.push({
        role: 'assistant',
        content: finalResponse,
      });

      break; // Done
    }

    // 6. Simulate user feedback (in real app, this comes later)
    // For demo, we'll give positive feedback
    const firstTurnId = tracker.getSession(sessionId)?.turns[0]?.turnId;
    if (firstTurnId) {
      tracker.recordUserFeedback(sessionId, firstTurnId, {
        helpful: true,
        comments: 'Quick and helpful response!',
      });
    }

    // 7. Complete session
    tracker.completeSession(sessionId, {
      status: 'success',
      result: finalResponse,
      userSatisfaction: 5,
      feedback: 'Issue resolved successfully',
    });

    console.log(`\n✅ Session completed successfully`);
    console.log(`📊 Final response: "${finalResponse}"\n`);

    return finalResponse;
  } catch (error: any) {
    // Complete session with failure
    tracker.completeSession(sessionId, {
      status: 'failure',
      result: { error: error.message },
      userSatisfaction: 1,
    });

    console.error(`\n❌ Session failed: ${error.message}\n`);
    throw error;
  }
}

/**
 * Helper to calculate LLM cost
 */
function calculateCost(model: string, usage: any): number {
  if (!usage) return 0;

  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 30, output: 60 },
  };

  const modelPricing = pricing[model] || pricing['gpt-4'];
  const inputCost = (usage.prompt_tokens / 1_000_000) * modelPricing.input;
  const outputCost = (usage.completion_tokens / 1_000_000) * modelPricing.output;

  return inputCost + outputCost;
}

/**
 * Run example
 */
async function main() {
  console.log('🧪 Bagula Agent Instrumentation Example\n');
  console.log('This demonstrates how to track complete agent sessions\n');

  // Example 1: Simple refund request
  await customerSupportAgent(
    'I want to request a refund for order #12345. The product arrived damaged.',
    'user-123'
  );

  // Wait a bit, then flush
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Example 2: Information request
  await customerSupportAgent(
    'What is your refund policy?',
    'user-456'
  );

  // Shutdown client (flushes remaining data)
  await bagula.shutdown();

  console.log('\n✨ All sessions sent to Bagula platform!\n');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { customerSupportAgent };
