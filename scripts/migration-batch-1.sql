-- QuotaHit Migration Batch 1 of 2
-- Tables: consent, audit, outreach, brain analytics
-- Paste in Supabase SQL Editor → Run

-- === 007_external_id.sql ===
-- ===========================================
-- Add external CRM link fields to contacts
-- ===========================================
-- Links QuotaHit contacts back to their source CRM (Zoho, Salesforce, etc.)
-- for bidirectional sync.

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS external_provider TEXT;

-- Index for fast lookups during sync
CREATE INDEX IF NOT EXISTS idx_contacts_external
  ON public.contacts(external_provider, external_id)
  WHERE external_id IS NOT NULL;

-- === 011_agent_visitor_phone.sql ===
-- Add phone column to agent_visitor_memory
ALTER TABLE agent_visitor_memory ADD COLUMN IF NOT EXISTS phone TEXT;

-- === 012_consent_audit.sql ===
-- ===========================================
-- Consent + Audit Log Tables
-- ===========================================
-- Consent Records: tracks TCPA consent for every contact
-- Audit Log: tracks every agent action for compliance

-- Consent Records: tracks TCPA consent for every contact
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('tcpa_call', 'tcpa_sms', 'email_marketing', 'ai_disclosure')),
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_method TEXT NOT NULL CHECK (consent_method IN ('web_form', 'verbal', 'written', 'api', 'import')),
  ip_address TEXT,
  consent_text TEXT, -- exact text shown when consent was collected
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_consent_contact ON consent_records(contact_id);
CREATE INDEX idx_consent_user ON consent_records(user_id);

-- Audit Log: tracks every agent action for compliance
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID,
  agent_name TEXT, -- which AI agent performed the action
  action TEXT NOT NULL, -- e.g., 'call_initiated', 'email_sent', 'consent_checked'
  outcome TEXT, -- 'success', 'blocked', 'failed'
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_contact ON audit_log(contact_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own consent records" ON consent_records
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own audit logs" ON audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access consent" ON consent_records
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access audit" ON audit_log
  FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at for consent_records (reuses function from 001_user_credits.sql)
CREATE TRIGGER update_consent_records_updated_at
  BEFORE UPDATE ON consent_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON consent_records TO authenticated;
GRANT ALL ON consent_records TO service_role;

GRANT SELECT, INSERT ON audit_log TO authenticated;
GRANT ALL ON audit_log TO service_role;

-- === 013_outreach_channels.sql ===
-- 013_outreach_channels.sql
-- Phase 2: The Outreach Engine
-- Multi-channel outreach sequences, channel tracking, message events

-- Track which channels are configured per user
CREATE TABLE IF NOT EXISTS outreach_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'linkedin', 'whatsapp', 'call', 'sms')),
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  daily_limit INTEGER DEFAULT 50,
  sent_today INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Multi-channel outreach sequence definitions
CREATE TABLE IF NOT EXISTS outreach_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Track contact enrollment in outreach sequences
CREATE TABLE IF NOT EXISTS outreach_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  sequence_id UUID NOT NULL REFERENCES outreach_sequences(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'replied', 'bounced', 'unsubscribed')),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  paused_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  pause_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Track individual message delivery events (opens, clicks, replies, bounces)
CREATE TABLE IF NOT EXISTS message_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed', 'complained')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE outreach_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own data
CREATE POLICY "Users can manage their own outreach channels"
  ON outreach_channels FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own outreach sequences"
  ON outreach_sequences FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own outreach enrollments"
  ON outreach_enrollments FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own message events"
  ON message_events FOR ALL USING (auth.uid() = user_id);

-- Service role bypass for Inngest/backend
CREATE POLICY "Service role bypass outreach_channels"
  ON outreach_channels FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass outreach_sequences"
  ON outreach_sequences FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass outreach_enrollments"
  ON outreach_enrollments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass message_events"
  ON message_events FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_outreach_channels_user ON outreach_channels(user_id, channel);
CREATE INDEX idx_outreach_sequences_user ON outreach_sequences(user_id, is_active);
CREATE INDEX idx_outreach_enrollments_contact ON outreach_enrollments(contact_id, user_id, status);
CREATE INDEX idx_outreach_enrollments_active ON outreach_enrollments(status, user_id);
CREATE INDEX idx_message_events_message ON message_events(message_id);
CREATE INDEX idx_message_events_user ON message_events(user_id, created_at DESC);
CREATE INDEX idx_message_events_type ON message_events(user_id, event_type, created_at DESC);

-- === 014_phase3_brain.sql ===
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
