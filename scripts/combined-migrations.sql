-- ============================================
-- QuotaHit Combined Database Migrations
-- Generated: Fri Feb 27 13:12:22 IST 2026
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================

-- ============================================
-- Migration: 001_user_credits.sql
-- ============================================
-- ===========================================
-- User Credits System
-- ===========================================
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vbdgcywdzhlnlvdsiokf/sql

-- Create user_credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  credits INTEGER NOT NULL DEFAULT 5,
  total_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own credits
CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for API routes)
CREATE POLICY "Service role full access" ON public.user_credits
  FOR ALL USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);

-- Function to automatically create credits record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits, total_used)
  VALUES (NEW.id, 5, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON public.user_credits;
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.user_credits TO authenticated;
GRANT ALL ON public.user_credits TO service_role;


-- ============================================
-- Migration: 002_crm_contacts.sql
-- ============================================
-- ===========================================
-- CRM Contacts System
-- ===========================================
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vbdgcywdzhlnlvdsiokf/sql

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Core fields (minimal input)
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,

  -- Pipeline
  deal_stage TEXT NOT NULL DEFAULT 'new'
    CHECK (deal_stage IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  deal_value DECIMAL(12,2) DEFAULT 0,
  probability INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),

  -- AI-powered fields
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  source TEXT DEFAULT 'manual',

  -- Communication preferences
  do_not_call BOOLEAN DEFAULT false,
  do_not_email BOOLEAN DEFAULT false,

  -- Dates
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  expected_close_date DATE,

  -- Flexible storage
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,

  -- AI enrichment cache
  enrichment_data JSONB DEFAULT '{}',
  enrichment_status TEXT DEFAULT 'pending'
    CHECK (enrichment_status IN ('pending', 'enriching', 'enriched', 'failed')),
  enriched_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own contacts" ON public.contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts" ON public.contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts" ON public.contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts" ON public.contacts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access contacts" ON public.contacts
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_stage ON public.contacts(user_id, deal_stage);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts(user_id, company);
CREATE INDEX IF NOT EXISTS idx_contacts_next_followup ON public.contacts(user_id, next_follow_up_at)
  WHERE next_follow_up_at IS NOT NULL;

-- Auto-update updated_at (reuses function from 001_user_credits.sql)
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;


-- ============================================
-- Migration: 003_crm_activities.sql
-- ============================================
-- ===========================================
-- CRM Activity Timeline
-- ===========================================
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vbdgcywdzhlnlvdsiokf/sql

-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,

  -- Activity type
  type TEXT NOT NULL CHECK (type IN (
    'note',
    'call',
    'email_sent',
    'email_opened',
    'meeting',
    'research',
    'quote_sent',
    'stage_change',
    'score_change',
    'enrichment',
    'practice',
    'task',
    'system'
  )),

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own activities" ON public.activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities" ON public.activities
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access activities" ON public.activities
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activities_contact ON public.activities(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user ON public.activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(contact_id, type);

-- Permissions
GRANT SELECT, INSERT, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;


-- ============================================
-- Migration: 004_notifications_and_analytics.sql
-- ============================================
-- ============================================
-- 004: Notifications + Analytics Tracking
-- ============================================

-- Notifications table (smart alerts for stalled deals, follow-up reminders, etc.)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'stalled_deal', 'follow_up_due', 'follow_up_overdue',
        'deal_at_risk', 'stage_suggestion', 'win_congratulation',
        'lost_review', 'inactivity_warning', 'score_drop', 'system'
    )),
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical', 'success')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_contact ON public.notifications(contact_id);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view own notifications') THEN
        CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update own notifications') THEN
        CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Service role full access notifications') THEN
        CREATE POLICY "Service role full access notifications" ON public.notifications FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END
$$;

