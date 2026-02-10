/**
 * Bagula Session Tracker
 * Tracks complete agent sessions with multiple turns, tool calls, and user feedback
 */

import { v4 as uuidv4 } from 'uuid';

export interface AgentSession {
  sessionId: string;
  agentName: string;
  userId?: string;
  startTime: number;
  endTime?: number;

  // The work requested
  initialRequest: string;
  finalOutcome?: {
    status: 'success' | 'failure' | 'abandoned';
    result?: any;
    userSatisfaction?: number; // 1-5
    feedback?: string;
  };

  // All interactions in this session
  turns: Turn[];

  // Session-level metrics
  metrics: SessionMetrics;

  // Metadata
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface Turn {
  turnId: string;
  turnNumber: number;
  timestamp: number;

  // What triggered this turn
  trigger: {
    type: 'user_message' | 'tool_response' | 'agent_followup';
    content: any;
  };

  // Agent's response
  agentResponse?: {
    message?: string;
    toolCalls?: ToolCall[];
    internalThoughts?: string; // For debugging
  };

  // LLM calls in this turn
  llmCalls: LLMCall[];

  // User feedback on this turn
  userFeedback?: {
    helpful: boolean;
    comments?: string;
    corrections?: string;
  };
}

export interface ToolCall {
  toolId: string;
  toolName: string;
  arguments: Record<string, any>;
  startTime: number;
  endTime?: number;
  result?: any;
  error?: string;
  latencyMs?: number;
}

export interface LLMCall {
  callId: string;
  provider: string;
  model: string;
  startTime: number;
  endTime?: number;

  messages: Message[];
  response?: {
    content: string;
    toolCalls?: any[];
    finishReason?: string;
  };

  metrics: {
    tokensInput: number;
    tokensOutput: number;
    tokensTotal: number;
    costUsd: number;
    latencyMs: number;
  };
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  timestamp: number;
}

export interface SessionMetrics {
  totalTurns: number;
  totalLLMCalls: number;
  totalToolCalls: number;

  totalTokens: number;
  totalCost: number;
  totalLatency: number;

  averageLatencyPerTurn: number;
  averageCostPerTurn: number;

  timeToFirstResponse?: number;
  timeToResolution?: number;
}

/**
 * Session Tracker - manages active agent sessions
 */
export class SessionTracker {
  private activeSessions: Map<string, AgentSession> = new Map();
  private onSessionComplete?: (session: AgentSession) => void;

  constructor(onSessionComplete?: (session: AgentSession) => void) {
    this.onSessionComplete = onSessionComplete;
  }

