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
