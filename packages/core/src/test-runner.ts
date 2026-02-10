/**
 * Bagula Test Runner
 * Core test execution engine for AI agents
 */

import { v4 as uuidv4 } from 'uuid';
import {
  AgentConfig,
  TestCase,
  TestResult,
  TestSuite,
  TestRun,
  TestMetrics,
  TestSummary,
  BudgetViolation,
  ValidationResult,
} from './types';
import { BaselineManager } from './baseline-manager';
import { MetricsCollector } from './metrics-collector';
import { AgentExecutor } from './agent-executor';

export class TestRunner {
  private baselineManager: BaselineManager;
  private metricsCollector: MetricsCollector;
  private agentExecutor: AgentExecutor;

  constructor(
    baselineManager?: BaselineManager,
    metricsCollector?: MetricsCollector,
    agentExecutor?: AgentExecutor
  ) {
    this.baselineManager = baselineManager || new BaselineManager();
    this.metricsCollector = metricsCollector || new MetricsCollector();
    this.agentExecutor = agentExecutor || new AgentExecutor();
  }

  /**
   * Run a single test case
   */
  async runTest(
    testCase: TestCase,
    agentConfig: AgentConfig,
    options?: { compareBaseline?: boolean; saveBaseline?: boolean }
  ): Promise<TestResult> {
    const startTime = Date.now();

    // Execute the agent
    const execution = await this.agentExecutor.execute(
      testCase.input,
      agentConfig,
      testCase.context
    );

    const endTime = Date.now();
    const latencyMs = endTime - startTime;

    // Collect metrics
    const metrics: TestMetrics = {
      latencyMs,
      tokensInput: execution.usage.inputTokens,
      tokensOutput: execution.usage.outputTokens,
      tokensTotal: execution.usage.totalTokens,
      costUsd: this.metricsCollector.calculateCost(
        agentConfig.model,
        execution.usage
      ),
      confidence: execution.confidence,
      modelCalls: execution.modelCalls,
    };

    // Validate against expected behavior
    const validation = await this.validateResult(testCase, execution, metrics);

    // Create test result
    const result: TestResult = {
      testId: testCase.id,
      timestamp: new Date(),
      agentConfig,
      input: testCase.input,
      output: execution.output,
      messages: execution.messages,
      toolCalls: execution.toolCalls,
      metrics,
      validation,
    };

    // Compare with baseline if requested
    if (options?.compareBaseline) {
      const baseline = await this.baselineManager.getBaseline(testCase.id);
      if (baseline) {
        result.baseline = await this.baselineManager.compare(baseline, result);
      }
    }

    // Save as baseline if requested
    if (options?.saveBaseline) {
      await this.baselineManager.saveBaseline(result);
    }

    return result;
  }

  /**
   * Run a test suite
   */
  async runSuite(
    suite: TestSuite,
    options?: {
      compareBaseline?: boolean;
      saveBaseline?: boolean;
      parallel?: boolean;
      commit?: string;
      branch?: string;
    }
  ): Promise<TestRun> {
    const runId = uuidv4();
    const results: TestResult[] = [];

    // Run tests
    if (options?.parallel) {
      const promises = suite.tests.map((test) =>
        this.runTest(test, suite.config, {
          compareBaseline: options.compareBaseline,
          saveBaseline: options.saveBaseline,
        })
      );
      results.push(...(await Promise.all(promises)));
    } else {
      for (const test of suite.tests) {
        const result = await this.runTest(test, suite.config, {
          compareBaseline: options.compareBaseline,
          saveBaseline: options.saveBaseline,
        });
        results.push(result);
      }
    }

    // Calculate summary
    const summary = this.calculateSummary(results);

    // Check budget violations
    const budgetViolations = suite.budgets
      ? this.checkBudgetViolations(results, suite.budgets)
      : [];

    return {
      id: runId,
      suiteId: suite.id,
      timestamp: new Date(),
      commit: options?.commit,
      branch: options?.branch,
      results,
      summary,
      budgetViolations,
    };
  }

