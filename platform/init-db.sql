-- Bagula Database Schema
-- PostgreSQL + TimescaleDB for time-series optimization

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Agent Sessions (hypertable for time-series optimization)
CREATE TABLE agent_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    api_key_id UUID NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    initial_request TEXT,
    final_outcome JSONB,
    metadata JSONB,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('agent_sessions', 'start_time');

-- Turns (conversation exchanges within a session)
CREATE TABLE turns (
    turn_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES agent_sessions(session_id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    trigger JSONB NOT NULL,
    agent_response JSONB,
    user_feedback JSONB,
    CONSTRAINT unique_session_turn UNIQUE (session_id, turn_number)
);

-- LLM Calls (hypertable for time-series analytics)
CREATE TABLE llm_calls (
    call_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES agent_sessions(session_id) ON DELETE CASCADE,
    turn_id UUID REFERENCES turns(turn_id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    tokens_input INTEGER,
    tokens_output INTEGER,
    tokens_total INTEGER,
    cost_usd DECIMAL(10, 6),
    latency_ms INTEGER,
    messages JSONB,
    response JSONB
);

-- Convert to hypertable
SELECT create_hypertable('llm_calls', 'start_time');

-- Tool Calls (tool executions within turns)
CREATE TABLE tool_calls (
    tool_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES agent_sessions(session_id) ON DELETE CASCADE,
    turn_id UUID REFERENCES turns(turn_id) ON DELETE CASCADE,
    tool_name VARCHAR(255) NOT NULL,
    arguments JSONB,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    result JSONB,
    error TEXT,
    latency_ms INTEGER
);

-- ============================================================================
-- Opportunities & Analysis Tables
-- ============================================================================

-- Opportunities (detected improvements)
CREATE TABLE opportunities (
    opportunity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES agent_sessions(session_id) ON DELETE CASCADE,
    agent_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'cost', 'performance', 'quality', 'regression'
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high'
    title TEXT NOT NULL,
    description TEXT,
    suggested_action TEXT,
    estimated_cost_savings_usd DECIMAL(10, 6),
    estimated_latency_reduction_ms INTEGER,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    resolution_note TEXT
);

-- Baselines (saved sessions for regression comparison)
CREATE TABLE baselines (
    baseline_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR(255) NOT NULL,
    session_id UUID REFERENCES agent_sessions(session_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metrics JSONB,
    tags TEXT[],
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_active_baseline_per_agent UNIQUE (agent_name, active) WHERE active = TRUE
);

-- API Keys (for authentication)
CREATE TABLE api_keys (
    api_key_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    organization VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Agent Sessions Indexes
CREATE INDEX idx_sessions_agent_name ON agent_sessions(agent_name);
CREATE INDEX idx_sessions_start_time ON agent_sessions(start_time DESC);
CREATE INDEX idx_sessions_user_id ON agent_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_sessions_api_key_id ON agent_sessions(api_key_id);
CREATE INDEX idx_sessions_created_at ON agent_sessions(created_at DESC);

-- Turns Indexes
CREATE INDEX idx_turns_session_id ON turns(session_id);
CREATE INDEX idx_turns_timestamp ON turns(timestamp DESC);

-- LLM Calls Indexes
CREATE INDEX idx_llm_calls_session ON llm_calls(session_id);
CREATE INDEX idx_llm_calls_turn ON llm_calls(turn_id);
CREATE INDEX idx_llm_calls_provider_model ON llm_calls(provider, model);
CREATE INDEX idx_llm_calls_start_time ON llm_calls(start_time DESC);

-- Tool Calls Indexes
CREATE INDEX idx_tool_calls_session ON tool_calls(session_id);
CREATE INDEX idx_tool_calls_turn ON tool_calls(turn_id);
CREATE INDEX idx_tool_calls_tool_name ON tool_calls(tool_name);
CREATE INDEX idx_tool_calls_start_time ON tool_calls(start_time DESC);

-- Opportunities Indexes
CREATE INDEX idx_opportunities_agent ON opportunities(agent_name, detected_at DESC);
CREATE INDEX idx_opportunities_session ON opportunities(session_id);
CREATE INDEX idx_opportunities_type ON opportunities(type, detected_at DESC);
CREATE INDEX idx_opportunities_severity ON opportunities(severity, detected_at DESC);
CREATE INDEX idx_opportunities_resolved ON opportunities(resolved, detected_at DESC);

-- Baselines Indexes
CREATE INDEX idx_baselines_agent_name ON baselines(agent_name);
CREATE INDEX idx_baselines_active ON baselines(agent_name, active) WHERE active = TRUE;

-- ============================================================================
-- Helper Views
-- ============================================================================

-- View: Session Summary (commonly queried metrics)
CREATE VIEW session_summary AS
SELECT
    s.session_id,
    s.agent_name,
    s.user_id,
    s.start_time,
    s.end_time,
    EXTRACT(EPOCH FROM (s.end_time - s.start_time)) * 1000 AS duration_ms,
    COUNT(DISTINCT t.turn_id) AS turn_count,
    COUNT(DISTINCT l.call_id) AS llm_call_count,
    COUNT(DISTINCT tc.tool_id) AS tool_call_count,
    COALESCE(SUM(l.tokens_total), 0) AS total_tokens,
    COALESCE(SUM(l.cost_usd), 0) AS total_cost_usd,
    COALESCE(AVG(l.latency_ms), 0) AS avg_llm_latency_ms,
    s.final_outcome->>'status' AS outcome_status,
    s.final_outcome->>'userSatisfaction' AS user_satisfaction
FROM agent_sessions s
LEFT JOIN turns t ON s.session_id = t.session_id
LEFT JOIN llm_calls l ON s.session_id = l.session_id
LEFT JOIN tool_calls tc ON s.session_id = tc.session_id
GROUP BY s.session_id;

-- View: Opportunity Summary by Agent
CREATE VIEW opportunity_summary_by_agent AS
SELECT
    agent_name,
    COUNT(*) FILTER (WHERE type = 'cost') AS cost_opportunities,
    COUNT(*) FILTER (WHERE type = 'performance') AS performance_opportunities,
    COUNT(*) FILTER (WHERE type = 'quality') AS quality_opportunities,
    COUNT(*) FILTER (WHERE type = 'regression') AS regression_opportunities,
    COUNT(*) FILTER (WHERE severity = 'high' AND NOT resolved) AS high_severity_unresolved,
    SUM(estimated_cost_savings_usd) FILTER (WHERE NOT resolved) AS potential_cost_savings,
    SUM(estimated_latency_reduction_ms) FILTER (WHERE NOT resolved) AS potential_latency_reduction
FROM opportunities
GROUP BY agent_name;

-- ============================================================================
-- Data Retention Policy (TimescaleDB)
-- ============================================================================

-- Compress data older than 7 days
SELECT add_compression_policy('agent_sessions', INTERVAL '7 days');
SELECT add_compression_policy('llm_calls', INTERVAL '7 days');

-- Optional: Add retention policy (uncomment to enable auto-deletion)
-- Delete data older than 90 days
-- SELECT add_retention_policy('agent_sessions', INTERVAL '90 days');
-- SELECT add_retention_policy('llm_calls', INTERVAL '90 days');

-- ============================================================================
-- Initial Data: Create a default API key for development
-- ============================================================================

-- Insert a default API key for local development
-- Key: bagula-dev-key-12345 (hash this in production!)
INSERT INTO api_keys (key_hash, name, organization, active)
VALUES (
    'bagula-dev-key-12345',
    'Development Key',
    'Local Development',
    TRUE
);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function: Update last_used_at for API keys
CREATE OR REPLACE FUNCTION update_api_key_last_used()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE api_keys
    SET last_used_at = NOW()
    WHERE api_key_id = NEW.api_key_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update API key last_used_at on new session
CREATE TRIGGER trigger_update_api_key_last_used
AFTER INSERT ON agent_sessions
FOR EACH ROW
EXECUTE FUNCTION update_api_key_last_used();

-- ============================================================================
-- Grants (optional, adjust for your security requirements)
-- ============================================================================

-- Grant permissions to bagula user (created by docker-compose)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bagula;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bagula;
