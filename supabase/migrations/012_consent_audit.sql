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
