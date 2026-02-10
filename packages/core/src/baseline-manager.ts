/**
 * Bagula Baseline Manager
 * Manages baselines for regression detection
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Baseline,
  BaselineComparison,
  BaselineDifference,
  MetricsComparison,
  TestResult,
} from './types';

export interface BaselineStore {
  save(baseline: Baseline): Promise<void>;
  get(testId: string, tag?: string): Promise<Baseline | null>;
  list(filters?: BaselineFilters): Promise<Baseline[]>;
  delete(id: string): Promise<void>;
}

export interface BaselineFilters {
  testIds?: string[];
  tags?: string[];
  branch?: string;
  since?: Date;
  until?: Date;
}

export class BaselineManager {
  private store: BaselineStore;
  private similarityThreshold: number;

  constructor(store?: BaselineStore, similarityThreshold: number = 0.85) {
    this.store = store || new InMemoryBaselineStore();
    this.similarityThreshold = similarityThreshold;
  }

  /**
   * Save a test result as a baseline
   */
  async saveBaseline(
    result: TestResult,
    options?: {
      tags?: string[];
      commit?: string;
      branch?: string;
    }
  ): Promise<Baseline> {
    const baseline: Baseline = {
      id: uuidv4(),
      testId: result.testId,
      timestamp: new Date(),
      commit: options?.commit,
      branch: options?.branch,
      agentConfig: result.agentConfig,
      output: result.output,
      metrics: result.metrics,
      tags: options?.tags,
    };

    await this.store.save(baseline);
    return baseline;
  }

  /**
   * Get baseline for a test
   */
  async getBaseline(testId: string, tag?: string): Promise<Baseline | null> {
    return this.store.get(testId, tag);
  }

  /**
   * Compare current result with baseline
   */
  async compare(
    baseline: Baseline,
    current: TestResult
  ): Promise<BaselineComparison> {
    const differences: BaselineDifference[] = [];

    // Compare outputs
    const similarity = this.calculateSimilarity(baseline.output, current.output);

    if (similarity < this.similarityThreshold) {
      differences.push({
        type: 'output',
        severity: similarity < 0.5 ? 'critical' : similarity < 0.7 ? 'major' : 'minor',
        message: `Output similarity is ${(similarity * 100).toFixed(1)}% (threshold: ${(this.similarityThreshold * 100).toFixed(1)}%)`,
        details: {
          baseline: baseline.output.substring(0, 200),
          current: current.output.substring(0, 200),
          similarity,
        },
      });
    }

    // Compare tool usage
    const baselineTools = this.extractTools(baseline.output);
    const currentTools = current.toolCalls.map((tc) => tc.name);

    const addedTools = currentTools.filter((t) => !baselineTools.includes(t));
    const removedTools = baselineTools.filter((t) => !currentTools.includes(t));

    if (addedTools.length > 0 || removedTools.length > 0) {
      differences.push({
        type: 'tools',
        severity: removedTools.length > 0 ? 'major' : 'minor',
        message: 'Tool usage changed',
        details: {
          added: addedTools,
          removed: removedTools,
        },
      });
    }

    // Compare metrics
    const metricsComparison = this.compareMetrics(baseline.metrics, current.metrics);

    // Check for significant metric changes
    if (Math.abs(metricsComparison.latencyChangePercent) > 50) {
      differences.push({
        type: 'metrics',
        severity: 'major',
        message: `Latency changed by ${metricsComparison.latencyChangePercent.toFixed(1)}%`,
        details: { metricsComparison },
      });
    }

    if (Math.abs(metricsComparison.costChangePercent) > 50) {
      differences.push({
        type: 'metrics',
        severity: 'major',
        message: `Cost changed by ${metricsComparison.costChangePercent.toFixed(1)}%`,
        details: { metricsComparison },
      });
    }

    if (Math.abs(metricsComparison.tokenChangePercent) > 50) {
      differences.push({
        type: 'metrics',
        severity: 'minor',
        message: `Token usage changed by ${metricsComparison.tokenChangePercent.toFixed(1)}%`,
        details: { metricsComparison },
      });
    }

    return {
      baseline,
      current,
      differences,
      similarity,
      metricsComparison,
    };
  }

  /**
   * Calculate similarity between two strings (simple implementation)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity for now
    // In production, consider using more sophisticated algorithms like:
    // - Cosine similarity with embeddings
    // - Levenshtein distance
    // - BLEU score

    const tokens1 = new Set(str1.toLowerCase().split(/\s+/));
    const tokens2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);

    return union.size === 0 ? 1 : intersection.size / union.size;
  }

  /**
   * Extract tool names from output (simple heuristic)
   */
  private extractTools(output: string): string[] {
    // This is a simple implementation
    // In practice, you'd extract from structured data
    const toolPattern = /tool[_\s]?name[:\s]+["']?(\w+)["']?/gi;
    const matches = [...output.matchAll(toolPattern)];
    return matches.map((m) => m[1]);
  }

  /**
   * Compare metrics between baseline and current
   */
  private compareMetrics(
    baseline: any,
    current: any
  ): MetricsComparison {
    const latencyChange = current.latencyMs - baseline.latencyMs;
    const costChange = current.costUsd - baseline.costUsd;
    const tokenChange = current.tokensTotal - baseline.tokensTotal;

    return {
      latencyChange,
      latencyChangePercent:
        baseline.latencyMs === 0 ? 0 : (latencyChange / baseline.latencyMs) * 100,
      costChange,
      costChangePercent:
        baseline.costUsd === 0 ? 0 : (costChange / baseline.costUsd) * 100,
      tokenChange,
      tokenChangePercent:
        baseline.tokensTotal === 0 ? 0 : (tokenChange / baseline.tokensTotal) * 100,
      confidenceChange:
        baseline.confidence !== undefined && current.confidence !== undefined
          ? current.confidence - baseline.confidence
          : undefined,
    };
  }
}

