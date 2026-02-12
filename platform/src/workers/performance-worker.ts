/**
 * Performance Opportunity Detection Worker
 * Identifies opportunities to improve latency and response times
 */

import { Job } from 'bullmq';
import { db } from '../db/client.js';
import { llmCalls, toolCalls, opportunities, agentSessions, turns } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { SessionAnalysisJob, createSessionAnalysisWorker } from '../queue/manager.js';
import { appConfig } from '../config.js';

async function processPerformanceAnalysis(job: Job<SessionAnalysisJob>): Promise<void> {
  const { sessionId } = job.data;

  console.log(`[Performance Worker] Analyzing session: ${sessionId}`);

  try {
    // Fetch session and turns
    const [session] = await db.select().from(agentSessions).where(eq(agentSessions.sessionId, sessionId));
    if (!session) {
      console.error(`[Performance Worker] Session not found: ${sessionId}`);
      return;
    }

    const [sessionTurns, sessionLLMCalls, sessionToolCalls] = await Promise.all([
      db.select().from(turns).where(eq(turns.sessionId, sessionId)),
      db.select().from(llmCalls).where(eq(llmCalls.sessionId, sessionId)),
      db.select().from(toolCalls).where(eq(toolCalls.sessionId, sessionId)),
    ]);

    const detectedOpportunities: Array<{
      type: 'performance';
      severity: 'low' | 'medium' | 'high';
      title: string;
      description: string;
      suggestedAction: string;
      estimatedLatencyReductionMs?: number;
    }> = [];

    // 1. Detect slow tool executions (>5s)
    for (const tool of sessionToolCalls) {
      const latency = tool.latencyMs || 0;
      if (latency > appConfig.opportunities.performance.slowToolThresholdMs) {
        detectedOpportunities.push({
          type: 'performance',
          severity: latency > 10000 ? 'high' : latency > 7000 ? 'medium' : 'low',
          title: `Slow tool execution detected (${(latency / 1000).toFixed(1)}s)`,
          description: `Tool '${tool.toolName}' took ${(latency / 1000).toFixed(1)} seconds to execute, which is above the ${appConfig.opportunities.performance.slowToolThresholdMs / 1000}s threshold`,
          suggestedAction: `Investigate why '${tool.toolName}' is slow. Consider: (1) Adding caching, (2) Optimizing database queries, (3) Using async/parallel execution, (4) Adding timeout handling`,
          estimatedLatencyReductionMs: Math.floor(latency * 0.5), // Estimate 50% improvement
        });
      }
    }

    // 2. Detect LLM timeout risks (>25s, approaching 30s timeout)
    for (const call of sessionLLMCalls) {
      const latency = call.latencyMs || 0;
      if (latency > appConfig.opportunities.performance.timeoutWarningMs) {
        detectedOpportunities.push({
          type: 'performance',
          severity: 'high',
          title: `LLM call near timeout (${(latency / 1000).toFixed(1)}s)`,
          description: `LLM call to ${call.provider}/${call.model} took ${(latency / 1000).toFixed(1)}s, approaching typical 30s timeout limits`,
          suggestedAction: `Reduce prompt size, use streaming responses, or implement request timeout handling. Consider splitting into smaller requests.`,
          estimatedLatencyReductionMs: Math.floor(latency * 0.4),
        });
      }
    }

    // 3. Detect excessive turns (>10 for simple requests)
    const turnCount = sessionTurns.length;
    if (turnCount > appConfig.opportunities.performance.excessiveTurns) {
      const totalDuration = session.endTime && session.startTime
        ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
        : 0;

      detectedOpportunities.push({
        type: 'performance',
        severity: turnCount > 15 ? 'high' : 'medium',
        title: `Excessive conversation turns (${turnCount} turns)`,
        description: `Session required ${turnCount} turns to complete, which may indicate inefficient agent design or unclear instructions`,
        suggestedAction: `Review agent prompts for clarity. Consider: (1) More specific system instructions, (2) Better tool descriptions, (3) Few-shot examples in prompts`,
        estimatedLatencyReductionMs: Math.floor(totalDuration * 0.3), // Estimate 30% reduction
      });
    }

    // 4. Detect sequential operations that could be parallelized
    // Check if multiple tool calls happened in sequence that could run in parallel
    for (const turn of sessionTurns) {
      const turnToolCalls = sessionToolCalls.filter((tc) => tc.turnId === turn.turnId);

      if (turnToolCalls.length > 1) {
        // Check if tools ran sequentially (end time of one close to start time of next)
        let sequential = true;
        for (let i = 1; i < turnToolCalls.length; i++) {
          const prev = turnToolCalls[i - 1];
          const curr = turnToolCalls[i];
          const gap = curr.startTime && prev.endTime
            ? new Date(curr.startTime).getTime() - new Date(prev.endTime).getTime()
            : 0;

          // If gap is small (<100ms), they ran sequentially
          if (gap < 100) {
            sequential = true;
            break;
          }
        }

        if (sequential) {
          const totalLatency = turnToolCalls.reduce((sum, tc) => sum + (tc.latencyMs || 0), 0);
          const maxLatency = Math.max(...turnToolCalls.map((tc) => tc.latencyMs || 0));
          const potentialSavings = totalLatency - maxLatency;

          if (potentialSavings > 1000) {
            // Only flag if we can save >1s
            detectedOpportunities.push({
              type: 'performance',
              severity: potentialSavings > 3000 ? 'high' : 'medium',
              title: `Sequential tool calls could be parallelized`,
              description: `Turn ${turn.turnNumber} executed ${turnToolCalls.length} tools sequentially (${(totalLatency / 1000).toFixed(1)}s total). Running in parallel could reduce to ${(maxLatency / 1000).toFixed(1)}s.`,
              suggestedAction: `If tools don't depend on each other, execute them in parallel using Promise.all() or similar`,
              estimatedLatencyReductionMs: potentialSavings,
            });
          }
        }
      }
    }

    // 5. Overall session latency analysis
    if (session.startTime && session.endTime) {
      const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
      const avgTurnDuration = duration / turnCount;

      // Flag if average turn takes >10s
      if (avgTurnDuration > 10000) {
        detectedOpportunities.push({
          type: 'performance',
          severity: 'medium',
          title: `Long average turn duration (${(avgTurnDuration / 1000).toFixed(1)}s/turn)`,
          description: `Session averaged ${(avgTurnDuration / 1000).toFixed(1)}s per turn over ${turnCount} turns, totaling ${(duration / 1000).toFixed(1)}s`,
          suggestedAction: `Overall performance optimization needed. Review all suggestions above and prioritize based on impact.`,
          estimatedLatencyReductionMs: Math.floor(duration * 0.2), // Estimate 20% improvement
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

    console.log(`[Performance Worker] Found ${detectedOpportunities.length} performance opportunities for session ${sessionId}`);
  } catch (error) {
    console.error(`[Performance Worker] Error analyzing session ${sessionId}:`, error);
    throw error;
  }
}

// Create and start worker
const worker = createSessionAnalysisWorker('performance-worker', async (job) => {
  if (job.data.analysisType === 'performance') {
    await processPerformanceAnalysis(job);
  }
});

worker.on('completed', (job) => {
  console.log(`[Performance Worker] Completed job ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`[Performance Worker] Failed job ${job?.id}:`, err);
});

console.log('[Performance Worker] Started');
