/**
 * Bagula Metrics Collector
 * Collects and calculates cost, latency, and performance metrics
 */

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ModelPricing {
  inputCostPer1M: number;
  outputCostPer1M: number;
}

/**
 * Model pricing (as of early 2025)
 * Prices are in USD per 1 million tokens
 */
const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4-turbo': { inputCostPer1M: 10.0, outputCostPer1M: 30.0 },
  'gpt-4': { inputCostPer1M: 30.0, outputCostPer1M: 60.0 },
  'gpt-4-32k': { inputCostPer1M: 60.0, outputCostPer1M: 120.0 },
  'gpt-3.5-turbo': { inputCostPer1M: 0.5, outputCostPer1M: 1.5 },
  'gpt-4o': { inputCostPer1M: 2.5, outputCostPer1M: 10.0 },
  'gpt-4o-mini': { inputCostPer1M: 0.15, outputCostPer1M: 0.6 },

  // Anthropic
  'claude-3-opus': { inputCostPer1M: 15.0, outputCostPer1M: 75.0 },
  'claude-3-sonnet': { inputCostPer1M: 3.0, outputCostPer1M: 15.0 },
  'claude-3-haiku': { inputCostPer1M: 0.25, outputCostPer1M: 1.25 },
  'claude-3-5-sonnet': { inputCostPer1M: 3.0, outputCostPer1M: 15.0 },

  // Generic fallback
  default: { inputCostPer1M: 1.0, outputCostPer1M: 3.0 },
};

export class MetricsCollector {
  private customPricing: Map<string, ModelPricing> = new Map();

  /**
   * Set custom pricing for a model
   */
  setModelPricing(model: string, pricing: ModelPricing): void {
    this.customPricing.set(model, pricing);
  }

  /**
   * Calculate cost for token usage
   */
  calculateCost(model: string, usage: TokenUsage): number {
    const pricing = this.getModelPricing(model);

    const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputCostPer1M;
    const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputCostPer1M;

    return inputCost + outputCost;
  }

  /**
   * Get pricing for a model
   */
  private getModelPricing(model: string): ModelPricing {
    // Check custom pricing first
    if (this.customPricing.has(model)) {
      return this.customPricing.get(model)!;
    }

    // Normalize model name (handle version numbers and variants)
    const normalizedModel = model.toLowerCase().replace(/-\d{8}$/, '');

    // Check standard pricing
    for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
      if (normalizedModel.includes(key.toLowerCase())) {
        return pricing;
      }
    }

    // Fallback to default
    console.warn(`Unknown model pricing for ${model}, using default`);
    return MODEL_PRICING.default;
  }

  /**
   * Calculate percentile from array of values
   */
  calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Calculate statistical summary of metrics
   */
  calculateStatistics(values: number[]): {
    min: number;
    max: number;
    mean: number;
    median: number;
    p95: number;
    p99: number;
    stdDev: number;
  } {
    if (values.length === 0) {
      return {
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        p95: 0,
        p99: 0,
        stdDev: 0,
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    const variance =
      values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: this.calculatePercentile(values, 95),
      p99: this.calculatePercentile(values, 99),
      stdDev,
    };
  }

  /**
   * Aggregate metrics across multiple test results
   */
  aggregateMetrics(results: Array<{
    latencyMs: number;
    costUsd: number;
    tokensTotal: number;
  }>): {
    latency: ReturnType<typeof this.calculateStatistics>;
    cost: ReturnType<typeof this.calculateStatistics>;
    tokens: ReturnType<typeof this.calculateStatistics>;
  } {
    const latencies = results.map((r) => r.latencyMs);
    const costs = results.map((r) => r.costUsd);
    const tokens = results.map((r) => r.tokensTotal);

    return {
      latency: this.calculateStatistics(latencies),
      cost: this.calculateStatistics(costs),
      tokens: this.calculateStatistics(tokens),
    };
  }

  /**
   * Check if metrics exceed thresholds
   */
  checkThresholds(
    actual: { latencyMs: number; costUsd: number; tokensTotal: number },
    thresholds: {
      maxLatencyMs?: number;
      maxCostUsd?: number;
      maxTokens?: number;
    }
  ): {
    violated: boolean;
    violations: Array<{ type: string; actual: number; threshold: number }>;
  } {
    const violations: Array<{ type: string; actual: number; threshold: number }> =
      [];

    if (
      thresholds.maxLatencyMs !== undefined &&
      actual.latencyMs > thresholds.maxLatencyMs
    ) {
      violations.push({
        type: 'latency',
        actual: actual.latencyMs,
        threshold: thresholds.maxLatencyMs,
      });
    }

    if (
      thresholds.maxCostUsd !== undefined &&
      actual.costUsd > thresholds.maxCostUsd
    ) {
      violations.push({
        type: 'cost',
        actual: actual.costUsd,
        threshold: thresholds.maxCostUsd,
      });
    }

    if (
      thresholds.maxTokens !== undefined &&
      actual.tokensTotal > thresholds.maxTokens
    ) {
      violations.push({
        type: 'tokens',
        actual: actual.tokensTotal,
        threshold: thresholds.maxTokens,
      });
    }

    return {
      violated: violations.length > 0,
      violations,
    };
  }
}