-- Deal stage history (for analytics: conversion funnels, velocity tracking)
CREATE TABLE IF NOT EXISTS public.deal_stage_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    from_stage TEXT,
    to_stage TEXT NOT NULL,
    deal_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stage_history_user ON public.deal_stage_history(user_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_stage_history_contact ON public.deal_stage_history(contact_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_stage_history_stages ON public.deal_stage_history(user_id, from_stage, to_stage);

ALTER TABLE public.deal_stage_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deal_stage_history' AND policyname = 'Users can view own stage history') THEN
        CREATE POLICY "Users can view own stage history" ON public.deal_stage_history FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deal_stage_history' AND policyname = 'Service role full access stage history') THEN
        CREATE POLICY "Service role full access stage history" ON public.deal_stage_history FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END
$$;


-- ============================================
-- Migration: 005_tier3_teams_calling_integrations.sql
-- ============================================
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


-- ============================================
-- Migration: 006_ai_agents_phone_numbers.sql
-- ============================================
-- ============================================
-- 006: AI Agents, Phone Numbers, Call Enhancements
-- ============================================

-- AI Agents (configurable AI personalities for calls)
CREATE TABLE IF NOT EXISTS public.ai_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    -- Voice & Language
    voice_provider TEXT NOT NULL DEFAULT 'openai' CHECK (voice_provider IN ('openai', 'elevenlabs')),
    voice_id TEXT NOT NULL DEFAULT 'alloy',
    language TEXT NOT NULL DEFAULT 'en',
    -- AI Configuration
    system_prompt TEXT NOT NULL DEFAULT 'You are a professional sales representative.',
    greeting TEXT NOT NULL DEFAULT 'Hi, this is {{agent_name}} calling from {{company}}. How are you today?',
    model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    temperature NUMERIC(3,2) NOT NULL DEFAULT 0.7,
    max_tokens INTEGER NOT NULL DEFAULT 150,
    -- Behavior
    objective TEXT, -- e.g. "Book a demo meeting"
    knowledge_base JSONB NOT NULL DEFAULT '[]', -- [{source, content, type}]
    tools_enabled JSONB NOT NULL DEFAULT '["transfer_call","book_meeting","send_sms"]',
    objection_responses JSONB NOT NULL DEFAULT '{}', -- {"too expensive": "I understand..."}
    -- Call Settings
    max_call_duration_seconds INTEGER NOT NULL DEFAULT 300,
    silence_timeout_seconds INTEGER NOT NULL DEFAULT 10,
    interrupt_sensitivity TEXT NOT NULL DEFAULT 'medium' CHECK (interrupt_sensitivity IN ('low', 'medium', 'high')),
    end_call_phrases TEXT[] NOT NULL DEFAULT ARRAY['goodbye', 'not interested', 'stop calling'],
    -- Template
    template_id TEXT, -- null = custom, else: 'cold_call', 'qualification', 'booking', etc.
    is_active BOOLEAN NOT NULL DEFAULT true,
    -- Meta
    total_calls INTEGER NOT NULL DEFAULT 0,
    avg_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_agents_user ON public.ai_agents(user_id);

ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_agents' AND policyname = 'Users own agents') THEN
        CREATE POLICY "Users own agents" ON public.ai_agents FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_agents' AND policyname = 'Service role full access ai_agents') THEN
        CREATE POLICY "Service role full access ai_agents" ON public.ai_agents FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END
$$;

-- Phone Numbers (Twilio numbers owned by user)
CREATE TABLE IF NOT EXISTS public.phone_numbers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL UNIQUE,
    friendly_name TEXT,
    provider TEXT NOT NULL DEFAULT 'twilio' CHECK (provider IN ('twilio', 'exotel')),
    twilio_sid TEXT,
    country_code TEXT NOT NULL DEFAULT 'US',
    capabilities JSONB NOT NULL DEFAULT '{"voice": true, "sms": true}',
    -- Assignment
    assigned_agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    -- Usage tracking
    total_calls INTEGER NOT NULL DEFAULT 0,
    monthly_calls INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    -- Meta
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_user ON public.phone_numbers(user_id);

ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'phone_numbers' AND policyname = 'Users own phone_numbers') THEN
        CREATE POLICY "Users own phone_numbers" ON public.phone_numbers FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'phone_numbers' AND policyname = 'Service role full access phone_numbers') THEN
        CREATE POLICY "Service role full access phone_numbers" ON public.phone_numbers FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END
$$;

