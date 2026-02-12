/**
 * Baseline Routes - Manage baselines for regression detection
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { baselines, agentSessions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const SaveBaselineSchema = z.object({
  agentName: z.string(),
  sessionId: z.string().uuid(),
  tags: z.array(z.string()).optional(),
});

export const baselineRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /v1/baselines - Save a session as baseline
  fastify.post('/baselines', async (request, reply) => {
    try {
      const body = SaveBaselineSchema.parse(request.body);

      // Verify session exists and belongs to agent
      const [session] = await db
        .select()
        .from(agentSessions)
        .where(
          and(
            eq(agentSessions.sessionId, body.sessionId),
            eq(agentSessions.agentName, body.agentName)
          )
        );

      if (!session) {
        reply.code(404).send({ error: 'Session not found or does not belong to this agent' });
        return;
      }

      // Deactivate previous baseline for this agent
      await db
        .update(baselines)
        .set({ active: false })
        .where(and(eq(baselines.agentName, body.agentName), eq(baselines.active, true)));

      // Create new baseline
      const [baseline] = await db
        .insert(baselines)
        .values({
          agentName: body.agentName,
          sessionId: body.sessionId,
          metrics: session.finalOutcome,
          tags: body.tags,
          active: true,
        })
        .returning();

      return {
        success: true,
        baseline,
        message: `Baseline saved for agent '${body.agentName}'`,
      };
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500).send({ error: error.message });
    }
  });

  // GET /v1/baselines/:agentName - Get active baseline for agent
  fastify.get<{ Params: { agentName: string } }>('/baselines/:agentName', async (request, reply) => {
    try {
      const { agentName } = request.params;

      const [baseline] = await db
        .select()
        .from(baselines)
        .where(and(eq(baselines.agentName, agentName), eq(baselines.active, true)));

      if (!baseline) {
        reply.code(404).send({ error: 'No active baseline found for this agent' });
        return;
      }

      // Fetch the baseline session details
      const [session] = await db
        .select()
        .from(agentSessions)
        .where(eq(agentSessions.sessionId, baseline.sessionId));

      return {
        baseline,
        session,
      };
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500).send({ error: error.message });
    }
  });

  // GET /v1/baselines/:agentName/history - Get baseline history
  fastify.get<{ Params: { agentName: string } }>('/baselines/:agentName/history', async (request, reply) => {
    try {
      const { agentName } = request.params;

      const baselineHistory = await db
        .select()
        .from(baselines)
        .where(eq(baselines.agentName, agentName))
        .orderBy(desc(baselines.createdAt));

      return {
        agentName,
        baselines: baselineHistory,
        count: baselineHistory.length,
      };
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500).send({ error: error.message });
    }
  });
};
