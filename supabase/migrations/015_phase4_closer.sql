-- ============================================================================
-- Phase 4: "The Closer" — Proposals, Invoicing, Onboarding, Calendar
-- ============================================================================
-- Tables:
--   proposals           — AI-generated proposals from qualification data
--   invoices            — Stripe-integrated invoicing + payment tracking
--   onboarding_plans    — Post-payment welcome sequences
--   meetings            — Calendar booking / scheduling
--   booking_configs     — User availability settings
-- ============================================================================

-- ─── Proposals ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  title TEXT NOT NULL DEFAULT '',
  summary TEXT DEFAULT '',
  contact_info JSONB DEFAULT '{}',
  sections JSONB DEFAULT '[]',
  pricing JSONB DEFAULT '{}',
  terms TEXT DEFAULT '',
  valid_until TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_proposals_user ON proposals(user_id);
CREATE INDEX idx_proposals_contact ON proposals(contact_id);
CREATE INDEX idx_proposals_status ON proposals(status);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own proposals"
  ON proposals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own proposals"
  ON proposals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages proposals"
  ON proposals FOR ALL USING (auth.role() = 'service_role');

-- ─── Invoices ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
  invoice_number TEXT NOT NULL,
  items JSONB DEFAULT '[]',
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  due_date TIMESTAMPTZ,
  payment_link TEXT,
  stripe_invoice_id TEXT,
  stripe_customer_id TEXT,
  notes TEXT,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_contact ON invoices(contact_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id);
CREATE UNIQUE INDEX idx_invoices_number ON invoices(user_id, invoice_number);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own invoices"
  ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own invoices"
  ON invoices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages invoices"
  ON invoices FOR ALL USING (auth.role() = 'service_role');

-- ─── Onboarding Plans ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS onboarding_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'stalled')),
  steps JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_onboarding_user ON onboarding_plans(user_id);
CREATE INDEX idx_onboarding_status ON onboarding_plans(status);
CREATE INDEX idx_onboarding_contact ON onboarding_plans(contact_id);

ALTER TABLE onboarding_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own onboarding plans"
  ON onboarding_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages onboarding plans"
  ON onboarding_plans FOR ALL USING (auth.role() = 'service_role');

-- ─── Meetings ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Meeting',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
  attendee_name TEXT NOT NULL DEFAULT '',
  attendee_email TEXT NOT NULL DEFAULT '',
  notes TEXT,
  meeting_link TEXT,
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_meetings_user ON meetings(user_id);
CREATE INDEX idx_meetings_contact ON meetings(contact_id);
CREATE INDEX idx_meetings_start ON meetings(start_time);
CREATE INDEX idx_meetings_status ON meetings(status);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own meetings"
  ON meetings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own meetings"
  ON meetings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages meetings"
  ON meetings FOR ALL USING (auth.role() = 'service_role');

-- ─── Booking Configs ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS booking_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Sales Call',
  duration INTEGER DEFAULT 30,
  availability JSONB DEFAULT '[]',
  timezone TEXT DEFAULT 'America/New_York',
  buffer_before INTEGER DEFAULT 0,
  buffer_after INTEGER DEFAULT 5,
  max_bookings_per_day INTEGER DEFAULT 8,
  confirmation_email BOOLEAN DEFAULT true,
  reminder_emails BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE booking_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own booking config"
  ON booking_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own booking config"
  ON booking_configs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages booking configs"
  ON booking_configs FOR ALL USING (auth.role() = 'service_role');
