/**
 * Bagula Client SDK
 * Instrument your AI agents to send telemetry to Bagula platform
 */

import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface BagulaConfig {
  apiKey: string;
  endpoint?: string;
  batchSize?: number;
  flushInterval?: number;
  debug?: boolean;
}

export interface AgentTrace {
  traceId: string;
  agentName: string;
  startTime: number;
  endTime?: number;
  input: string | any;
  output?: string | any;
  model?: string;
  provider?: string;
  spans: Span[];
  metadata?: Record<string, any>;
}

export interface Span {
  spanId: string;
  type: 'llm_call' | 'tool_call' | 'retrieval' | 'custom';
  name: string;
  startTime: number;
  endTime?: number;
  input?: any;
  output?: any;
  metrics?: SpanMetrics;
  metadata?: Record<string, any>;
}

export interface SpanMetrics {
  tokensInput?: number;
  tokensOutput?: number;
  tokensTotal?: number;
  costUsd?: number;
  latencyMs?: number;
  model?: string;
  confidence?: number;
}

/**
 * Opportunity detected by Bagula platform
 * Represents a detected improvement opportunity for cost, performance, quality, or regression
 */
export interface Opportunity {
  opportunityId: string;
  sessionId: string;
  agentName: string;
  type: 'cost' | 'performance' | 'quality' | 'regression';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description?: string;
  suggestedAction?: string;
  estimatedImpact?: {
    costSavingsUsd?: number;
    latencyReductionMs?: number;
    qualityImprovement?: number;
  };
  detectedAt: string;
  resolved: boolean;
  resolutionNote?: string;
}

export class BagulaClient {
  private config: Required<BagulaConfig>;
  private httpClient: AxiosInstance;
  private eventQueue: any[] = [];
  private flushTimer?: NodeJS.Timeout;
  private activeTraces: Map<string, AgentTrace> = new Map();

  constructor(config: BagulaConfig) {
    this.config = {
      endpoint: config.endpoint || 'https://api.bagula.ai',
      batchSize: config.batchSize || 100,
      flushInterval: config.flushInterval || 5000,
      debug: config.debug || false,
      apiKey: config.apiKey,
    };

    this.httpClient = axios.create({
      baseURL: this.config.endpoint,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Start flush timer
    this.startFlushTimer();

    // Flush on process exit
    process.on('beforeExit', () => this.flush());
  }

  /**
   * Start tracing an agent execution
   */
  startTrace(agentName: string, input: any, metadata?: Record<string, any>): string {
    const traceId = uuidv4();
    const trace: AgentTrace = {
      traceId,
      agentName,
      startTime: Date.now(),
      input,
      spans: [],
      metadata,
    };

    this.activeTraces.set(traceId, trace);

    if (this.config.debug) {
      console.log(`[Bagula] Started trace: ${traceId}`);
    }

    return traceId;
  }

  /**
   * End a trace
   */
  endTrace(traceId: string, output: any): void {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      console.error(`[Bagula] Trace not found: ${traceId}`);
      return;
    }

    trace.endTime = Date.now();
    trace.output = output;

    // Add to queue for async sending
    this.enqueue({
      type: 'trace',
      data: trace,
      timestamp: Date.now(),
    });

    this.activeTraces.delete(traceId);

    if (this.config.debug) {
      console.log(`[Bagula] Ended trace: ${traceId}`, {
        duration: trace.endTime - trace.startTime,
        spans: trace.spans.length,
      });
    }
  }

  /**
   * Add a span to a trace (e.g., LLM call, tool usage)
   */
  addSpan(traceId: string, span: Omit<Span, 'spanId'>): string {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      console.error(`[Bagula] Trace not found: ${traceId}`);
      return '';
    }

    const spanId = uuidv4();
    const fullSpan: Span = {
      spanId,
      ...span,
    };

    trace.spans.push(fullSpan);

    if (this.config.debug) {
      console.log(`[Bagula] Added span: ${span.type} - ${span.name}`);
    }

    return spanId;
  }

