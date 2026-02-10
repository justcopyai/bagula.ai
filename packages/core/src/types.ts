/**
 * Bagula Core Types
 * Types and interfaces for AI agent regression testing
 */

export interface AgentConfig {
  name: string;
  model: string;
  provider: 'openai' | 'anthropic' | 'custom';
  baseUrl?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
  systemPrompt?: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler?: (params: any) => Promise<any>;
}

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  input: string | Message[];
  context?: Record<string, any>;
  expectedBehavior?: ExpectedBehavior;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ExpectedBehavior {
  outputContains?: string[];
  outputNotContains?: string[];
  toolsUsed?: string[];
  toolsNotUsed?: string[];
  maxLatencyMs?: number;
  maxCostUsd?: number;
  minConfidence?: number;
  customValidation?: (result: TestResult) => Promise<ValidationResult>;
}

export interface ValidationResult {
  passed: boolean;
  message?: string;
  details?: Record<string, any>;
}

export interface TestResult {
  testId: string;
  timestamp: Date;
  agentConfig: AgentConfig;
  input: string | Message[];
  output: string;
  messages: Message[];
  toolCalls: ToolCall[];
  metrics: TestMetrics;
  validation: ValidationResult;
  baseline?: BaselineComparison;
}

export interface TestMetrics {
  latencyMs: number;
  tokensInput: number;
  tokensOutput: number;
  tokensTotal: number;
  costUsd: number;
  confidence?: number;
  modelCalls: number;
}

export interface Baseline {
  id: string;
  testId: string;
  timestamp: Date;
  commit?: string;
  branch?: string;
  agentConfig: AgentConfig;
  output: string;
  metrics: TestMetrics;
  tags?: string[];
}

export interface BaselineComparison {
  baseline: Baseline;
  current: TestResult;
  differences: BaselineDifference[];
  similarity: number;
  metricsComparison: MetricsComparison;
}

export interface BaselineDifference {
  type: 'output' | 'tools' | 'metrics' | 'behavior';
  severity: 'critical' | 'major' | 'minor' | 'info';
  message: string;
  details?: Record<string, any>;
}

export interface MetricsComparison {
  latencyChange: number;
  latencyChangePercent: number;
  costChange: number;
  costChangePercent: number;
  tokenChange: number;
  tokenChangePercent: number;
  confidenceChange?: number;
}

export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  tests: TestCase[];
  config: AgentConfig;
  budgets?: TestBudgets;
}

export interface TestBudgets {
  maxLatencyMs?: number;
  maxCostPerTestUsd?: number;
  maxTotalCostUsd?: number;
  maxTokensPerTest?: number;
}

export interface TestRun {
  id: string;
  suiteId: string;
  timestamp: Date;
  commit?: string;
  branch?: string;
  results: TestResult[];
  summary: TestSummary;
  budgetViolations: BudgetViolation[];
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  totalLatencyMs: number;
  totalCostUsd: number;
  totalTokens: number;
  averageLatencyMs: number;
  averageCostUsd: number;
  averageConfidence?: number;
}

export interface BudgetViolation {
  testId: string;
  type: 'latency' | 'cost' | 'tokens';
  limit: number;
  actual: number;
  message: string;
}

export interface ConfidenceCalibration {
  buckets: ConfidenceBucket[];
  overallAccuracy: number;
  expectedCalibrationError: number;
}

export interface ConfidenceBucket {
  minConfidence: number;
  maxConfidence: number;
  averageConfidence: number;
  accuracy: number;
  count: number;
}

export interface MultiAgentTest {
  id: string;
  name: string;
  agents: AgentConfig[];
  workflow: WorkflowStep[];
  expectedOutcome?: ExpectedBehavior;
}

export interface WorkflowStep {
  agentIndex: number;
  input: string | ((previousOutputs: string[]) => string);
  dependencies?: number[];
}

export interface SkillMetrics {
  skillName: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageLatencyMs: number;
  averageCostUsd: number;
  accuracyRate: number;
}

export interface ContextMetrics {
  totalContextSize: number;
  contextUtilization: number;
  lostInMiddleRisk: number;
  criticalInstructionsPosition: Map<string, number>;
}