  /**
   * Validate test result against expected behavior
   */
  private async validateResult(
    testCase: TestCase,
    execution: any,
    metrics: TestMetrics
  ): Promise<ValidationResult> {
    if (!testCase.expectedBehavior) {
      return { passed: true, message: 'No validation rules defined' };
    }

    const { expectedBehavior } = testCase;
    const failures: string[] = [];

    // Check output contains
    if (expectedBehavior.outputContains) {
      for (const text of expectedBehavior.outputContains) {
        if (!execution.output.includes(text)) {
          failures.push(`Output should contain: "${text}"`);
        }
      }
    }

    // Check output not contains
    if (expectedBehavior.outputNotContains) {
      for (const text of expectedBehavior.outputNotContains) {
        if (execution.output.includes(text)) {
          failures.push(`Output should not contain: "${text}"`);
        }
      }
    }

    // Check tools used
    if (expectedBehavior.toolsUsed) {
      const toolNames = execution.toolCalls.map((tc: any) => tc.name);
      for (const tool of expectedBehavior.toolsUsed) {
        if (!toolNames.includes(tool)) {
          failures.push(`Should use tool: "${tool}"`);
        }
      }
    }

    // Check tools not used
    if (expectedBehavior.toolsNotUsed) {
      const toolNames = execution.toolCalls.map((tc: any) => tc.name);
      for (const tool of expectedBehavior.toolsNotUsed) {
        if (toolNames.includes(tool)) {
          failures.push(`Should not use tool: "${tool}"`);
        }
      }
    }

    // Check latency
    if (
      expectedBehavior.maxLatencyMs &&
      metrics.latencyMs > expectedBehavior.maxLatencyMs
    ) {
      failures.push(
        `Latency ${metrics.latencyMs}ms exceeds max ${expectedBehavior.maxLatencyMs}ms`
      );
    }

    // Check cost
    if (
      expectedBehavior.maxCostUsd &&
      metrics.costUsd > expectedBehavior.maxCostUsd
    ) {
      failures.push(
        `Cost $${metrics.costUsd} exceeds max $${expectedBehavior.maxCostUsd}`
      );
    }

    // Check confidence
    if (
      expectedBehavior.minConfidence &&
      metrics.confidence !== undefined &&
      metrics.confidence < expectedBehavior.minConfidence
    ) {
      failures.push(
        `Confidence ${metrics.confidence} below min ${expectedBehavior.minConfidence}`
      );
    }

    // Custom validation
    if (expectedBehavior.customValidation) {
      const customResult = await expectedBehavior.customValidation({
        testId: testCase.id,
        timestamp: new Date(),
        agentConfig: {} as any,
        input: testCase.input,
        output: execution.output,
        messages: execution.messages,
        toolCalls: execution.toolCalls,
        metrics,
        validation: { passed: true },
      });

      if (!customResult.passed) {
        failures.push(customResult.message || 'Custom validation failed');
      }
    }

    return {
      passed: failures.length === 0,
      message: failures.length > 0 ? failures.join('; ') : 'All checks passed',
      details: { failures },
    };
  }

  /**
   * Calculate test summary
   */
  private calculateSummary(results: TestResult[]): TestSummary {
    const passed = results.filter((r) => r.validation.passed).length;
    const totalLatency = results.reduce((sum, r) => sum + r.metrics.latencyMs, 0);
    const totalCost = results.reduce((sum, r) => sum + r.metrics.costUsd, 0);
    const totalTokens = results.reduce((sum, r) => sum + r.metrics.tokensTotal, 0);

    const confidenceValues = results
      .map((r) => r.metrics.confidence)
      .filter((c): c is number => c !== undefined);

    return {
      total: results.length,
      passed,
      failed: results.length - passed,
      totalLatencyMs: totalLatency,
      totalCostUsd: totalCost,
      totalTokens,
      averageLatencyMs: totalLatency / results.length,
      averageCostUsd: totalCost / results.length,
      averageConfidence:
        confidenceValues.length > 0
          ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
          : undefined,
    };
  }

  /**
   * Check budget violations
   */
  private checkBudgetViolations(
    results: TestResult[],
    budgets: any
  ): BudgetViolation[] {
    const violations: BudgetViolation[] = [];

    for (const result of results) {
      // Check latency budget
      if (
        budgets.maxLatencyMs &&
        result.metrics.latencyMs > budgets.maxLatencyMs
      ) {
        violations.push({
          testId: result.testId,
          type: 'latency',
          limit: budgets.maxLatencyMs,
          actual: result.metrics.latencyMs,
          message: `Latency ${result.metrics.latencyMs}ms exceeds budget ${budgets.maxLatencyMs}ms`,
        });
      }

      // Check cost budget
      if (
        budgets.maxCostPerTestUsd &&
        result.metrics.costUsd > budgets.maxCostPerTestUsd
      ) {
        violations.push({
          testId: result.testId,
          type: 'cost',
          limit: budgets.maxCostPerTestUsd,
          actual: result.metrics.costUsd,
          message: `Cost $${result.metrics.costUsd} exceeds budget $${budgets.maxCostPerTestUsd}`,
        });
      }

      // Check token budget
      if (
        budgets.maxTokensPerTest &&
        result.metrics.tokensTotal > budgets.maxTokensPerTest
      ) {
        violations.push({
          testId: result.testId,
          type: 'tokens',
          limit: budgets.maxTokensPerTest,
          actual: result.metrics.tokensTotal,
          message: `Tokens ${result.metrics.tokensTotal} exceeds budget ${budgets.maxTokensPerTest}`,
        });
      }
    }

    // Check total cost budget
    if (budgets.maxTotalCostUsd) {
      const totalCost = results.reduce((sum, r) => sum + r.metrics.costUsd, 0);
      if (totalCost > budgets.maxTotalCostUsd) {
        violations.push({
          testId: 'suite',
          type: 'cost',
          limit: budgets.maxTotalCostUsd,
          actual: totalCost,
          message: `Total cost $${totalCost} exceeds budget $${budgets.maxTotalCostUsd}`,
        });
      }
    }

    return violations;
  }
}
