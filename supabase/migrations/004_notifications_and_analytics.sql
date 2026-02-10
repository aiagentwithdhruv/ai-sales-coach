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
