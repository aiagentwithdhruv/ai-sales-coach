-- ===========================================
-- Platform Restructuring: BYOAPI, Subscriptions, Usage, Admin
-- ===========================================
-- Supports: user-managed API keys, module-based subscriptions,
-- monthly usage tracking, and admin audit logging.

-- ─── User API Keys (encrypted) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN (
    'openai', 'anthropic', 'openrouter'
  )),
  encrypted_key TEXT NOT NULL,
  key_hint TEXT, -- Last 4 chars: "...xK9f"
  is_valid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own user_api_keys"
  ON public.user_api_keys FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access user_api_keys"
  ON public.user_api_keys FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ─── User Subscriptions ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'module', 'bundle')),
  modules TEXT[] NOT NULL DEFAULT '{}',
  billing_interval TEXT DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'quarterly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own user_subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access user_subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ─── User Usage (monthly tracking) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL, -- '2026-02'
  coaching_sessions INT NOT NULL DEFAULT 0,
  contacts_created INT NOT NULL DEFAULT 0,
  ai_calls_made INT NOT NULL DEFAULT 0,
  followups_sent INT NOT NULL DEFAULT 0,
  analyses_run INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own user_usage"
  ON public.user_usage FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access user_usage"
  ON public.user_usage FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ─── Admin Audit Log ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  target_email TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access admin_audit_log"
  ON public.admin_audit_log FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ─── Add trial tracking to user_credits ─────────────────────────────────────

ALTER TABLE public.user_credits ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
ALTER TABLE public.user_credits ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- ─── Auto-create subscription on signup ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_type, status, trial_ends_at, modules)
  VALUES (
    NEW.id,
    'free',
    'trial',
    NOW() + INTERVAL '15 days',
    ARRAY['coaching', 'crm', 'calling', 'followups', 'analytics']
  );

  -- Also set trial dates on credits
  UPDATE public.user_credits
  SET trial_started_at = NOW(), trial_ends_at = NOW() + INTERVAL '15 days'
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to avoid conflict with existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user ON public.user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month ON public.user_usage(user_id, month);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON public.admin_audit_log(created_at DESC);

-- ─── Grants ─────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_api_keys TO authenticated;
GRANT ALL ON public.user_api_keys TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.user_subscriptions TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_usage TO authenticated;
GRANT ALL ON public.user_usage TO service_role;
GRANT ALL ON public.admin_audit_log TO service_role;
