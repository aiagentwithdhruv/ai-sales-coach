-- ============================================================================
-- Phase 3: "The Brain" — Feedback, Composition, Performance Tracking
-- ============================================================================
-- Tables:
--   feedback_outcomes        — Deal outcomes for scoring recalibration
--   scoring_calibrations     — AI-generated scoring weight snapshots
--   agent_performance_snapshots — Weekly agent performance metrics
--   chain_executions         — Composition chain progress tracking
--   voice_commands           — Voice command audit log
-- ============================================================================

-- ─── Feedback Outcomes ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feedback_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('won', 'lost', 'nurture', 'unsubscribed')),
  deal_value NUMERIC(12,2) DEFAULT 0,
  lost_reason TEXT,
  lead_score_at_close INTEGER DEFAULT 0,
  source TEXT DEFAULT 'unknown',
  enrichment_snapshot JSONB DEFAULT '{}',
  journey_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feedback_outcomes_user ON feedback_outcomes(user_id);
CREATE INDEX idx_feedback_outcomes_outcome ON feedback_outcomes(outcome);
CREATE INDEX idx_feedback_outcomes_created ON feedback_outcomes(created_at);

ALTER TABLE feedback_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own feedback outcomes"
  ON feedback_outcomes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages feedback outcomes"
  ON feedback_outcomes FOR ALL USING (auth.role() = 'service_role');

-- ─── Scoring Calibrations ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scoring_calibrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis JSONB NOT NULL DEFAULT '{}',
  recommendations JSONB NOT NULL DEFAULT '{}',
  outcome_count INTEGER DEFAULT 0,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scoring_calibrations_created ON scoring_calibrations(created_at);

-- No RLS needed — system-only table accessed via service role

-- ─── Agent Performance Snapshots ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_performance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL DEFAULT 'weekly',
  week_start TIMESTAMPTZ NOT NULL,
  stats JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agent_perf_period ON agent_performance_snapshots(period, week_start);

-- ─── Chain Executions ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chain_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  chain_id TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'paused')),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, contact_id, chain_id)
);

CREATE INDEX idx_chain_executions_user ON chain_executions(user_id);
CREATE INDEX idx_chain_executions_status ON chain_executions(status);
CREATE INDEX idx_chain_executions_contact ON chain_executions(contact_id);

ALTER TABLE chain_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own chain executions"
  ON chain_executions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages chain executions"
  ON chain_executions FOR ALL USING (auth.role() = 'service_role');

-- ─── Voice Commands Audit Log ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS voice_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  parsed_action TEXT,
  parsed_params JSONB DEFAULT '{}',
  confidence NUMERIC(3,2) DEFAULT 0,
  executed BOOLEAN DEFAULT false,
  result JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_voice_commands_user ON voice_commands(user_id);
CREATE INDEX idx_voice_commands_created ON voice_commands(created_at);

ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own voice commands"
  ON voice_commands FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages voice commands"
  ON voice_commands FOR ALL USING (auth.role() = 'service_role');

-- ─── Template Performance (for Item 13 optimizer) ─────────────────────────

CREATE TABLE IF NOT EXISTS template_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'A',
  channel TEXT NOT NULL,
  sent INTEGER DEFAULT 0,
  opened INTEGER DEFAULT 0,
  clicked INTEGER DEFAULT 0,
  replied INTEGER DEFAULT 0,
  converted INTEGER DEFAULT 0,
  performance_score NUMERIC(8,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_template_perf_user ON template_performance(user_id);
CREATE INDEX idx_template_perf_active ON template_performance(is_active);
CREATE INDEX idx_template_perf_score ON template_performance(performance_score DESC);
CREATE INDEX idx_template_perf_template ON template_performance(template_id, channel);

ALTER TABLE template_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own template performance"
  ON template_performance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages template performance"
  ON template_performance FOR ALL USING (auth.role() = 'service_role');
