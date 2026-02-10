/**
 * Run command - Execute test suites
 */

import { readFileSync, existsSync, watchFile } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { TestRunner, TestSuite, TestRun } from '@bagula/core';

interface RunOptions {
  config: string;
  baseline?: boolean;
  saveBaseline?: boolean;
  parallel?: boolean;
  commit?: string;
  branch?: string;
  watch?: boolean;
}

export async function runCommand(
  suiteName?: string,
  options: RunOptions = { config: 'bagula.config.json' }
): Promise<void> {
  const configPath = resolve(process.cwd(), options.config);

  if (!existsSync(configPath)) {
    console.error(
      chalk.red(`\n❌ Config file not found: ${configPath}`)
    );
    console.log(chalk.yellow('\n💡 Run `bagula init` to create a configuration file\n'));
    process.exit(1);
  }

  // Watch mode
  if (options.watch) {
    console.log(chalk.blue('👀 Starting watch mode...\n'));
    await runTests(configPath, suiteName, options);

    watchFile(configPath, { interval: 1000 }, async () => {
      console.log(chalk.blue('\n🔄 Config changed, rerunning tests...\n'));
      await runTests(configPath, suiteName, options);
    });

    // Keep process alive
    await new Promise(() => {});
    return;
  }

  await runTests(configPath, suiteName, options);
}

async function runTests(
  configPath: string,
  suiteName: string | undefined,
  options: RunOptions
): Promise<void> {
  try {
    // Load configuration
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));

    // Get test suites
    let suites: TestSuite[] = config.suites || [];

    if (suiteName) {
      suites = suites.filter((s: TestSuite) => s.name === suiteName);
      if (suites.length === 0) {
        console.error(chalk.red(`\n❌ Suite not found: ${suiteName}\n`));
        process.exit(1);
      }
    }

    if (suites.length === 0) {
      console.error(chalk.red('\n❌ No test suites defined in configuration\n'));
      process.exit(1);
    }

    console.log(chalk.blue.bold('🧪 Bagula - AI Agent Testing\n'));
    console.log(chalk.gray(`Running ${suites.length} suite(s)...\n`));

    const runner = new TestRunner();
    const results: TestRun[] = [];

    // Run each suite
    for (const suite of suites) {
      const spinner = ora(`Running suite: ${suite.name}`).start();

      try {
        const result = await runner.runSuite(suite, {
          compareBaseline: options.baseline,
          saveBaseline: options.saveBaseline,
          parallel: options.parallel,
          commit: options.commit,
          branch: options.branch,
        });

        results.push(result);
        spinner.succeed(
          `${suite.name}: ${result.summary.passed}/${result.summary.total} passed`
        );
      } catch (error: any) {
        spinner.fail(`${suite.name}: ${error.message}`);
        throw error;
      }
    }

    // Display summary
    console.log(chalk.blue.bold('\n📊 Summary\n'));
    displaySummary(results);

    // Check for failures
    const totalFailed = results.reduce((sum, r) => sum + r.summary.failed, 0);
    const hasRegressions = results.some((r) => r.results.some((tr) => tr.baseline));
    const hasBudgetViolations = results.some((r) => r.budgetViolations.length > 0);

    if (totalFailed > 0) {
      console.log(chalk.red(`\n❌ ${totalFailed} test(s) failed\n`));
      process.exit(1);
    }

    if (hasBudgetViolations) {
      console.log(chalk.yellow('\n⚠️  Budget violations detected\n'));
      displayBudgetViolations(results);
    }

    if (hasRegressions) {
      console.log(chalk.yellow('\n⚠️  Regressions detected\n'));
      displayRegressions(results);
    }

    console.log(chalk.green('\n✅ All tests passed\n'));
  } catch (error: any) {
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    process.exit(1);
  }
}

function displaySummary(results: TestRun[]): void {
  const data = [
    ['Suite', 'Tests', 'Passed', 'Failed', 'Latency', 'Cost', 'Tokens'],
  ];

  for (const result of results) {
    const suite = result.suiteId;
    const summary = result.summary;

    data.push([
      suite,
      summary.total.toString(),
      chalk.green(summary.passed.toString()),
      summary.failed > 0 ? chalk.red(summary.failed.toString()) : '0',
      `${summary.averageLatencyMs.toFixed(0)}ms`,
      `$${summary.totalCostUsd.toFixed(4)}`,
      summary.totalTokens.toString(),
    ]);
  }

  console.log(table(data));
}

function displayBudgetViolations(results: TestRun[]): void {
  for (const result of results) {
    if (result.budgetViolations.length === 0) continue;

    console.log(chalk.yellow(`\n${result.suiteId}:`));

    const data = [['Test', 'Type', 'Limit', 'Actual']];

    for (const violation of result.budgetViolations) {
      data.push([
        violation.testId,
        violation.type,
        violation.limit.toString(),
        chalk.red(violation.actual.toString()),
      ]);
    }

    console.log(table(data));
  }
}

function displayRegressions(results: TestRun[]): void {
  for (const result of results) {
    const regressions = result.results.filter(
      (r) => r.baseline && r.baseline.differences.length > 0
    );

    if (regressions.length === 0) continue;

    console.log(chalk.yellow(`\n${result.suiteId}:`));

    for (const regression of regressions) {
      console.log(chalk.yellow(`\n  ${regression.testId}:`));

      for (const diff of regression.baseline!.differences) {
        const icon = diff.severity === 'critical' ? '🔴' : diff.severity === 'major' ? '🟡' : '🟢';
        console.log(`    ${icon} [${diff.severity}] ${diff.message}`);
      }
    }
  }
}
