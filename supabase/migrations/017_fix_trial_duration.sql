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
