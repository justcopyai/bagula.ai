/**
 * Bagula Platform API - Main Entry Point
 * Fastify server for agent session ingestion and monitoring
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { appConfig } from './config.js';
import { closeDatabase } from './db/client.js';
import { closeQueues } from './queue/manager.js';

// Import routes
import { sessionRoutes } from './routes/sessions.js';
import { opportunityRoutes } from './routes/opportunities.js';
import { baselineRoutes } from './routes/baselines.js';
import { healthRoutes } from './routes/health.js';

const fastify = Fastify({
  logger: {
    level: appConfig.server.logLevel,
  },
});

// Register CORS
await fastify.register(cors, {
  origin: true, // Allow all origins in development, configure for production
  credentials: true,
});

// API Key authentication hook
fastify.addHook('onRequest', async (request, reply) => {
  // Skip auth for health endpoint
  if (request.url.startsWith('/health')) {
    return;
  }

  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const apiKey = authHeader.substring(7);

  // TODO: Validate API key against database
  // For now, accept any non-empty key
  if (!apiKey || apiKey.length < 10) {
    reply.code(401).send({ error: 'Invalid API key' });
    return;
  }

  // Store API key in request for later use
  (request as any).apiKey = apiKey;
});

// Register routes
await fastify.register(healthRoutes);
await fastify.register(sessionRoutes, { prefix: '/v1' });
await fastify.register(opportunityRoutes, { prefix: '/v1' });
await fastify.register(baselineRoutes, { prefix: '/v1' });

// Graceful shutdown
const shutdown = async () => {
  fastify.log.info('Shutting down gracefully...');
  await fastify.close();
  await closeQueues();
  await closeDatabase();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
try {
  await fastify.listen({
    host: appConfig.server.host,
    port: appConfig.server.port,
  });

  fastify.log.info(`🚀 Bagula Platform API running on http://${appConfig.server.host}:${appConfig.server.port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
