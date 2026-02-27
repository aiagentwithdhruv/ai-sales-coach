-- QuotaHit Migration Batch 2 of 2
-- Tables: proposals, invoices, meetings, marketplace, blog, telegram, dev keys
-- Paste in Supabase SQL Editor → Run

-- === 015_phase4_closer.sql ===
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

-- === 016_phase5_marketplace.sql ===
-- ============================================================================
-- Phase 5: Marketplace + Demo — Loadouts, Marketplace, Demo, RAG
-- ============================================================================
-- Tables:
--   loadouts                — Custom agent loadout configurations
--   marketplace_listings    — Published loadouts for community
--   marketplace_reviews     — User reviews on marketplace listings
--   demo_sessions           — Chat-based demo conversations
--   voice_demo_sessions     — Voice-based demo conversations
--   knowledge_documents     — RAG source documents
--   knowledge_chunks        — Embedded text chunks for vector search
-- ============================================================================

-- ─── Loadouts ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS loadouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  industry TEXT,
  agents JSONB DEFAULT '[]',
  chain JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'published', 'archived')),
  version INTEGER DEFAULT 1,
  source_listing_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_loadouts_user ON loadouts(user_id);
CREATE INDEX idx_loadouts_status ON loadouts(status);
CREATE INDEX idx_loadouts_industry ON loadouts(industry);

ALTER TABLE loadouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own loadouts"
  ON loadouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own loadouts"
  ON loadouts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages loadouts"
  ON loadouts FOR ALL USING (auth.role() = 'service_role');

-- ─── Marketplace Listings ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loadout_id UUID REFERENCES loadouts(id) ON DELETE SET NULL,
  publisher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  publisher_name TEXT DEFAULT 'Anonymous',
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  industry TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  agent_count INTEGER DEFAULT 0,
  rating NUMERIC(3,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  install_count INTEGER DEFAULT 0,
  price NUMERIC(8,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  preview_images TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'under_review', 'rejected', 'removed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_marketplace_status ON marketplace_listings(status);
CREATE INDEX idx_marketplace_industry ON marketplace_listings(industry);
CREATE INDEX idx_marketplace_rating ON marketplace_listings(rating DESC);
CREATE INDEX idx_marketplace_installs ON marketplace_listings(install_count DESC);
CREATE INDEX idx_marketplace_publisher ON marketplace_listings(publisher_id);

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can browse published listings"
  ON marketplace_listings FOR SELECT USING (status = 'published');
CREATE POLICY "Publishers manage own listings"
  ON marketplace_listings FOR ALL USING (auth.uid() = publisher_id);
CREATE POLICY "Service role manages all listings"
  ON marketplace_listings FOR ALL USING (auth.role() = 'service_role');

-- ─── Marketplace Reviews ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT DEFAULT 'Anonymous',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(listing_id, user_id) -- one review per user per listing
);

CREATE INDEX idx_reviews_listing ON marketplace_reviews(listing_id);

ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reviews"
  ON marketplace_reviews FOR SELECT USING (true);
CREATE POLICY "Users manage own reviews"
  ON marketplace_reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages reviews"
  ON marketplace_reviews FOR ALL USING (auth.role() = 'service_role');

-- ─── Demo Sessions (Chat) ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  messages JSONB DEFAULT '[]',
  stage TEXT DEFAULT 'intro',
  qualification_data JSONB DEFAULT '{}',
  context JSONB DEFAULT '{}',
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_demo_sessions_visitor ON demo_sessions(visitor_id);
CREATE INDEX idx_demo_sessions_created ON demo_sessions(created_at);

-- No RLS — demo sessions are public-facing

-- ─── Voice Demo Sessions ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS voice_demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT,
  call_sid TEXT,
  visitor_phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  transcript JSONB DEFAULT '[]',
  qualification_data JSONB DEFAULT '{}',
  agent_config JSONB DEFAULT '{}',
  outcome TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_voice_demo_status ON voice_demo_sessions(status);
CREATE INDEX idx_voice_demo_created ON voice_demo_sessions(created_at);

-- ─── Knowledge Documents ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  content TEXT DEFAULT '',
  chunk_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_knowledge_docs_user ON knowledge_documents(user_id);
CREATE INDEX idx_knowledge_docs_status ON knowledge_documents(status);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own documents"
  ON knowledge_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own documents"
  ON knowledge_documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages documents"
  ON knowledge_documents FOR ALL USING (auth.role() = 'service_role');

-- ─── Knowledge Chunks (for Vector Search) ────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding TEXT, -- Stored as JSON array; use pgvector column if extension available
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_knowledge_chunks_doc ON knowledge_chunks(document_id);
CREATE INDEX idx_knowledge_chunks_user ON knowledge_chunks(user_id);

ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own chunks"
  ON knowledge_chunks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages chunks"
  ON knowledge_chunks FOR ALL USING (auth.role() = 'service_role');

-- ─── Vector search function (requires pgvector extension) ────────────────
-- Note: Enable pgvector in Supabase Dashboard → Extensions → vector
-- Then run: ALTER TABLE knowledge_chunks ADD COLUMN embedding_vector vector(1536);
-- And create this function:

-- CREATE OR REPLACE FUNCTION match_knowledge_chunks(
--   query_embedding TEXT,
--   match_threshold FLOAT,
--   match_count INT,
--   p_user_id UUID
-- )
-- RETURNS TABLE (
--   id UUID,
--   content TEXT,
--   metadata JSONB,
--   similarity FLOAT
-- )
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   RETURN QUERY
--   SELECT
--     kc.id,
--     kc.content,
--     kc.metadata,
--     1 - (kc.embedding_vector <=> query_embedding::vector) AS similarity
--   FROM knowledge_chunks kc
--   WHERE kc.user_id = p_user_id
--     AND 1 - (kc.embedding_vector <=> query_embedding::vector) > match_threshold
--   ORDER BY kc.embedding_vector <=> query_embedding::vector
--   LIMIT match_count;
-- END;
-- $$;

-- === 017_fix_trial_duration.sql ===
-- Fix trial duration: align DB trigger with code constant (14 days, not 15)

CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_type, status, trial_ends_at, modules)
  VALUES (
    NEW.id,
    'free',
    'trial',
    NOW() + INTERVAL '14 days',
    ARRAY['coaching', 'crm', 'calling', 'followups', 'analytics']
  );

  -- Also set trial dates on credits
  UPDATE public.user_credits
  SET trial_started_at = NOW(), trial_ends_at = NOW() + INTERVAL '14 days'
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- === 018_blog_posts.sql ===
-- Blog posts table for automated daily content publishing (n8n workflow)

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  meta_description TEXT,
  body        TEXT NOT NULL,
  hero_image_url TEXT,
  tags        TEXT[] DEFAULT '{}',
  reading_time_min INTEGER DEFAULT 1,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast listing by status + date