  /**
   * Convenience wrapper for tracing agent execution
   */
  async traceAgent<T>(
    agentName: string,
    input: any,
    executor: (traceId: string) => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const traceId = this.startTrace(agentName, input, metadata);

    try {
      const output = await executor(traceId);
      this.endTrace(traceId, output);
      return output;
    } catch (error: any) {
      this.endTrace(traceId, { error: error.message });
      throw error;
    }
  }

  /**
   * Track an LLM call
   */
  async traceLLMCall<T>(
    traceId: string,
    model: string,
    provider: string,
    messages: any[],
    executor: () => Promise<T>
  ): Promise<T> {
    const spanId = this.addSpan(traceId, {
      type: 'llm_call',
      name: `${provider}:${model}`,
      startTime: Date.now(),
      input: messages,
      metadata: { model, provider },
    });

    const startTime = Date.now();

    try {
      const response: any = await executor();
      const endTime = Date.now();

      // Update span with response
      const trace = this.activeTraces.get(traceId);
      if (trace) {
        const span = trace.spans.find((s) => s.spanId === spanId);
        if (span) {
          span.endTime = endTime;
          span.output = response;
          span.metrics = {
            tokensInput: response.usage?.prompt_tokens,
            tokensOutput: response.usage?.completion_tokens,
            tokensTotal: response.usage?.total_tokens,
            latencyMs: endTime - startTime,
            model,
          };
        }
      }

      return response;
    } catch (error) {
      const trace = this.activeTraces.get(traceId);
      if (trace) {
        const span = trace.spans.find((s) => s.spanId === spanId);
        if (span) {
          span.endTime = Date.now();
          span.metadata = { ...span.metadata, error: String(error) };
        }
      }
      throw error;
    }
  }

  /**
   * Track a tool call
   */
  async traceToolCall<T>(
    traceId: string,
    toolName: string,
    args: any,
    executor: () => Promise<T>
  ): Promise<T> {
    const spanId = this.addSpan(traceId, {
      type: 'tool_call',
      name: toolName,
      startTime: Date.now(),
      input: args,
    });

    const startTime = Date.now();

    try {
      const result = await executor();
      const endTime = Date.now();

      const trace = this.activeTraces.get(traceId);
      if (trace) {
        const span = trace.spans.find((s) => s.spanId === spanId);
        if (span) {
          span.endTime = endTime;
          span.output = result;
          span.metrics = {
            latencyMs: endTime - startTime,
          };
        }
      }

      return result;
    } catch (error) {
      const trace = this.activeTraces.get(traceId);
      if (trace) {
        const span = trace.spans.find((s) => s.spanId === spanId);
        if (span) {
          span.endTime = Date.now();
          span.metadata = { ...span.metadata, error: String(error) };
        }
      }
      throw error;
    }
  }

  /**
   * Manually send a metric
   */
  trackMetric(
    agentName: string,
    metricName: string,
    value: number,
    tags?: Record<string, string>
  ): void {
    this.enqueue({
      type: 'metric',
      data: {
        agentName,
        metricName,
        value,
        tags,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Add event to queue
   */
  private enqueue(event: any): void {
    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush events to Bagula platform
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const batch = this.eventQueue.splice(0, this.config.batchSize);

    if (this.config.debug) {
      console.log(`[Bagula] Flushing ${batch.length} events`);
    }

    try {
      await this.httpClient.post('/v1/ingest', {
        events: batch,
        timestamp: Date.now(),
      });

      if (this.config.debug) {
        console.log(`[Bagula] Successfully sent ${batch.length} events`);
      }
    } catch (error: any) {
      console.error('[Bagula] Failed to send events:', error.message);

      // Put events back in queue for retry
      this.eventQueue.unshift(...batch);

      // Limit queue size to prevent memory issues
      if (this.eventQueue.length > 10000) {
        console.warn('[Bagula] Queue size exceeded, dropping oldest events');
        this.eventQueue.splice(0, this.eventQueue.length - 10000);
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

    // Don't keep process alive
    this.flushTimer.unref();
  }

  /**
   * Shutdown client
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    await this.flush();

    if (this.config.debug) {
      console.log('[Bagula] Client shutdown');
    }
  }
}

/**
 * Decorator for automatically tracing agent functions
 */
export function traced(agentName: string, client: BagulaClient) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return client.traceAgent(
        agentName,
        args[0],
        async () => originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}
