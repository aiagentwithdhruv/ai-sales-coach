-- ============================================
-- 005: Teams, AI Calling, CRM Integrations
-- ============================================

-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT,
    invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teams_owner ON public.teams(owner_id);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Team owners can manage') THEN
        CREATE POLICY "Team owners can manage" ON public.teams FOR ALL USING (auth.uid() = owner_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Service role full access teams') THEN
        CREATE POLICY "Service role full access teams" ON public.teams FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END
$$;

-- Team members
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member')),
    display_name TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    sessions_count INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    badges TEXT[] NOT NULL DEFAULT '{}',
    last_active_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_score ON public.team_members(team_id, score DESC);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Users can view own team members') THEN
        CREATE POLICY "Users can view own team members" ON public.team_members FOR SELECT
            USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Service role full access team_members') THEN
        CREATE POLICY "Service role full access team_members" ON public.team_members FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END
$$;

-- AI Call Campaigns
CREATE TABLE IF NOT EXISTS public.ai_call_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('outbound', 'inbound')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    script TEXT,
    objective TEXT,
    voice_id TEXT DEFAULT 'alloy',
    phone_number TEXT,
    contact_list_filter JSONB DEFAULT '{}',
    settings JSONB NOT NULL DEFAULT '{"max_duration_seconds": 300, "transfer_enabled": false, "recording_enabled": true}',
    stats JSONB NOT NULL DEFAULT '{"total_calls": 0, "connected": 0, "meetings_booked": 0, "avg_duration": 0}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user ON public.ai_call_campaigns(user_id, created_at DESC);

ALTER TABLE public.ai_call_campaigns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_call_campaigns' AND policyname = 'Users own campaigns') THEN
        CREATE POLICY "Users own campaigns" ON public.ai_call_campaigns FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_call_campaigns' AND policyname = 'Service role full access campaigns') THEN
        CREATE POLICY "Service role full access campaigns" ON public.ai_call_campaigns FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END
$$;

-- AI Calls (individual call records)
CREATE TABLE IF NOT EXISTS public.ai_calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.ai_call_campaigns(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'voicemail')),
    phone_number TEXT,
    contact_name TEXT,
    duration_seconds INTEGER DEFAULT 0,
    recording_url TEXT,
    transcript TEXT,
    summary TEXT,
    outcome TEXT CHECK (outcome IN ('meeting_booked', 'callback_scheduled', 'interested', 'not_interested', 'wrong_number', 'voicemail', 'no_answer', NULL)),
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', NULL)),
    ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
    metadata JSONB NOT NULL DEFAULT '{}',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_calls_user ON public.ai_calls(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_calls_campaign ON public.ai_calls(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_calls_contact ON public.ai_calls(contact_id);

ALTER TABLE public.ai_calls ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_calls' AND policyname = 'Users own calls') THEN
        CREATE POLICY "Users own calls" ON public.ai_calls FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_calls' AND policyname = 'Service role full access ai_calls') THEN
        CREATE POLICY "Service role full access ai_calls" ON public.ai_calls FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END
$$;

-- CRM Integrations (external CRM connections)
CREATE TABLE IF NOT EXISTS public.crm_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('salesforce', 'hubspot', 'pipedrive', 'zoho')),
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'syncing')),
    access_token TEXT,
    refresh_token TEXT,
    instance_url TEXT,
    sync_config JSONB NOT NULL DEFAULT '{"contacts": true, "deals": true, "activities": true, "auto_sync": false, "sync_interval_hours": 24}',
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integrations_user ON public.crm_integrations(user_id);

ALTER TABLE public.crm_integrations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_integrations' AND policyname = 'Users own integrations') THEN
        CREATE POLICY "Users own integrations" ON public.crm_integrations FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_integrations' AND policyname = 'Service role full access integrations') THEN
        CREATE POLICY "Service role full access integrations" ON public.crm_integrations FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END
$$;