CREATE INDEX IF NOT EXISTS idx_blog_posts_published
  ON public.blog_posts (status, published_at DESC)
  WHERE status = 'published';

-- Index for slug lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug
  ON public.blog_posts (slug);

-- Index for tag-based filtering (GIN for array contains)
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags
  ON public.blog_posts USING GIN (tags);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_posts_updated_at();

-- RLS: Public read for published posts, service role for writes
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts (blog is public)
CREATE POLICY "Public can read published blog posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

-- Service role (n8n automation) can do everything
CREATE POLICY "Service role full access to blog posts"
  ON public.blog_posts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- === 019_telegram_linking.sql ===
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

-- === 020_deal_attribution.sql ===
-- Deal Attribution: Agent Touchpoints
-- Tracks which AI agent contributed to each contact/deal
CREATE TABLE IF NOT EXISTS agent_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type VARCHAR(50) NOT NULL CHECK (agent_type IN ('scout', 'researcher', 'qualifier', 'outreach', 'caller', 'closer', 'ops', 'manual')),
  action VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_agent_touchpoints_contact ON agent_touchpoints(contact_id);
CREATE INDEX IF NOT EXISTS idx_agent_touchpoints_user ON agent_touchpoints(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_touchpoints_agent ON agent_touchpoints(agent_type, user_id);

-- RLS
ALTER TABLE agent_touchpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own touchpoints" ON agent_touchpoints
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on agent_touchpoints" ON agent_touchpoints
  FOR ALL USING (auth.role() = 'service_role');

-- === 021_developer_api_keys.sql ===
-- Developer API Keys
-- Public API authentication for third-party integrations
CREATE TABLE IF NOT EXISTS developer_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  environment VARCHAR(10) NOT NULL CHECK (environment IN ('live', 'test')),
  scopes TEXT[] DEFAULT ARRAY['contacts:read', 'contacts:write', 'leads:read', 'analytics:read'],
  rate_limit INTEGER DEFAULT 60,
  ip_whitelist TEXT[] DEFAULT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NULL,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_developer_api_keys_hash ON developer_api_keys(key_hash) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_developer_api_keys_user ON developer_api_keys(user_id);

-- Agency Clients (white-label)
CREATE TABLE IF NOT EXISTS agency_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name VARCHAR(200) NOT NULL,
  client_email VARCHAR(300) NOT NULL,
  client_user_id UUID DEFAULT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  tier_override VARCHAR(50) DEFAULT NULL,
  monthly_fee DECIMAL(10,2) DEFAULT 0,
  commission_percent INTEGER DEFAULT 30 CHECK (commission_percent BETWEEN 0 AND 100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_clients_agency ON agency_clients(agency_user_id);

-- RLS
ALTER TABLE developer_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys" ON developer_api_keys
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on developer_api_keys" ON developer_api_keys
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Agencies can manage own clients" ON agency_clients
  FOR ALL USING (auth.uid() = agency_user_id);

CREATE POLICY "Service role full access on agency_clients" ON agency_clients
  FOR ALL USING (auth.role() = 'service_role');
