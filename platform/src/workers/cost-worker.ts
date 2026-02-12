/**
 * Cost Opportunity Detection Worker
 * Identifies opportunities to reduce LLM and tool costs
 */

import { Job } from 'bullmq';
import { db } from '../db/client.js';
import { llmCalls, toolCalls, opportunities, agentSessions } from '../db/schema.js';
import { eq, and, gte, sql } from 'drizzle-orm';
import { SessionAnalysisJob, createSessionAnalysisWorker } from '../queue/manager.js';
import { appConfig } from '../config.js';

async function processCostAnalysis(job: Job<SessionAnalysisJob>): Promise<void> {
  const { sessionId } = job.data;

  console.log(`[Cost Worker] Analyzing session: ${sessionId}`);

  try {
    // Fetch session
    const [session] = await db.select().from(agentSessions).where(eq(agentSessions.sessionId, sessionId));
    if (!session) {
      console.error(`[Cost Worker] Session not found: ${sessionId}`);
      return;
    }

    // Fetch all LLM calls and tool calls for this session
    const [sessionLLMCalls, sessionToolCalls] = await Promise.all([
      db.select().from(llmCalls).where(eq(llmCalls.sessionId, sessionId)),
      db.select().from(toolCalls).where(eq(toolCalls.sessionId, sessionId)),
    ]);

    const detectedOpportunities: Array<{
      type: 'cost';
      severity: 'low' | 'medium' | 'high';
      title: string;
      description: string;
      suggestedAction: string;
      estimatedCostSavingsUsd?: string;
    }> = [];

    // 1. Detect expensive tool calls (>$0.10 per call)
    for (const call of sessionLLMCalls) {
      const cost = parseFloat(call.costUsd || '0');
      if (cost > appConfig.opportunities.cost.expensiveThresholdUsd) {
        detectedOpportunities.push({
          type: 'cost',
          severity: cost > 0.50 ? 'high' : cost > 0.20 ? 'medium' : 'low',
          title: `Expensive LLM call detected ($${cost.toFixed(4)})`,
          description: `LLM call to ${call.provider}/${call.model} cost $${cost.toFixed(4)}, which is above the threshold of $${appConfig.opportunities.cost.expensiveThresholdUsd}`,
          suggestedAction: `Consider using a cheaper model for this type of request. For example, GPT-3.5-turbo instead of GPT-4, or Claude Haiku instead of Claude Opus.`,
          estimatedCostSavingsUsd: (cost * 0.8).toFixed(6), // Estimate 80% savings with cheaper model
        });
      }
    }

    // 2. Detect excessive token usage (>5000 tokens)
    for (const call of sessionLLMCalls) {
      const tokens = call.tokensTotal || 0;
      if (tokens > appConfig.opportunities.cost.excessiveTokens) {
        detectedOpportunities.push({
          type: 'cost',
          severity: tokens > 10000 ? 'high' : 'medium',
          title: `Excessive token usage detected (${tokens} tokens)`,
          description: `LLM call used ${tokens} tokens, which is above the threshold of ${appConfig.opportunities.cost.excessiveTokens}. Input: ${call.tokensInput || 0}, Output: ${call.tokensOutput || 0}`,
          suggestedAction: `Review the prompt and context being sent. Consider: (1) Reducing system prompt length, (2) Summarizing conversation history, (3) Removing unnecessary context`,
          estimatedCostSavingsUsd: (parseFloat(call.costUsd || '0') * 0.5).toFixed(6), // Estimate 50% savings
        });
      }
    }

    // 3. Detect redundant LLM calls (same model called multiple times in short window)
    const llmCallsByModel = sessionLLMCalls.reduce((acc, call) => {
      const key = `${call.provider}/${call.model}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(call);
      return acc;
    }, {} as Record<string, typeof sessionLLMCalls>);

    for (const [modelKey, calls] of Object.entries(llmCallsByModel)) {
      if (calls.length > 3) {
        const totalCost = calls.reduce((sum, c) => sum + parseFloat(c.costUsd || '0'), 0);
        detectedOpportunities.push({
          type: 'cost',
          severity: calls.length > 5 ? 'high' : 'medium',
          title: `Multiple calls to same model (${calls.length} calls)`,
          description: `Session made ${calls.length} calls to ${modelKey}, totaling $${totalCost.toFixed(4)}. This may indicate opportunities for batching or caching.`,
          suggestedAction: `Consider: (1) Batching multiple requests together, (2) Caching results for similar inputs, (3) Using a ReAct pattern to reduce back-and-forth`,
          estimatedCostSavingsUsd: (totalCost * 0.3).toFixed(6), // Estimate 30% savings from optimization
        });
      }
    }

    // 4. Model downgrade opportunity (using expensive model for simple tasks)
    const expensiveModels = ['gpt-4', 'gpt-4-turbo', 'claude-3-opus', 'claude-opus'];
    for (const call of sessionLLMCalls) {
      const isExpensiveModel = expensiveModels.some((m) => call.model.includes(m));
      const outputTokens = call.tokensOutput || 0;

      // Simple heuristic: if output is short (<500 tokens), might not need expensive model
      if (isExpensiveModel && outputTokens < 500) {
        const cost = parseFloat(call.costUsd || '0');
        const cheaperCost = cost * 0.1; // Estimate 10x cheaper with GPT-3.5/Haiku

        detectedOpportunities.push({
          type: 'cost',
          severity: 'medium',
          title: `Consider cheaper model for short responses`,
          description: `Used ${call.model} for a ${outputTokens}-token response. This may not require such an expensive model.`,
          suggestedAction: `Try using GPT-3.5-turbo or Claude Haiku for simple/short tasks. Reserve expensive models for complex reasoning.`,
          estimatedCostSavingsUsd: (cost - cheaperCost).toFixed(6),
        });
      }
    }

    // Insert opportunities into database
    for (const opp of detectedOpportunities) {
      await db.insert(opportunities).values({
        sessionId,
        agentName: session.agentName,
        ...opp,
      });
    }

    console.log(`[Cost Worker] Found ${detectedOpportunities.length} cost opportunities for session ${sessionId}`);
  } catch (error) {
    console.error(`[Cost Worker] Error analyzing session ${sessionId}:`, error);
    throw error;
  }
}

// Create and start worker
const worker = createSessionAnalysisWorker('cost-worker', async (job) => {
  if (job.data.analysisType === 'cost') {
    await processCostAnalysis(job);
  }
});

worker.on('completed', (job) => {
  console.log(`[Cost Worker] Completed job ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`[Cost Worker] Failed job ${job?.id}:`, err);
});

console.log('[Cost Worker] Started');
