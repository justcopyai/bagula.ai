/**
 * Bagula Database Schema (Drizzle ORM)
 * Matches the PostgreSQL + TimescaleDB schema in init-db.sql
 */

import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, decimal, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

// ============================================================================
// Core Tables
// ============================================================================

export const agentSessions = pgTable('agent_sessions', {
  sessionId: uuid('session_id').primaryKey().defaultRandom(),
  agentName: varchar('agent_name', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }),
  apiKeyId: uuid('api_key_id').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  initialRequest: text('initial_request'),
  finalOutcome: jsonb('final_outcome'),
  metadata: jsonb('metadata'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  agentNameIdx: index('idx_sessions_agent_name').on(table.agentName),
  startTimeIdx: index('idx_sessions_start_time').on(table.startTime),
  userIdIdx: index('idx_sessions_user_id').on(table.userId),
  apiKeyIdIdx: index('idx_sessions_api_key_id').on(table.apiKeyId),
  createdAtIdx: index('idx_sessions_created_at').on(table.createdAt),
}));

export const turns = pgTable('turns', {
  turnId: uuid('turn_id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => agentSessions.sessionId, { onDelete: 'cascade' }),
  turnNumber: integer('turn_number').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  trigger: jsonb('trigger').notNull(),
  agentResponse: jsonb('agent_response'),
  userFeedback: jsonb('user_feedback'),
}, (table) => ({
  sessionIdIdx: index('idx_turns_session_id').on(table.sessionId),
  timestampIdx: index('idx_turns_timestamp').on(table.timestamp),
  uniqueSessionTurn: uniqueIndex('unique_session_turn').on(table.sessionId, table.turnNumber),
}));

export const llmCalls = pgTable('llm_calls', {
  callId: uuid('call_id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => agentSessions.sessionId, { onDelete: 'cascade' }),
  turnId: uuid('turn_id').notNull().references(() => turns.turnId, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  tokensTotal: integer('tokens_total'),
  costUsd: decimal('cost_usd', { precision: 10, scale: 6 }),
  latencyMs: integer('latency_ms'),
  messages: jsonb('messages'),
  response: jsonb('response'),
}, (table) => ({
  sessionIdx: index('idx_llm_calls_session').on(table.sessionId),
  turnIdx: index('idx_llm_calls_turn').on(table.turnId),
  providerModelIdx: index('idx_llm_calls_provider_model').on(table.provider, table.model),
  startTimeIdx: index('idx_llm_calls_start_time').on(table.startTime),
}));

export const toolCalls = pgTable('tool_calls', {
  toolId: uuid('tool_id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => agentSessions.sessionId, { onDelete: 'cascade' }),
  turnId: uuid('turn_id').notNull().references(() => turns.turnId, { onDelete: 'cascade' }),
  toolName: varchar('tool_name', { length: 255 }).notNull(),
  arguments: jsonb('arguments'),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  result: jsonb('result'),
  error: text('error'),
  latencyMs: integer('latency_ms'),
}, (table) => ({
  sessionIdx: index('idx_tool_calls_session').on(table.sessionId),
  turnIdx: index('idx_tool_calls_turn').on(table.turnId),
  toolNameIdx: index('idx_tool_calls_tool_name').on(table.toolName),
  startTimeIdx: index('idx_tool_calls_start_time').on(table.startTime),
}));

// ============================================================================
// Opportunities & Analysis Tables
// ============================================================================

export const opportunities = pgTable('opportunities', {
  opportunityId: uuid('opportunity_id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => agentSessions.sessionId, { onDelete: 'cascade' }),
  agentName: varchar('agent_name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'cost', 'performance', 'quality', 'regression'
  severity: varchar('severity', { length: 20 }).notNull(), // 'low', 'medium', 'high'
  title: text('title').notNull(),
  description: text('description'),
  suggestedAction: text('suggested_action'),
  estimatedCostSavingsUsd: decimal('estimated_cost_savings_usd', { precision: 10, scale: 6 }),
  estimatedLatencyReductionMs: integer('estimated_latency_reduction_ms'),
  detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow(),
  resolved: boolean('resolved').default(false),
  resolutionNote: text('resolution_note'),
}, (table) => ({
  agentIdx: index('idx_opportunities_agent').on(table.agentName, table.detectedAt),
  sessionIdx: index('idx_opportunities_session').on(table.sessionId),
  typeIdx: index('idx_opportunities_type').on(table.type, table.detectedAt),
  severityIdx: index('idx_opportunities_severity').on(table.severity, table.detectedAt),
  resolvedIdx: index('idx_opportunities_resolved').on(table.resolved, table.detectedAt),
}));

export const baselines = pgTable('baselines', {
  baselineId: uuid('baseline_id').primaryKey().defaultRandom(),
  agentName: varchar('agent_name', { length: 255 }).notNull(),
  sessionId: uuid('session_id').notNull().references(() => agentSessions.sessionId, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  metrics: jsonb('metrics'),
  tags: text('tags').array(),
  active: boolean('active').default(true),
}, (table) => ({
  agentNameIdx: index('idx_baselines_agent_name').on(table.agentName),
  activeIdx: index('idx_baselines_active').on(table.agentName, table.active),
}));

export const apiKeys = pgTable('api_keys', {
  apiKeyId: uuid('api_key_id').primaryKey().defaultRandom(),
  keyHash: varchar('key_hash', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  organization: varchar('organization', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  active: boolean('active').default(true),
});

// ============================================================================
// TypeScript Types (Inferred from schema)
// ============================================================================

export type AgentSession = typeof agentSessions.$inferSelect;
export type NewAgentSession = typeof agentSessions.$inferInsert;

export type Turn = typeof turns.$inferSelect;
export type NewTurn = typeof turns.$inferInsert;

export type LLMCall = typeof llmCalls.$inferSelect;
export type NewLLMCall = typeof llmCalls.$inferInsert;

export type ToolCall = typeof toolCalls.$inferSelect;
export type NewToolCall = typeof toolCalls.$inferInsert;

export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;

export type Baseline = typeof baselines.$inferSelect;
export type NewBaseline = typeof baselines.$inferInsert;

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
