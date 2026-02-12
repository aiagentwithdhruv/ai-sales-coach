-- ===========================================
-- Follow-Up Automation System
-- ===========================================
-- Automated email/SMS follow-ups triggered by AI call outcomes.
-- Sequences define rules, messages are the scheduled queue.

-- Follow-up sequences (rules)
CREATE TABLE IF NOT EXISTS public.follow_up_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL CHECK (trigger IN (
    'meeting_booked', 'callback_scheduled', 'interested',
    'not_interested', 'no_answer', 'voicemail', 'any_completed'
  )),
  is_active BOOLEAN NOT NULL DEFAULT true,
  steps JSONB NOT NULL DEFAULT '[]',
  -- Each step: { delay_minutes, channel, subject?, template }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.follow_up_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own follow_up_sequences"
  ON public.follow_up_sequences FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access follow_up_sequences"
  ON public.follow_up_sequences FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Follow-up messages (scheduled queue)
CREATE TABLE IF NOT EXISTS public.follow_up_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sequence_id UUID REFERENCES public.follow_up_sequences(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  call_id UUID REFERENCES public.ai_calls(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  subject TEXT,
  body TEXT NOT NULL,
  send_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.follow_up_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own follow_up_messages"
  ON public.follow_up_messages FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access follow_up_messages"
  ON public.follow_up_messages FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_user ON public.follow_up_sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_trigger ON public.follow_up_sequences(user_id, trigger) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_follow_up_messages_pending ON public.follow_up_messages(send_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_follow_up_messages_contact ON public.follow_up_messages(contact_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_up_sequences TO authenticated;
GRANT ALL ON public.follow_up_sequences TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_up_messages TO authenticated;
GRANT ALL ON public.follow_up_messages TO service_role;
