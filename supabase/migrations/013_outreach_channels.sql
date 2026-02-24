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
