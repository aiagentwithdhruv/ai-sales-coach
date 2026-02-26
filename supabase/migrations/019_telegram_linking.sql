-- Telegram Linking Codes
-- Used to connect user accounts to Telegram bot
CREATE TABLE IF NOT EXISTS telegram_linking_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Index for code lookups
CREATE INDEX IF NOT EXISTS idx_telegram_linking_codes_code ON telegram_linking_codes(code) WHERE used = FALSE;

-- Auto-clean expired codes (can be run via pg_cron or manually)
-- DELETE FROM telegram_linking_codes WHERE expires_at < NOW();

-- Activity log for notifications
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_type ON activity_log(user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- RLS policies
ALTER TABLE telegram_linking_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own linking codes" ON telegram_linking_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activity" ON activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access on telegram_linking_codes" ON telegram_linking_codes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on activity_log" ON activity_log
  FOR ALL USING (auth.role() = 'service_role');
