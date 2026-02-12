/**
 * API Key Resolver
 *
 * Determines which API key to use for a given user and provider:
 * 1. Infrastructure keys (twilio, deepgram, resend) → always platform env vars
 * 2. AI/Search/Voice keys (openai, anthropic, openrouter, perplexity, tavily, elevenlabs):
 *    a. User's own key if they've added one
 *    b. Platform key if user is within 15-day trial
 *    c. null if trial expired and no user key → "Add your API key"
 */

import { createClient } from "@supabase/supabase-js";
import { getUserDecryptedKey, type UserManagedProvider } from "@/lib/user-keys";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// Infrastructure providers — always use platform keys
const INFRA_PROVIDERS = ["twilio", "deepgram", "resend"] as const;

// Map provider to env var name
const PLATFORM_KEY_MAP: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  perplexity: "PERPLEXITY_API_KEY",
  tavily: "TAVILY_API_KEY",
  elevenlabs: "ELEVENLABS_API_KEY",
  twilio_sid: "TWILIO_ACCOUNT_SID",
  twilio_token: "TWILIO_AUTH_TOKEN",
  deepgram: "DEEPGRAM_API_KEY",
  resend: "RESEND_API_KEY",
};

export interface ResolvedKeys {
  openai?: string;
  anthropic?: string;
  openrouter?: string;
  perplexity?: string;
  tavily?: string;
  elevenlabs?: string;
  source: "user" | "platform" | "trial";
}

/**
 * Check if a user is currently within their 15-day trial
 */
async function isUserOnTrial(userId: string): Promise<boolean> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("user_subscriptions")
    .select("status, trial_ends_at")
    .eq("user_id", userId)
    .single();

  if (!data) {
    return false;
  }

  if (data.status === "trial" && data.trial_ends_at) {
    return new Date(data.trial_ends_at) > new Date();
  }

  // Active paid subscription can use platform keys too
  if (data.status === "active") {
    return true; // Paid users don't need trial check
  }

  return false;
}

/**
 * Check if user has an active paid subscription
 */
async function hasActiveSubscription(userId: string): Promise<boolean> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("user_subscriptions")
    .select("status")
    .eq("user_id", userId)
    .single();

  return data?.status === "active";
}

/**
 * Resolve all AI API keys for a user.
 * Returns keys to use for OpenAI, Anthropic, and OpenRouter.
 */
export async function resolveUserKeys(userId: string): Promise<ResolvedKeys> {
  const providers: UserManagedProvider[] = ["openai", "anthropic", "openrouter", "perplexity", "tavily", "elevenlabs"];
  const keys: ResolvedKeys = { source: "platform" };

  // Check user's own keys first
  let hasAnyUserKey = false;
  for (const provider of providers) {
    const userKey = await getUserDecryptedKey(userId, provider);
    if (userKey) {
      keys[provider] = userKey;
      hasAnyUserKey = true;
    }
  }

  if (hasAnyUserKey) {
    keys.source = "user";
    // Fill missing providers with platform keys if user has active subscription or trial
    const canUsePlatform = await isUserOnTrial(userId) || await hasActiveSubscription(userId);
    for (const provider of providers) {
      if (!keys[provider] && canUsePlatform) {
        const envKey = process.env[PLATFORM_KEY_MAP[provider]];
        if (envKey) keys[provider] = envKey;
      }
    }
    return keys;
  }

  // No user keys — check trial status
  const onTrial = await isUserOnTrial(userId);

  if (onTrial) {
    keys.source = "trial";
    for (const provider of providers) {
      const envKey = process.env[PLATFORM_KEY_MAP[provider]];
      if (envKey) keys[provider] = envKey;
    }
    return keys;
  }

  // Check active paid subscription
  const hasPaid = await hasActiveSubscription(userId);
  if (hasPaid) {
    // Paid subscribers without their own keys still need to add them
    // But we allow a grace period — use platform keys
    keys.source = "platform";
    for (const provider of providers) {
      const envKey = process.env[PLATFORM_KEY_MAP[provider]];
      if (envKey) keys[provider] = envKey;
    }
    return keys;
  }

  // Trial expired, no keys, no subscription — return empty
  keys.source = "platform";
  return keys;
}

/**
 * Resolve a specific provider key for a user.
 * For infrastructure providers, always returns the platform key.
 */
export async function resolveApiKey(
  userId: string,
  provider: string
): Promise<{ key: string | null; source: "user" | "platform" | "trial"; error?: string }> {
  // Infrastructure providers always use platform keys
  if (INFRA_PROVIDERS.includes(provider as typeof INFRA_PROVIDERS[number])) {
    const envKey = process.env[PLATFORM_KEY_MAP[provider]];
    return { key: envKey || null, source: "platform" };
  }

  // AI provider — check user key first
  const userKey = await getUserDecryptedKey(userId, provider as UserManagedProvider);
  if (userKey) {
    return { key: userKey, source: "user" };
  }

  // Check trial
  const onTrial = await isUserOnTrial(userId);
  if (onTrial) {
    const envKey = process.env[PLATFORM_KEY_MAP[provider]];
    return { key: envKey || null, source: "trial" };
  }

  // Check paid subscription
  const hasPaid = await hasActiveSubscription(userId);
  if (hasPaid) {
    const envKey = process.env[PLATFORM_KEY_MAP[provider]];
    return { key: envKey || null, source: "platform" };
  }

  // No key, no trial, no subscription
  return {
    key: null,
    source: "platform",
    error: "Trial expired. Add your API key in Settings to continue using AI features.",
  };
}
