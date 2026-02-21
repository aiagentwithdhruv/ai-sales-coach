-- ===========================================
-- Agent System: Conversations, Visitor Memory, Discount Codes
-- ===========================================
-- Supports: sales agent on pricing page, future multi-agent system.
-- All tables use visitor_id (anonymous cookie-based UUID) as primary key.

-- ─── Agent Conversations ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_type TEXT NOT NULL DEFAULT 'sales',
  page_context TEXT DEFAULT 'pricing',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'converted')),
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Sales state
  modules_interested TEXT[] DEFAULT '{}',
  objections_raised TEXT[] DEFAULT '{}',
  discount_offered NUMERIC(5,2),
  discount_type TEXT,
  email_collected TEXT,
  name_collected TEXT,
  company_collected TEXT,
  team_size TEXT,
  current_tools TEXT,
  outcome TEXT,
  checkout_url TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_visitor
  ON public.agent_conversations(visitor_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent_type
  ON public.agent_conversations(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_outcome
  ON public.agent_conversations(outcome);

-- ─── Agent Visitor Memory ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.agent_visitor_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  company TEXT,
  team_size TEXT,
  industry TEXT,
  current_tools TEXT[] DEFAULT '{}',
  total_visits INTEGER NOT NULL DEFAULT 1,
  total_conversations INTEGER NOT NULL DEFAULT 0,
  modules_interested TEXT[] DEFAULT '{}',
  all_objections TEXT[] DEFAULT '{}',
  best_discount_offered NUMERIC(5,2),
  conversion_status TEXT NOT NULL DEFAULT 'prospect'
    CHECK (conversion_status IN ('prospect', 'engaged', 'negotiating', 'converted', 'churned')),
  summary TEXT,

  -- Timestamps
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_visitor_memory_email
  ON public.agent_visitor_memory(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_visitor_memory_status
  ON public.agent_visitor_memory(conversion_status);

-- ─── Agent Discount Codes ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.agent_discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE SET NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN (
    'social_share', 'referral', 'annual_commitment', 'referral_plus_annual'
  )),
  discount_percent NUMERIC(5,2) NOT NULL,
  stripe_coupon_id TEXT,
  stripe_promo_code TEXT,
  is_used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_discount_codes_visitor
  ON public.agent_discount_codes(visitor_id, discount_type);

-- ─── RLS Policies ─────────────────────────────────────────────────────────────
-- These tables are accessed via service role key (admin client),
-- so we enable RLS but allow service role to bypass.

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_visitor_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_discount_codes ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by backend)
CREATE POLICY "Service role full access on agent_conversations"
  ON public.agent_conversations FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on agent_visitor_memory"
  ON public.agent_visitor_memory FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on agent_discount_codes"
  ON public.agent_discount_codes FOR ALL
  USING (true) WITH CHECK (true);
