/**
 * Bagula API Client
 * Axios-based client for communicating with Bagula Platform API
 */

import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'bagula-dev-key-12345';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  },
  timeout: 30000,
});

// Types
export interface AgentSession {
  sessionId: string;
  agentName: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  initialRequest: string;
  finalOutcome?: any;
  metadata?: any;
  tags?: string[];
  createdAt: string;
  turns?: Turn[];
}

export interface Turn {
  turnId: string;
  sessionId: string;
  turnNumber: number;
  timestamp: string;
  trigger: any;
  agentResponse?: any;
  userFeedback?: any;
  llmCalls?: LLMCall[];
  toolCalls?: ToolCall[];
}

export interface LLMCall {
  callId: string;
  sessionId: string;
  turnId: string;
  provider: string;
  model: string;
  startTime: string;
  endTime?: string;
  tokensInput?: number;
  tokensOutput?: number;
  tokensTotal?: number;
  costUsd?: string;
  latencyMs?: number;
  messages?: any;
  response?: any;
}

export interface ToolCall {
  toolId: string;
  sessionId: string;
  turnId: string;
  toolName: string;
  arguments?: any;
  startTime: string;
  endTime?: string;
  result?: any;
  error?: string;
  latencyMs?: number;
}

export interface Opportunity {
  opportunityId: string;
  sessionId: string;
  agentName: string;
  type: 'cost' | 'performance' | 'quality' | 'regression';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description?: string;
  suggestedAction?: string;
  estimatedCostSavingsUsd?: string;
  estimatedLatencyReductionMs?: number;
  detectedAt: string;
  resolved: boolean;
  resolutionNote?: string;
}

export interface Baseline {
  baselineId: string;
  agentName: string;
  sessionId: string;
  createdAt: string;
  metrics?: any;
  tags?: string[];
  active: boolean;
}

// API Methods
export const bagulaApi = {
  // Health
  health: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Sessions
  getSessions: async (agentName: string, limit: number = 50, offset: number = 0) => {
    const response = await apiClient.get<{
      agentName: string;
      sessions: AgentSession[];
      count: number;
      limit: number;
      offset: number;
    }>(`/v1/agents/${agentName}/sessions`, {
      params: { limit, offset },
    });
    return response.data;
  },

  getSession: async (sessionId: string) => {
    const response = await apiClient.get<AgentSession>(`/v1/sessions/${sessionId}`);
    return response.data;
  },

  // Opportunities
  getSessionOpportunities: async (sessionId: string) => {
    const response = await apiClient.get<{
      sessionId: string;
      opportunities: Opportunity[];
      count: number;
    }>(`/v1/sessions/${sessionId}/opportunities`);
    return response.data;
  },

  getAgentOpportunities: async (
    agentName: string,
    options?: {
      hours?: number;
      type?: string;
      severity?: string;
      resolved?: boolean;
    }
  ) => {
    const response = await apiClient.get<{
      agentName: string;
      timeWindowHours: number;
      opportunities: Opportunity[];
      summary: {
        total: number;
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
        potentialSavings: {
          costUsd: number;
          latencyMs: number;
        };
      };
    }>(`/v1/agents/${agentName}/opportunities`, {
      params: options,
    });
    return response.data;
  },

  resolveOpportunity: async (opportunityId: string, resolutionNote?: string) => {
    const response = await apiClient.patch(`/v1/opportunities/${opportunityId}/resolve`, {
      resolutionNote,
    });
    return response.data;
  },

  // Baselines
  saveBaseline: async (agentName: string, sessionId: string, tags?: string[]) => {
    const response = await apiClient.post('/v1/baselines', {
      agentName,
      sessionId,
      tags,
    });
    return response.data;
  },

  getBaseline: async (agentName: string) => {
    const response = await apiClient.get<{
      baseline: Baseline;
      session: AgentSession;
    }>(`/v1/baselines/${agentName}`);
    return response.data;
  },

  getBaselineHistory: async (agentName: string) => {
    const response = await apiClient.get<{
      agentName: string;
      baselines: Baseline[];
      count: number;
    }>(`/v1/baselines/${agentName}/history`);
    return response.data;
  },
};

export default bagulaApi;
