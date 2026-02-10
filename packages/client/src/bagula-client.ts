/**
 * Bagula Client - Main client for async data ingestion
 */

import axios, { AxiosInstance } from 'axios';
import { AgentSession, SessionTracker } from './session-tracker';

export interface BagulaClientConfig {
  apiKey: string;
  endpoint?: string;
  batchSize?: number;
  flushInterval?: number;
  debug?: boolean;
}

export class BagulaClient {
  private config: Required<BagulaClientConfig>;
  private httpClient: AxiosInstance;
  private sessionTracker: SessionTracker;
  private sessionQueue: AgentSession[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: BagulaClientConfig) {
    this.config = {
      endpoint: config.endpoint || 'https://api.bagula.ai',
      batchSize: config.batchSize || 50,
      flushInterval: config.flushInterval || 10000, // 10 seconds
      debug: config.debug || false,
      apiKey: config.apiKey,
    };

    this.httpClient = axios.create({
      baseURL: this.config.endpoint,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    // Session tracker with completion callback
    this.sessionTracker = new SessionTracker((session) => {
      this.onSessionComplete(session);
    });

    // Start periodic flush
    this.startFlushTimer();

    // Flush on exit
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => this.flush());
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
    }
  }

  /**
   * Get session tracker for manual session management
   */
  getSessionTracker(): SessionTracker {
    return this.sessionTracker;
  }

  /**
   * Called when a session completes
   */
  private onSessionComplete(session: AgentSession): void {
    if (this.config.debug) {
      console.log(`[Bagula] Session completed: ${session.sessionId}`, {
        turns: session.metrics.totalTurns,
        cost: `$${session.metrics.totalCost.toFixed(4)}`,
        latency: `${session.metrics.totalLatency}ms`,
        outcome: session.finalOutcome?.status,
      });
    }

    // Add to queue
    this.sessionQueue.push(session);

    // Flush if batch size reached
    if (this.sessionQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush sessions to Bagula platform
   */
  async flush(): Promise<void> {
    if (this.sessionQueue.length === 0) {
      return;
    }

    const batch = this.sessionQueue.splice(0, this.config.batchSize);

    if (this.config.debug) {
      console.log(`[Bagula] Flushing ${batch.length} sessions`);
    }

    try {
      const response = await this.httpClient.post('/v1/sessions/ingest', {
        sessions: batch,
        timestamp: Date.now(),
      });

      if (this.config.debug) {
        console.log(`[Bagula] Successfully sent ${batch.length} sessions`);
      }
    } catch (error: any) {
      console.error('[Bagula] Failed to send sessions:', error.message);

      // Put back in queue for retry
      this.sessionQueue.unshift(...batch);

      // Prevent memory issues
      if (this.sessionQueue.length > 1000) {
        console.warn('[Bagula] Queue overflow, dropping oldest sessions');
        this.sessionQueue.splice(0, this.sessionQueue.length - 1000);
      }
    }
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushInterval);

    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }

  /**
   * Shutdown client gracefully
   */
  async shutdown(): Promise<void> {
    if (this.config.debug) {
      console.log('[Bagula] Shutting down...');
    }

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    await this.flush();

    if (this.config.debug) {
      console.log('[Bagula] Shutdown complete');
    }
  }

  /**
   * Health check
   */
  async ping(): Promise<boolean> {
    try {
      await this.httpClient.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}
