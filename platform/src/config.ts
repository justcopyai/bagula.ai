/**
 * Bagula Platform - Configuration Management
 * Loads settings from environment variables
 */

import { config } from 'dotenv';

config();

export const appConfig = {
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://bagula:bagula_dev_password@localhost:5432/bagula',
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379/0',
  },

  // LLM Provider API Keys
  llm: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  },

  // Server Configuration
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '8000', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Opportunity Detection Thresholds
  opportunities: {
    cost: {
      expensiveThresholdUsd: parseFloat(process.env.COST_EXPENSIVE_THRESHOLD_USD || '0.10'),
      redundantWindowMinutes: parseInt(process.env.COST_REDUNDANT_WINDOW_MINUTES || '5', 10),
      excessiveTokens: parseInt(process.env.COST_EXCESSIVE_TOKENS || '5000', 10),
    },
    performance: {
      slowToolThresholdMs: parseInt(process.env.PERFORMANCE_SLOW_TOOL_THRESHOLD_MS || '5000', 10),
      excessiveTurns: parseInt(process.env.PERFORMANCE_EXCESSIVE_TURNS || '10', 10),
      timeoutWarningMs: parseInt(process.env.PERFORMANCE_TIMEOUT_WARNING_MS || '25000', 10),
    },
    quality: {
      toolFailureThreshold: parseFloat(process.env.QUALITY_TOOL_FAILURE_THRESHOLD || '0.20'),
      minCallsForAnalysis: parseInt(process.env.QUALITY_MIN_CALLS_FOR_ANALYSIS || '5', 10),
    },
    regression: {
      similarityThreshold: parseFloat(process.env.REGRESSION_SIMILARITY_THRESHOLD || '0.7'),
      model: process.env.REGRESSION_MODEL || 'gpt-3.5-turbo',
    },
  },
} as const;
