/**
 * Queue Manager - BullMQ for background job processing
 */

import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { appConfig } from '../config.js';

// Redis connection
const connection = new IORedis(appConfig.redis.url, {
  maxRetriesPerRequest: null,
});

// Job types
export interface SessionAnalysisJob {
  sessionId: string;
  analysisType: 'cost' | 'performance' | 'quality' | 'regression';
}

// Queue for session analysis
export const sessionAnalysisQueue = new Queue<SessionAnalysisJob>('session-analysis', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 1000, // Keep last 1000 completed jobs
      age: 24 * 3600, // Remove after 24 hours
    },
    removeOnFail: {
      count: 5000, // Keep last 5000 failed jobs for debugging
    },
  },
});

// Add session to analysis queue
export async function enqueueSessionAnalysis(sessionId: string, analysisType: SessionAnalysisJob['analysisType']) {
  await sessionAnalysisQueue.add(
    `${analysisType}-analysis`,
    { sessionId, analysisType },
    {
      jobId: `${sessionId}-${analysisType}`,
      // Remove duplicate jobs with same ID
      removeOnComplete: true,
    }
  );
}

// Get queue metrics
export async function getQueueMetrics() {
  const [waiting, active, completed, failed] = await Promise.all([
    sessionAnalysisQueue.getWaitingCount(),
    sessionAnalysisQueue.getActiveCount(),
    sessionAnalysisQueue.getCompletedCount(),
    sessionAnalysisQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active,
  };
}

// Close queue connections
export async function closeQueues() {
  await sessionAnalysisQueue.close();
  await connection.quit();
}

// Worker type for processors
export type SessionAnalysisProcessor = (job: Job<SessionAnalysisJob>) => Promise<void>;

// Create worker for session analysis
export function createSessionAnalysisWorker(
  name: string,
  processor: SessionAnalysisProcessor,
  concurrency: number = 4
): Worker<SessionAnalysisJob> {
  return new Worker<SessionAnalysisJob>(
    'session-analysis',
    processor,
    {
      connection: new IORedis(appConfig.redis.url, {
        maxRetriesPerRequest: null,
      }),
      concurrency,
    }
  );
}
