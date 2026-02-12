/**
 * Quality Opportunity Detection Worker
 * Identifies opportunities to improve reliability and success rates
 */

import { Job } from 'bullmq';
import { db } from '../db/client.js';
import { toolCalls, llmCalls, opportunities, agentSessions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { SessionAnalysisJob, createSessionAnalysisWorker } from '../queue/manager.js';
import { appConfig } from '../config.js';

async function processQualityAnalysis(job: Job<SessionAnalysisJob>): Promise<void> {
  const { sessionId } = job.data;

  console.log(`[Quality Worker] Analyzing session: ${sessionId}`);

  try {
    // Fetch session
    const [session] = await db.select().from(agentSessions).where(eq(agentSessions.sessionId, sessionId));
    if (!session) {
      console.error(`[Quality Worker] Session not found: ${sessionId}`);
      return;
    }

    const [sessionToolCalls, sessionLLMCalls] = await Promise.all([
      db.select().from(toolCalls).where(eq(toolCalls.sessionId, sessionId)),
      db.select().from(llmCalls).where(eq(llmCalls.sessionId, sessionId)),
    ]);

    const detectedOpportunities: Array<{
      type: 'quality';
      severity: 'low' | 'medium' | 'high';
      title: string;
      description: string;
      suggestedAction: string;
    }> = [];

    // 1. Detect high tool failure rate (>20%)
    if (sessionToolCalls.length >= appConfig.opportunities.quality.minCallsForAnalysis) {
      const failedTools = sessionToolCalls.filter((tc) => tc.error !== null);
      const failureRate = failedTools.length / sessionToolCalls.length;

      if (failureRate > appConfig.opportunities.quality.toolFailureThreshold) {
        detectedOpportunities.push({
          type: 'quality',
          severity: failureRate > 0.5 ? 'high' : failureRate > 0.3 ? 'medium' : 'low',
          title: `High tool failure rate (${(failureRate * 100).toFixed(0)}%)`,
          description: `${failedTools.length} out of ${sessionToolCalls.length} tool calls failed (${(failureRate * 100).toFixed(0)}% failure rate). Failed tools: ${Array.from(new Set(failedTools.map((t) => t.toolName))).join(', ')}`,
          suggestedAction: `Investigate tool failures. Add better error handling, input validation, and retry logic with exponential backoff.`,
        });
      }
    }

    // 2. Detect error patterns in specific tools
    const toolCallsByName = sessionToolCalls.reduce((acc, call) => {
      if (!acc[call.toolName]) acc[call.toolName] = [];
      acc[call.toolName].push(call);
      return acc;
    }, {} as Record<string, typeof sessionToolCalls>);

    for (const [toolName, calls] of Object.entries(toolCallsByName)) {
      const failures = calls.filter((c) => c.error !== null);
      const failureRate = failures.length / calls.length;

      if (failures.length >= 2 && failureRate > 0.3) {
        detectedOpportunities.push({
          type: 'quality',
          severity: failureRate > 0.7 ? 'high' : 'medium',
          title: `Tool '${toolName}' has high failure rate`,
          description: `Tool '${toolName}' failed ${failures.length}/${calls.length} times (${(failureRate * 100).toFixed(0)}%). Errors: ${failures.slice(0, 3).map((f) => f.error).join('; ')}`,
          suggestedAction: `Fix the '${toolName}' implementation. Common issues: missing error handling, incorrect input validation, external service failures, timeout issues.`,
        });
      }
    }

    // 3. Detect retry loops (same tool called multiple times)
    for (const [toolName, calls] of Object.entries(toolCallsByName)) {
      if (calls.length >= 3) {
        // Check if these are retry attempts (similar timing, failures leading to retries)
        const sortedCalls = [...calls].sort((a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );

        let consecutiveAttempts = 1;
        for (let i = 1; i < sortedCalls.length; i++) {
          const timeDiff = new Date(sortedCalls[i].startTime).getTime() -
                          new Date(sortedCalls[i - 1].endTime || sortedCalls[i - 1].startTime).getTime();

          // If calls are within 5 seconds of each other, likely retries
          if (timeDiff < 5000) {
            consecutiveAttempts++;
          }
        }

        if (consecutiveAttempts >= 3) {
          detectedOpportunities.push({
            type: 'quality',
            severity: consecutiveAttempts > 5 ? 'high' : 'medium',
            title: `Retry loop detected for '${toolName}' (${consecutiveAttempts} attempts)`,
            description: `Tool '${toolName}' was called ${consecutiveAttempts} times in quick succession, indicating retry behavior or agent confusion`,
            suggestedAction: `Implement exponential backoff for retries, add circuit breaker pattern, or improve agent decision-making to avoid unnecessary retries.`,
          });
        }
      }
    }

    // 4. Detect incomplete sessions (no final outcome or failed status)
    if (!session.finalOutcome || (session.finalOutcome as any)?.status === 'failed') {
      detectedOpportunities.push({
        type: 'quality',
        severity: 'high',
        title: 'Incomplete or failed session',
        description: session.finalOutcome
          ? `Session ended with failed status: ${JSON.stringify(session.finalOutcome)}`
          : 'Session completed without a final outcome recorded',
        suggestedAction: `Investigate why the session failed or was abandoned. Ensure proper error handling and graceful degradation.`,
      });
    }

    // 5. Detect LLM errors or unusual stop reasons
    for (const call of sessionLLMCalls) {
      const response = call.response as any;
      if (response?.stop_reason && !['end_turn', 'stop_sequence', 'max_tokens'].includes(response.stop_reason)) {
        detectedOpportunities.push({
          type: 'quality',
          severity: 'medium',
          title: `Unusual LLM stop reason: ${response.stop_reason}`,
          description: `LLM call to ${call.provider}/${call.model} stopped with reason '${response.stop_reason}' instead of normal completion`,
          suggestedAction: `Investigate unusual stop reason. May indicate content filtering, API issues, or malformed requests.`,
        });
      }
    }

    // 6. Detect missing error handling (tools with no result and no error)
    const toolsWithNoResult = sessionToolCalls.filter((tc) => !tc.result && !tc.error);
    if (toolsWithNoResult.length > 0) {
      detectedOpportunities.push({
        type: 'quality',
        severity: 'medium',
        title: `Tools with no result or error (${toolsWithNoResult.length} calls)`,
        description: `${toolsWithNoResult.length} tool calls completed without returning a result or error. Tools: ${Array.from(new Set(toolsWithNoResult.map((t) => t.toolName))).join(', ')}`,
        suggestedAction: `Ensure all tool calls return a result or throw an error. Add proper error handling and logging.`,
      });
    }

    // Insert opportunities into database
    for (const opp of detectedOpportunities) {
      await db.insert(opportunities).values({
        sessionId,
        agentName: session.agentName,
        ...opp,
      });
    }

    console.log(`[Quality Worker] Found ${detectedOpportunities.length} quality opportunities for session ${sessionId}`);
  } catch (error) {
    console.error(`[Quality Worker] Error analyzing session ${sessionId}:`, error);
    throw error;
  }
}

// Create and start worker
const worker = createSessionAnalysisWorker('quality-worker', async (job) => {
  if (job.data.analysisType === 'quality') {
    await processQualityAnalysis(job);
  }
});

worker.on('completed', (job) => {
  console.log(`[Quality Worker] Completed job ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`[Quality Worker] Failed job ${job?.id}:`, err);
});

console.log('[Quality Worker] Started');
