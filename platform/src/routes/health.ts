/**
 * Health Check Routes
 */

import { FastifyPluginAsync } from 'fastify';
import { getQueueMetrics } from '../queue/manager.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    const queueMetrics = await getQueueMetrics();

    return {
      status: 'healthy',
      service: 'bagula-platform',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      queue: queueMetrics,
    };
  });

  // Metrics endpoint (for Prometheus, etc.)
  fastify.get('/metrics', async (request, reply) => {
    const queueMetrics = await getQueueMetrics();

    return {
      queue_waiting: queueMetrics.waiting,
      queue_active: queueMetrics.active,
      queue_completed: queueMetrics.completed,
      queue_failed: queueMetrics.failed,
    };
  });
};
