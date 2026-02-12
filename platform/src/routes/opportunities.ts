/**
 * Opportunity Routes - Detected improvements
 */

import { FastifyPluginAsync } from 'fastify';
import { db } from '../db/client.js';
import { opportunities } from '../db/schema.js';
import { eq, and, desc, gte } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const opportunityRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /v1/sessions/:sessionId/opportunities - Get opportunities for session
  fastify.get<{ Params: { sessionId: string } }>('/sessions/:sessionId/opportunities', async (request, reply) => {
    try {
      const { sessionId } = request.params;

      const sessionOpportunities = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.sessionId, sessionId))
        .orderBy(desc(opportunities.detectedAt));

      return {
        sessionId,
        opportunities: sessionOpportunities,
        count: sessionOpportunities.length,
      };
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500).send({ error: error.message });
    }
  });

  // GET /v1/agents/:agentName/opportunities - Get opportunities for agent
  fastify.get<{
    Params: { agentName: string };
    Querystring: { hours?: string; type?: string; severity?: string; resolved?: string };
  }>('/agents/:agentName/opportunities', async (request, reply) => {
    try {
      const { agentName } = request.params;
      const hours = parseInt(request.query.hours || '24', 10);
      const type = request.query.type;
      const severity = request.query.severity;
      const resolved = request.query.resolved === 'true';

      // Build query conditions
      const conditions = [
        eq(opportunities.agentName, agentName),
        gte(opportunities.detectedAt, sql`NOW() - INTERVAL '${sql.raw(hours.toString())} hours'`),
      ];

      if (type) {
        conditions.push(eq(opportunities.type, type));
      }

      if (severity) {
        conditions.push(eq(opportunities.severity, severity));
      }

      if (resolved !== undefined) {
        conditions.push(eq(opportunities.resolved, resolved));
      }

      const agentOpportunities = await db
        .select()
        .from(opportunities)
        .where(and(...conditions))
        .orderBy(desc(opportunities.detectedAt));

      // Calculate summary stats
      const summary = {
        total: agentOpportunities.length,
        byType: {
          cost: agentOpportunities.filter((o) => o.type === 'cost').length,
          performance: agentOpportunities.filter((o) => o.type === 'performance').length,
          quality: agentOpportunities.filter((o) => o.type === 'quality').length,
          regression: agentOpportunities.filter((o) => o.type === 'regression').length,
        },
        bySeverity: {
          high: agentOpportunities.filter((o) => o.severity === 'high').length,
          medium: agentOpportunities.filter((o) => o.severity === 'medium').length,
          low: agentOpportunities.filter((o) => o.severity === 'low').length,
        },
        potentialSavings: {
          costUsd: agentOpportunities.reduce(
            (sum, o) => sum + (parseFloat(o.estimatedCostSavingsUsd || '0') || 0),
            0
          ),
          latencyMs: agentOpportunities.reduce(
            (sum, o) => sum + (o.estimatedLatencyReductionMs || 0),
            0
          ),
        },
      };

      return {
        agentName,
        timeWindowHours: hours,
        opportunities: agentOpportunities,
        summary,
      };
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500).send({ error: error.message });
    }
  });

  // PATCH /v1/opportunities/:opportunityId/resolve - Mark opportunity as resolved
  fastify.patch<{
    Params: { opportunityId: string };
    Body: { resolutionNote?: string };
  }>('/opportunities/:opportunityId/resolve', async (request, reply) => {
    try {
      const { opportunityId } = request.params;
      const { resolutionNote } = request.body;

      await db
        .update(opportunities)
        .set({
          resolved: true,
          resolutionNote,
        })
        .where(eq(opportunities.opportunityId, opportunityId));

      return {
        success: true,
        message: 'Opportunity marked as resolved',
      };
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500).send({ error: error.message });
    }
  });
};
