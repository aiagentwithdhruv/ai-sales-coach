/**
 * Usage Tracking System
 *
 * Replaces the old credits system with per-module usage tracking.
 * Checks usage against limits based on subscription tier (free vs paid).
 * Free users get tight limits; paid users get unlimited.
 */

import { createClient } from "@supabase/supabase-js";
import { FREE_LIMITS, PAID_LIMITS, TIER_LIMITS, type UsageLimits, type TierSlug } from "./pricing";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// Map module usage field to column name in user_usage table
export type UsageModule = "coaching_sessions" | "contacts_created" | "ai_calls_made" | "followups_sent" | "analyses_run";

// Friendly names for UI
export const USAGE_LABELS: Record<UsageModule, string> = {
  coaching_sessions: "Coaching Sessions",
  contacts_created: "Contacts",
  ai_calls_made: "AI Calls",
  followups_sent: "Follow-ups Sent",
  analyses_run: "Analyses",
};

export interface UsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number; // -1 = unlimited
  remaining: number; // -1 = unlimited
  error?: string;
}

export interface UsageSummary {
  coaching_sessions: { used: number; limit: number };
  contacts_created: { used: number; limit: number };
  ai_calls_made: { used: number; limit: number };
  followups_sent: { used: number; limit: number };
  analyses_run: { used: number; limit: number };
  is_trial: boolean;
  trial_ends_at: string | null;
  plan_type: string;
}

/**
 * Get the current month string (e.g., "2026-02")
 */
function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Get usage limits for a user based on their subscription
 */
export async function getUsageLimits(userId: string): Promise<UsageLimits & { is_trial: boolean; trial_ends_at: string | null; plan_type: string }> {
  const supabase = getAdmin();

  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("plan_type, status, trial_ends_at")
    .eq("user_id", userId)
    .single();

  if (!sub) {
    // No subscription record — free tier
    return { ...FREE_LIMITS, is_trial: false, trial_ends_at: null, plan_type: "free" };
  }

  const isOnTrial = sub.status === "trial" && sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date();
  const isActive = sub.status === "active";

  if (isOnTrial) {
    // Trial users get full access (enterprise-level limits)
    return { ...PAID_LIMITS, is_trial: true, trial_ends_at: sub.trial_ends_at, plan_type: sub.plan_type || "free" };
  }

  // Check tier-specific limits (starter, growth, enterprise)
  const tierSlug = sub.plan_type as TierSlug;
  if (isActive && TIER_LIMITS[tierSlug]) {
    return { ...TIER_LIMITS[tierSlug], is_trial: false, trial_ends_at: null, plan_type: tierSlug };
  }

  // Legacy: module/bundle plans get enterprise-level limits
  if (isActive && (sub.plan_type === "module" || sub.plan_type === "bundle")) {
    return { ...PAID_LIMITS, is_trial: false, trial_ends_at: null, plan_type: sub.plan_type };
  }

  // Free tier (trial expired, no active subscription)
  return { ...FREE_LIMITS, is_trial: false, trial_ends_at: sub.trial_ends_at, plan_type: "free" };
}

/**
 * Get or create usage record for current month
 */
async function getOrCreateUsage(userId: string): Promise<Record<string, number>> {
  const supabase = getAdmin();
  const month = getCurrentMonth();

  const { data } = await supabase
    .from("user_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  if (data) return data;

  // Create new record for this month
  const { data: created } = await supabase
    .from("user_usage")
    .insert({
      user_id: userId,
      month,
      coaching_sessions: 0,
      contacts_created: 0,
      ai_calls_made: 0,
      followups_sent: 0,
      analyses_run: 0,
    })
    .select()
    .single();

  return created || {
    coaching_sessions: 0,
    contacts_created: 0,
    ai_calls_made: 0,
    followups_sent: 0,
    analyses_run: 0,
  };
}

/**
 * Check if user can perform an action (has usage remaining)
 */
export async function checkUsage(
  userId: string,
  module: UsageModule,
  amount: number = 1
): Promise<UsageCheckResult> {
  const limits = await getUsageLimits(userId);
  const limit = limits[module];

  // Unlimited
  if (limit === -1) {
    return { allowed: true, used: 0, limit: -1, remaining: -1 };
  }

  const usage = await getOrCreateUsage(userId);
  const used = usage[module] || 0;
  const remaining = Math.max(0, limit - used);

  if (remaining < amount) {
    return {
      allowed: false,
      used,
      limit,
      remaining,
      error: `${USAGE_LABELS[module]} limit reached (${used}/${limit}). Upgrade to continue.`,
    };
  }

  return { allowed: true, used, limit, remaining };
}

/**
 * Increment usage for a module
 */
export async function incrementUsage(
  userId: string,
  module: UsageModule,
  amount: number = 1
): Promise<{ success: boolean; used: number; error?: string }> {
  const supabase = getAdmin();
  const month = getCurrentMonth();

  // Ensure record exists
  await getOrCreateUsage(userId);

  // Increment the counter
  const { data, error } = await supabase.rpc("increment_usage", {
    p_user_id: userId,
    p_month: month,
    p_column: module,
    p_amount: amount,
  });

  // Fallback if RPC doesn't exist yet — manual increment
  if (error) {
    const usage = await getOrCreateUsage(userId);
    const currentValue = usage[module] || 0;

    const { error: updateError } = await supabase
      .from("user_usage")
      .update({
        [module]: currentValue + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("month", month);

    if (updateError) {
      return { success: false, used: currentValue, error: updateError.message };
    }

    return { success: true, used: currentValue + amount };
  }

  return { success: true, used: data || 0 };
}

/**
 * Get full usage summary for a user (for dashboard/settings display)
 */
export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const limits = await getUsageLimits(userId);
  const usage = await getOrCreateUsage(userId);

  return {
    coaching_sessions: { used: usage.coaching_sessions || 0, limit: limits.coaching_sessions },
    contacts_created: { used: usage.contacts_created || 0, limit: limits.contacts_created },
    ai_calls_made: { used: usage.ai_calls_made || 0, limit: limits.ai_calls_made },
    followups_sent: { used: usage.followups_sent || 0, limit: limits.followups_sent },
    analyses_run: { used: usage.analyses_run || 0, limit: limits.analyses_run },
    is_trial: limits.is_trial,
    trial_ends_at: limits.trial_ends_at,
    plan_type: limits.plan_type,
  };
}