-- Add missing columns to ai_calls
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_calls' AND column_name = 'agent_id') THEN
        ALTER TABLE public.ai_calls ADD COLUMN agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_calls' AND column_name = 'phone_number_id') THEN
        ALTER TABLE public.ai_calls ADD COLUMN phone_number_id UUID REFERENCES public.phone_numbers(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_calls' AND column_name = 'twilio_call_sid') THEN
        ALTER TABLE public.ai_calls ADD COLUMN twilio_call_sid TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_calls' AND column_name = 'from_number') THEN
        ALTER TABLE public.ai_calls ADD COLUMN from_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_calls' AND column_name = 'to_number') THEN
        ALTER TABLE public.ai_calls ADD COLUMN to_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_calls' AND column_name = 'answered_at') THEN
        ALTER TABLE public.ai_calls ADD COLUMN answered_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_calls' AND column_name = 'cost_breakdown') THEN
        ALTER TABLE public.ai_calls ADD COLUMN cost_breakdown JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_calls' AND column_name = 'score_breakdown') THEN
        ALTER TABLE public.ai_calls ADD COLUMN score_breakdown JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_calls' AND column_name = 'transcript_json') THEN
        ALTER TABLE public.ai_calls ADD COLUMN transcript_json JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_calls' AND column_name = 'objections_detected') THEN
        ALTER TABLE public.ai_calls ADD COLUMN objections_detected TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_calls' AND column_name = 'key_topics') THEN
        ALTER TABLE public.ai_calls ADD COLUMN key_topics TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_calls' AND column_name = 'next_steps') THEN
        ALTER TABLE public.ai_calls ADD COLUMN next_steps TEXT;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_ai_calls_agent ON public.ai_calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_calls_twilio ON public.ai_calls(twilio_call_sid);

-- Add missing columns to ai_call_campaigns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_call_campaigns' AND column_name = 'agent_id') THEN
        ALTER TABLE public.ai_call_campaigns ADD COLUMN agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_call_campaigns' AND column_name = 'schedule') THEN
        ALTER TABLE public.ai_call_campaigns ADD COLUMN schedule JSONB DEFAULT '{"timezone": "UTC", "days": [1,2,3,4,5], "start_hour": 9, "end_hour": 18}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_call_campaigns' AND column_name = 'max_concurrent') THEN
        ALTER TABLE public.ai_call_campaigns ADD COLUMN max_concurrent INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_call_campaigns' AND column_name = 'retry_attempts') THEN
        ALTER TABLE public.ai_call_campaigns ADD COLUMN retry_attempts INTEGER DEFAULT 3;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_call_campaigns' AND column_name = 'retry_delay_minutes') THEN
        ALTER TABLE public.ai_call_campaigns ADD COLUMN retry_delay_minutes INTEGER DEFAULT 60;
    END IF;
END
$$;


-- ============================================
-- Migration: 007_external_id.sql
-- ============================================
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


-- ============================================
-- Migration: 008_follow_up_automation.sql
-- ============================================
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


-- ============================================
-- Migration: 009_platform_restructuring.sql
-- ============================================
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
    'openai', 'anthropic', 'openrouter', 'perplexity', 'tavily', 'elevenlabs'
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


-- ============================================
-- Migration: 010_agent_system.sql
-- ============================================
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


-- ============================================
-- Migration: 011_agent_visitor_phone.sql
-- ============================================
-- Add phone column to agent_visitor_memory
ALTER TABLE agent_visitor_memory ADD COLUMN IF NOT EXISTS phone TEXT;


-- ============================================
-- Migration: 012_consent_audit.sql
-- ============================================
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


-- ============================================
-- Migration: 013_outreach_channels.sql
-- ============================================
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


-- ============================================
-- Migration: 014_phase3_brain.sql
-- ============================================
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


-- ============================================
-- Migration: 015_phase4_closer.sql
-- ============================================
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


-- ============================================
-- Migration: 016_phase5_marketplace.sql
-- ============================================
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


-- ============================================
-- Migration: 017_fix_trial_duration.sql
-- ============================================
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


-- ============================================
-- Migration: 018_blog_posts.sql
-- ============================================
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


-- ============================================
-- Migration: 019_telegram_linking.sql
-- ============================================
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


-- ============================================
-- Migration: 020_deal_attribution.sql
-- ============================================
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


-- ============================================
-- Migration: 021_developer_api_keys.sql
-- ============================================
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


-- ============================================
-- ALL MIGRATIONS APPLIED SUCCESSFULLY
-- ============================================