  /**
   * Start a new agent session
   */
  startSession(
    agentName: string,
    initialRequest: string,
    options?: {
      userId?: string;
      metadata?: Record<string, any>;
      tags?: string[];
    }
  ): string {
    const sessionId = uuidv4();

    const session: AgentSession = {
      sessionId,
      agentName,
      userId: options?.userId,
      startTime: Date.now(),
      initialRequest,
      turns: [],
      metrics: {
        totalTurns: 0,
        totalLLMCalls: 0,
        totalToolCalls: 0,
        totalTokens: 0,
        totalCost: 0,
        totalLatency: 0,
        averageLatencyPerTurn: 0,
        averageCostPerTurn: 0,
      },
      metadata: options?.metadata,
      tags: options?.tags,
    };

    this.activeSessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * Start a new turn in the session
   */
  startTurn(
    sessionId: string,
    trigger: Turn['trigger']
  ): string {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const turnId = uuidv4();
    const turn: Turn = {
      turnId,
      turnNumber: session.turns.length + 1,
      timestamp: Date.now(),
      trigger,
      llmCalls: [],
    };

    session.turns.push(turn);
    session.metrics.totalTurns++;

    return turnId;
  }

  /**
   * Record an LLM call within a turn
   */
  recordLLMCall(
    sessionId: string,
    turnId: string,
    llmCall: LLMCall
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const turn = session.turns.find(t => t.turnId === turnId);
    if (!turn) return;

    turn.llmCalls.push(llmCall);

    // Update metrics
    session.metrics.totalLLMCalls++;
    session.metrics.totalTokens += llmCall.metrics.tokensTotal;
    session.metrics.totalCost += llmCall.metrics.costUsd;
    session.metrics.totalLatency += llmCall.metrics.latencyMs;

    this.recalculateAverages(session);
  }

  /**
   * Record agent response for a turn
   */
  recordAgentResponse(
    sessionId: string,
    turnId: string,
    response: Turn['agentResponse']
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const turn = session.turns.find(t => t.turnId === turnId);
    if (!turn) return;

    turn.agentResponse = response;

    // Track tool calls
    if (response?.toolCalls) {
      session.metrics.totalToolCalls += response.toolCalls.length;
    }
  }

  /**
   * Record user feedback on a turn
   */
  recordUserFeedback(
    sessionId: string,
    turnId: string,
    feedback: Turn['userFeedback']
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const turn = session.turns.find(t => t.turnId === turnId);
    if (!turn) return;

    turn.userFeedback = feedback;
  }

  /**
   * Complete a session
   */
  completeSession(
    sessionId: string,
    outcome: AgentSession['finalOutcome']
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.endTime = Date.now();
    session.finalOutcome = outcome;

    // Calculate final metrics
    session.metrics.timeToFirstResponse =
      session.turns.length > 0
        ? session.turns[0].timestamp - session.startTime
        : undefined;

    session.metrics.timeToResolution =
      session.endTime - session.startTime;

    // Call completion callback
    if (this.onSessionComplete) {
      this.onSessionComplete(session);
    }

    // Remove from active sessions
    this.activeSessions.delete(sessionId);
  }

  /**
   * Get active session
   */
  getSession(sessionId: string): AgentSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Recalculate average metrics
   */
  private recalculateAverages(session: AgentSession): void {
    if (session.metrics.totalTurns > 0) {
      session.metrics.averageLatencyPerTurn =
        session.metrics.totalLatency / session.metrics.totalTurns;

      session.metrics.averageCostPerTurn =
        session.metrics.totalCost / session.metrics.totalTurns;
    }
  }
}

/**
 * Helper to track tool execution
 */
export async function trackToolCall<T>(
  toolName: string,
  args: Record<string, any>,
  executor: () => Promise<T>
): Promise<ToolCall & { result: T }> {
  const toolCall: ToolCall = {
    toolId: uuidv4(),
    toolName,
    arguments: args,
    startTime: Date.now(),
  };

  try {
    const result = await executor();
    toolCall.endTime = Date.now();
    toolCall.latencyMs = toolCall.endTime - toolCall.startTime;
    toolCall.result = result;

    return { ...toolCall, result };
  } catch (error: any) {
    toolCall.endTime = Date.now();
    toolCall.latencyMs = toolCall.endTime - toolCall.startTime;
    toolCall.error = error.message;
    throw error;
  }
}

/**
 * Helper to track LLM call
 */
export async function trackLLMCall<T>(
  provider: string,
  model: string,
  messages: Message[],
  executor: () => Promise<any>
): Promise<LLMCall> {
  const llmCall: LLMCall = {
    callId: uuidv4(),
    provider,
    model,
    startTime: Date.now(),
    messages,
    metrics: {
      tokensInput: 0,
      tokensOutput: 0,
      tokensTotal: 0,
      costUsd: 0,
      latencyMs: 0,
    },
  };

  try {
    const response = await executor();
    llmCall.endTime = Date.now();
    llmCall.response = {
      content: response.content || response.choices?.[0]?.message?.content,
      toolCalls: response.tool_calls || response.choices?.[0]?.message?.tool_calls,
      finishReason: response.finish_reason || response.choices?.[0]?.finish_reason,
    };

    // Extract metrics
    const usage = response.usage;
    llmCall.metrics = {
      tokensInput: usage?.prompt_tokens || 0,
      tokensOutput: usage?.completion_tokens || 0,
      tokensTotal: usage?.total_tokens || 0,
      costUsd: calculateCost(model, usage),
      latencyMs: llmCall.endTime - llmCall.startTime,
    };

    return llmCall;
  } catch (error: any) {
    llmCall.endTime = Date.now();
    llmCall.metrics.latencyMs = llmCall.endTime - llmCall.startTime;
    throw error;
  }
}

/**
 * Calculate cost based on model and usage
 */
function calculateCost(model: string, usage: any): number {
  if (!usage) return 0;

  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 30, output: 60 },
    'gpt-4o': { input: 2.5, output: 10 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    'claude-3-opus': { input: 15, output: 75 },
    'claude-3-sonnet': { input: 3, output: 15 },
    'claude-3-haiku': { input: 0.25, output: 1.25 },
  };

  const modelPricing = pricing[model] || pricing['gpt-4'];

  const inputCost = (usage.prompt_tokens / 1_000_000) * modelPricing.input;
  const outputCost = (usage.completion_tokens / 1_000_000) * modelPricing.output;

  return inputCost + outputCost;
}