/**
 * In-memory baseline store for development/testing
 */
export class InMemoryBaselineStore implements BaselineStore {
  private baselines: Map<string, Baseline[]> = new Map();

  async save(baseline: Baseline): Promise<void> {
    const existing = this.baselines.get(baseline.testId) || [];
    existing.push(baseline);
    this.baselines.set(baseline.testId, existing);
  }

  async get(testId: string, tag?: string): Promise<Baseline | null> {
    const baselines = this.baselines.get(testId) || [];

    if (tag) {
      const tagged = baselines.filter((b) => b.tags?.includes(tag));
      return tagged.length > 0 ? tagged[tagged.length - 1] : null;
    }

    return baselines.length > 0 ? baselines[baselines.length - 1] : null;
  }

  async list(filters?: BaselineFilters): Promise<Baseline[]> {
    let results: Baseline[] = [];

    for (const [testId, baselines] of this.baselines.entries()) {
      if (filters?.testIds && !filters.testIds.includes(testId)) {
        continue;
      }

      for (const baseline of baselines) {
        if (filters?.tags) {
          const hasTag = filters.tags.some((tag) => baseline.tags?.includes(tag));
          if (!hasTag) continue;
        }

        if (filters?.branch && baseline.branch !== filters.branch) {
          continue;
        }

        if (filters?.since && baseline.timestamp < filters.since) {
          continue;
        }

        if (filters?.until && baseline.timestamp > filters.until) {
          continue;
        }

        results.push(baseline);
      }
    }

    return results;
  }

  async delete(id: string): Promise<void> {
    for (const [testId, baselines] of this.baselines.entries()) {
      const filtered = baselines.filter((b) => b.id !== id);
      if (filtered.length !== baselines.length) {
        this.baselines.set(testId, filtered);
        break;
      }
    }
  }
}
