#!/usr/bin/env node

/**
 * Bagula CLI
 * Command-line interface for AI agent regression testing
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { runCommand } from './commands/run';
import { initCommand } from './commands/init';
import { baselineCommand } from './commands/baseline';
import { reportCommand } from './commands/report';

const program = new Command();

program
  .name('bagula')
  .description('AI Agent Regression Testing Platform')
  .version('0.1.0');

// Run tests command
program
  .command('run [suite]')
  .description('Run test suite')
  .option('-c, --config <path>', 'Path to config file', 'bagula.config.json')
  .option('-b, --baseline', 'Compare with baseline')
  .option('-s, --save-baseline', 'Save results as baseline')
  .option('--parallel', 'Run tests in parallel')
  .option('--commit <hash>', 'Git commit hash')
  .option('--branch <name>', 'Git branch name')
  .option('--watch', 'Watch mode - rerun on file changes')
  .action(runCommand);

// Initialize configuration
program
  .command('init')
  .description('Initialize Bagula configuration')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(initCommand);

// Baseline management
const baseline = program
  .command('baseline')
  .description('Manage baselines');

baseline
  .command('save <suite>')
  .description('Save current results as baseline')
  .option('-t, --tag <name>', 'Tag for the baseline')
  .action(async (suite, options) => {
    await baselineCommand.save(suite, options);
  });

baseline
  .command('list')
  .description('List all baselines')
  .option('-s, --suite <name>', 'Filter by suite name')
  .action(async (options) => {
    await baselineCommand.list(options);
  });

baseline
  .command('compare <suite>')
  .description('Compare current results with baseline')
  .option('-t, --tag <name>', 'Baseline tag to compare')
  .action(async (suite, options) => {
    await baselineCommand.compare(suite, options);
  });

// Report generation
program
  .command('report [suite]')
  .description('Generate test report')
  .option('-f, --format <type>', 'Report format (json, html, markdown)', 'json')
  .option('-o, --output <path>', 'Output file path')
  .action(reportCommand);

// CI mode
program
  .command('ci')
  .description('Run in CI mode with strict checks')
  .option('-c, --config <path>', 'Path to config file', 'bagula.config.json')
  .option('--fail-on-regression', 'Fail if regressions detected', true)
  .option('--budget-strict', 'Fail on any budget violations', true)
  .action(async (options) => {
    console.log(chalk.blue('🔄 Running in CI mode...\n'));
    await runCommand(undefined, {
      ...options,
      baseline: true,
      parallel: true,
    });
  });

// Watch mode
program
  .command('watch [suite]')
  .description('Watch mode - rerun tests on file changes')
  .option('-c, --config <path>', 'Path to config file', 'bagula.config.json')
  .action(async (suite, options) => {
    await runCommand(suite, { ...options, watch: true });
  });

// Error handling
program.exitOverride();

try {
  program.parse(process.argv);
} catch (error: any) {
  if (error.code === 'commander.help' || error.code === 'commander.version') {
    process.exit(0);
  }
  console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
  process.exit(1);
}

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
