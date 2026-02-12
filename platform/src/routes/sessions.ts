/**
 * Session Routes - Ingestion and retrieval
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { agentSessions, turns, llmCalls, toolCalls } from '../db/schema.js';
import { enqueueSessionAnalysis } from '../queue/manager.js';
import { eq, desc } from 'drizzle-orm';

// Validation schemas
const TurnSchema = z.object({
  turnId: z.string().uuid(),
  turnNumber: z.number().int(),
  timestamp: z.number(),
  trigger: z.record(z.any()),
  agentResponse: z.record(z.any()).optional(),
  llmCalls: z.array(z.object({
    callId: z.string().uuid(),
    provider: z.string(),
    model: z.string(),
    startTime: z.number(),
    endTime: z.number().optional(),
    tokensInput: z.number().optional(),
    tokensOutput: z.number().optional(),
    tokensTotal: z.number().optional(),
    costUsd: z.number().optional(),
    latencyMs: z.number().optional(),
    messages: z.any(),
    response: z.any(),
  })),
  toolCalls: z.array(z.object({
    toolId: z.string().uuid(),
    toolName: z.string(),
    arguments: z.any(),
    startTime: z.number(),
    endTime: z.number().optional(),
    result: z.any().optional(),
    error: z.string().optional(),
    latencyMs: z.number().optional(),
  })).optional(),
  userFeedback: z.record(z.any()).optional(),
});

const AgentSessionSchema = z.object({
  sessionId: z.string().uuid(),
  agentName: z.string(),
  userId: z.string().optional(),
  startTime: z.number(),
  endTime: z.number().optional(),
  initialRequest: z.string(),
  finalOutcome: z.record(z.any()).optional(),
  turns: z.array(TurnSchema),
  metrics: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

const IngestRequestSchema = z.object({
  sessions: z.array(AgentSessionSchema),
  timestamp: z.number(),
});

export const sessionRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /v1/sessions/ingest - Ingest agent sessions
  fastify.post('/sessions/ingest', async (request, reply) => {
    const apiKey = (request as any).apiKey;

    try {
      const body = IngestRequestSchema.parse(request.body);
      const sessions = body.sessions;

      // Store sessions in database (in transaction)
      for (const session of sessions) {
        await db.transaction(async (tx) => {
          // Insert session
          await tx.insert(agentSessions).values({
            sessionId: session.sessionId,
            agentName: session.agentName,
            userId: session.userId,
            apiKeyId: apiKey, // TODO: Look up actual API key ID
            startTime: new Date(session.startTime),
            endTime: session.endTime ? new Date(session.endTime) : null,
            initialRequest: session.initialRequest,
            finalOutcome: session.finalOutcome,
            metadata: session.metadata,
            tags: session.tags,
          });

          // Insert turns
          for (const turn of session.turns) {
            await tx.insert(turns).values({
              turnId: turn.turnId,
              sessionId: session.sessionId,
              turnNumber: turn.turnNumber,
              timestamp: new Date(turn.timestamp),
              trigger: turn.trigger,
              agentResponse: turn.agentResponse,
              userFeedback: turn.userFeedback,
            });

            // Insert LLM calls
            for (const llmCall of turn.llmCalls) {
              await tx.insert(llmCalls).values({
                callId: llmCall.callId,
                sessionId: session.sessionId,
                turnId: turn.turnId,
                provider: llmCall.provider,
                model: llmCall.model,
                startTime: new Date(llmCall.startTime),
                endTime: llmCall.endTime ? new Date(llmCall.endTime) : null,
                tokensInput: llmCall.tokensInput,
                tokensOutput: llmCall.tokensOutput,
                tokensTotal: llmCall.tokensTotal,
                costUsd: llmCall.costUsd?.toString(),
                latencyMs: llmCall.latencyMs,
                messages: llmCall.messages,
                response: llmCall.response,
              });
            }

            // Insert tool calls
            if (turn.toolCalls) {
              for (const toolCall of turn.toolCalls) {
                await tx.insert(toolCalls).values({
                  toolId: toolCall.toolId,
                  sessionId: session.sessionId,
                  turnId: turn.turnId,
                  toolName: toolCall.toolName,
                  arguments: toolCall.arguments,
                  startTime: new Date(toolCall.startTime),
                  endTime: toolCall.endTime ? new Date(toolCall.endTime) : null,
                  result: toolCall.result,
                  error: toolCall.error,
                  latencyMs: toolCall.latencyMs,
                });
              }
            }
          }
        });

        // Queue for analysis
        await enqueueSessionAnalysis(session.sessionId, 'cost');
        await enqueueSessionAnalysis(session.sessionId, 'performance');
        await enqueueSessionAnalysis(session.sessionId, 'quality');
        await enqueueSessionAnalysis(session.sessionId, 'regression');
      }

      return {
        success: true,
        sessionsReceived: sessions.length,
        message: `Successfully received ${sessions.length} session(s)`,
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // GET /v1/sessions/:sessionId - Get specific session
  fastify.get<{ Params: { sessionId: string } }>('/sessions/:sessionId', async (request, reply) => {
    try {
      const { sessionId } = request.params;

      // Fetch session with all related data
      const [session] = await db.select().from(agentSessions).where(eq(agentSessions.sessionId, sessionId));

      if (!session) {
        reply.code(404).send({ error: 'Session not found' });
        return;
      }

      // Fetch turns
      const sessionTurns = await db.select().from(turns).where(eq(turns.sessionId, sessionId));

      // Fetch LLM calls and tool calls for each turn
      const turnsWithDetails = await Promise.all(
        sessionTurns.map(async (turn) => {
          const [turnLLMCalls, turnToolCalls] = await Promise.all([
            db.select().from(llmCalls).where(eq(llmCalls.turnId, turn.turnId)),
            db.select().from(toolCalls).where(eq(toolCalls.turnId, turn.turnId)),
          ]);

          return {
            ...turn,
            llmCalls: turnLLMCalls,
            toolCalls: turnToolCalls,
          };
        })
      );

      return {
        ...session,
        turns: turnsWithDetails,
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // GET /v1/agents/:agentName/sessions - List sessions for agent
  fastify.get<{
    Params: { agentName: string };
    Querystring: { limit?: string; offset?: string };
  }>('/agents/:agentName/sessions', async (request, reply) => {
    try {
      const { agentName } = request.params;
      const limit = parseInt(request.query.limit || '50', 10);
      const offset = parseInt(request.query.offset || '0', 10);

      const sessionsList = await db
        .select()
        .from(agentSessions)
        .where(eq(agentSessions.agentName, agentName))
        .orderBy(desc(agentSessions.startTime))
        .limit(limit)
        .offset(offset);

      return {
        agentName,
        sessions: sessionsList,
        count: sessionsList.length,
        limit,
        offset,
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });
};
