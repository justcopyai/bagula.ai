/**
 * Regression Detection Worker
 * Uses cheap LLM to compare sessions against baselines
 */

import { Job } from 'bullmq';
import { db } from '../db/client.js';
import { opportunities, agentSessions, baselines, turns } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { SessionAnalysisJob, createSessionAnalysisWorker } from '../queue/manager.js';
import { appConfig } from '../config.js';
import OpenAI from 'openai';

// Initialize LLM client (use cheap model for regression detection)
const openai = appConfig.llm.openaiApiKey
  ? new OpenAI({ apiKey: appConfig.llm.openaiApiKey })
  : null;

async function processRegressionAnalysis(job: Job<SessionAnalysisJob>): Promise<void> {
  const { sessionId } = job.data;

  console.log(`[Regression Worker] Analyzing session: ${sessionId}`);

  // Skip if no LLM API key configured
  if (!openai) {
    console.warn('[Regression Worker] No OpenAI API key configured, skipping regression detection');
    return;
  }

  try {
    // Fetch session
    const [session] = await db.select().from(agentSessions).where(eq(agentSessions.sessionId, sessionId));
    if (!session) {
      console.error(`[Regression Worker] Session not found: ${sessionId}`);
      return;
    }

    // Fetch active baseline for this agent
    const [baseline] = await db
      .select()
      .from(baselines)
      .where(and(eq(baselines.agentName, session.agentName), eq(baselines.active, true)));

    if (!baseline) {
      console.log(`[Regression Worker] No baseline found for agent '${session.agentName}', skipping`);
      return;
    }

    // Fetch baseline session
    const [baselineSession] = await db
      .select()
      .from(agentSessions)
      .where(eq(agentSessions.sessionId, baseline.sessionId));

    if (!baselineSession) {
      console.error(`[Regression Worker] Baseline session not found: ${baseline.sessionId}`);
      return;
    }

    // Fetch turns for both sessions
    const [currentTurns, baselineTurns] = await Promise.all([
      db.select().from(turns).where(eq(turns.sessionId, sessionId)),
      db.select().from(turns).where(eq(turns.sessionId, baseline.sessionId)),
    ]);

    // Compare using LLM
    const comparisonResult = await compareSessionsWithLLM(
      {
        initialRequest: session.initialRequest || '',
        turns: currentTurns,
        finalOutcome: session.finalOutcome,
      },
      {
        initialRequest: baselineSession.initialRequest || '',
        turns: baselineTurns,
        finalOutcome: baselineSession.finalOutcome,
      }
    );

    // If regression detected, create opportunity
    if (comparisonResult.regressionDetected) {
      await db.insert(opportunities).values({
        sessionId,
        agentName: session.agentName,
        type: 'regression',
        severity: comparisonResult.severity,
        title: comparisonResult.title,
        description: comparisonResult.description,
        suggestedAction: comparisonResult.suggestedAction,
      });

      console.log(`[Regression Worker] Regression detected for session ${sessionId}`);
    } else {
      console.log(`[Regression Worker] No regression detected for session ${sessionId}`);
    }
  } catch (error) {
    console.error(`[Regression Worker] Error analyzing session ${sessionId}:`, error);
    throw error;
  }
}

interface SessionSummary {
  initialRequest: string;
  turns: any[];
  finalOutcome: any;
}

interface RegressionResult {
  regressionDetected: boolean;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  suggestedAction: string;
}

async function compareSessionsWithLLM(
  currentSession: SessionSummary,
  baselineSession: SessionSummary
): Promise<RegressionResult> {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }

  // Extract key information for comparison
  const currentOutput = extractSessionOutput(currentSession);
  const baselineOutput = extractSessionOutput(baselineSession);

  // Use cheap LLM for comparison
  const prompt = `You are analyzing an AI agent's behavior for regressions.

Compare these two sessions for the SAME user request:

**Baseline Session (Expected Behavior):**
Request: ${baselineSession.initialRequest}
Agent Response: ${baselineOutput.summary}
Outcome: ${JSON.stringify(baselineSession.finalOutcome)}
Turn Count: ${baselineSession.turns.length}

**Current Session (To Analyze):**
Request: ${currentSession.initialRequest}
Agent Response: ${currentOutput.summary}
Outcome: ${JSON.stringify(currentSession.finalOutcome)}
Turn Count: ${currentSession.turns.length}

Analyze if there is a REGRESSION (degradation in quality, accuracy, or behavior) in the current session compared to baseline.

Consider:
1. Does the current session produce a similar quality answer?
2. Is the outcome still successful?
3. Are there significant differences in behavior?
4. Does it take significantly more turns now?

Respond in JSON format:
{
  "regressionDetected": boolean,
  "severity": "low" | "medium" | "high",
  "title": "Brief title of the regression",
  "description": "Detailed description of what changed",
  "suggestedAction": "How to investigate or fix this"
}

ONLY flag as regression if there's a clear degradation. Minor differences are acceptable.`;

  try {
    const completion = await openai.chat.completions.create({
      model: appConfig.opportunities.regression.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing AI agent behavior for regressions. Be precise and only flag clear degradations.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1, // Low temperature for consistent analysis
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      regressionDetected: result.regressionDetected || false,
      severity: result.severity || 'low',
      title: result.title || 'Behavior change detected',
      description: result.description || 'Session behavior differs from baseline',
      suggestedAction: result.suggestedAction || 'Review session details and compare with baseline',
    };
  } catch (error) {
    console.error('[Regression Worker] Error calling LLM for comparison:', error);
    // Don't fail the job, just return no regression detected
    return {
      regressionDetected: false,
      severity: 'low',
      title: '',
      description: '',
      suggestedAction: '',
    };
  }
}

function extractSessionOutput(session: SessionSummary): { summary: string; turnCount: number } {
  // Extract agent responses from turns
  const responses = session.turns
    .filter((t) => t.agentResponse)
    .map((t) => {
      const response = t.agentResponse as any;
      return response?.message || JSON.stringify(response).substring(0, 200);
    });

  return {
    summary: responses.slice(0, 3).join(' | '), // First 3 responses
    turnCount: session.turns.length,
  };
}

// Create and start worker
const worker = createSessionAnalysisWorker('regression-worker', async (job) => {
  if (job.data.analysisType === 'regression') {
    await processRegressionAnalysis(job);
  }
}, 2); // Lower concurrency for LLM calls

worker.on('completed', (job) => {
  console.log(`[Regression Worker] Completed job ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`[Regression Worker] Failed job ${job?.id}:`, err);
});

console.log('[Regression Worker] Started');
