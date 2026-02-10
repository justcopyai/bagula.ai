/**
 * Init command - Initialize Bagula configuration
 */

import { writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';

interface InitOptions {
  force?: boolean;
}

const defaultConfig = {
  $schema: "https://bagula.ai/schema/config.json",
  suites: [
    {
      id: "example-suite",
      name: "Example Test Suite",
      description: "An example test suite to get you started",
      config: {
        name: "example-agent",
        model: "gpt-4",
        provider: "openai",
        temperature: 0.7,
        systemPrompt: "You are a helpful assistant."
      },
      tests: [
        {
          id: "test-1",
          name: "Basic greeting",
          input: "Hello! How are you?",
          expectedBehavior: {
            outputContains: ["hello", "hi"],
            maxLatencyMs: 5000,
            maxCostUsd: 0.01
          }
        }
      ],
      budgets: {
        maxLatencyMs: 10000,
        maxCostPerTestUsd: 0.05,
        maxTotalCostUsd: 1.0
      }
    }
  ],
  baseline: {
    storage: "local",
    path: ".bagula/baselines"
  },
  reporting: {
    formats: ["json", "html"],
    outputDir: ".bagula/reports"
  }
};

export async function initCommand(options: InitOptions = {}): Promise<void> {
  console.log(chalk.blue.bold('\n🚀 Bagula Configuration Setup\n'));

  const configPath = resolve(process.cwd(), 'bagula.config.json');

  // Check if config already exists
  if (existsSync(configPath) && !options.force) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Configuration file already exists. Overwrite?',
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('\n⚠️  Initialization cancelled\n'));
      return;
    }
  }

  // Get user preferences
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'agentName',
      message: 'What is your agent name?',
      default: 'my-agent',
    },
    {
      type: 'list',
      name: 'provider',
      message: 'Which LLM provider are you using?',
      choices: ['openai', 'anthropic', 'custom'],
      default: 'openai',
    },
    {
      type: 'input',
      name: 'model',
      message: 'Which model are you using?',
      default: (answers: any) => answers.provider === 'openai' ? 'gpt-4' : 'claude-3-sonnet',
    },
    {
      type: 'confirm',
      name: 'includeExample',
      message: 'Include example test suite?',
      default: true,
    },
  ]);

  // Create configuration
  const config = answers.includeExample ? {
    ...defaultConfig,
    suites: [
      {
        ...defaultConfig.suites[0],
        config: {
          ...defaultConfig.suites[0].config,
          name: answers.agentName,
          provider: answers.provider,
          model: answers.model,
        },
      },
    ],
  } : {
    ...defaultConfig,
    suites: [],
  };

  // Write configuration
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green(`\n✅ Configuration created: ${configPath}`));

    console.log(chalk.blue('\n📝 Next steps:\n'));
    console.log(chalk.gray('  1. Add your API key to environment variables:'));
    console.log(chalk.cyan(`     export ${answers.provider.toUpperCase()}_API_KEY="your-key-here"`));
    console.log(chalk.gray('\n  2. Edit bagula.config.json to add your test cases'));
    console.log(chalk.gray('\n  3. Run your tests:'));
    console.log(chalk.cyan('     bagula run'));
    console.log();
  } catch (error: any) {
    console.error(chalk.red(`\n❌ Error creating configuration: ${error.message}\n`));
    process.exit(1);
  }
}
