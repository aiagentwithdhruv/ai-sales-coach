/**
 * User API Key Management
 *
 * CRUD operations for user-provided API keys (BYOAPI).
 * Keys are encrypted at rest using AES-256-GCM.
 * Only AI provider keys are user-managed; infrastructure keys (Twilio, Deepgram, etc.)
 * are platform-managed via env vars.
 */

import { createClient } from "@supabase/supabase-js";
import { encrypt, decrypt, getKeyHint } from "./encryption";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// AI providers that users can manage
export const USER_MANAGED_PROVIDERS = ["openai", "anthropic", "openrouter", "perplexity", "tavily", "elevenlabs"] as const;
export type UserManagedProvider = (typeof USER_MANAGED_PROVIDERS)[number];

// Provider display info
export const PROVIDER_INFO: Record<UserManagedProvider, { name: string; helpUrl: string; placeholder: string }> = {
  openai: {
    name: "OpenAI",
    helpUrl: "https://platform.openai.com/api-keys",
    placeholder: "sk-proj-...",
  },
  anthropic: {
    name: "Anthropic",
    helpUrl: "https://console.anthropic.com/settings/keys",
    placeholder: "sk-ant-...",
  },
  openrouter: {
    name: "OpenRouter",
    helpUrl: "https://openrouter.ai/keys",
    placeholder: "sk-or-...",
  },
  perplexity: {
    name: "Perplexity",
    helpUrl: "https://www.perplexity.ai/settings/api",
    placeholder: "pplx-...",
  },
  tavily: {
    name: "Tavily",
    helpUrl: "https://app.tavily.com/home",
    placeholder: "tvly-...",
  },
  elevenlabs: {
    name: "ElevenLabs",
    helpUrl: "https://elevenlabs.io/app/settings/api-keys",
    placeholder: "xi-...",
  },
};

export interface UserKeyInfo {
  provider: UserManagedProvider;
  key_hint: string | null;
  is_valid: boolean;
  updated_at: string;
}

/**
 * Get all user API keys (hints only — never returns full keys)
 */
export async function getUserKeys(userId: string): Promise<UserKeyInfo[]> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("user_api_keys")
    .select("provider, key_hint, is_valid, updated_at")
    .eq("user_id", userId)
    .order("provider");

  return (data || []) as UserKeyInfo[];
}

/**
 * Set (add or update) a user API key.
 * Encrypts the key before storing.
 */
export async function setUserKey(
  userId: string,
  provider: UserManagedProvider,
  rawKey: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getAdmin();

  const encryptedKey = encrypt(rawKey);
  const hint = getKeyHint(rawKey);

  const { error } = await supabase
    .from("user_api_keys")
    .upsert(
      {
        user_id: userId,
        provider,
        encrypted_key: encryptedKey,
        key_hint: hint,
        is_valid: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Delete a user API key
 */
export async function deleteUserKey(
  userId: string,
  provider: UserManagedProvider
): Promise<boolean> {
  const supabase = getAdmin();
  const { error } = await supabase
    .from("user_api_keys")
    .delete()
    .eq("user_id", userId)
    .eq("provider", provider);
  return !error;
}

/**
 * Get a decrypted API key for a user (server-only — never expose to client)
 */
export async function getUserDecryptedKey(
  userId: string,
  provider: UserManagedProvider
): Promise<string | null> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("user_api_keys")
    .select("encrypted_key, is_valid")
    .eq("user_id", userId)
    .eq("provider", provider)
    .single();

  if (!data || !data.is_valid) return null;

  try {
    return decrypt(data.encrypted_key);
  } catch {
    // Mark key as invalid if decryption fails
    await supabase
      .from("user_api_keys")
      .update({ is_valid: false })
      .eq("user_id", userId)
      .eq("provider", provider);
    return null;
  }
}

/**
 * Validate an API key by making a lightweight test call to the provider
 */
export async function validateKey(
  provider: UserManagedProvider,
  rawKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    switch (provider) {
      case "openai": {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${rawKey}` },
        });
        if (res.ok) return { valid: true };
        const err = await res.json().catch(() => ({}));
        return { valid: false, error: err?.error?.message || `HTTP ${res.status}` };
      }

      case "anthropic": {
        // Use messages endpoint with minimal payload to test auth
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": rawKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1,
            messages: [{ role: "user", content: "hi" }],
          }),
        });
        // Both 200 and 400 (bad request) mean the key is valid — only 401 means invalid
        if (res.status === 401 || res.status === 403) {
          return { valid: false, error: "Invalid API key" };
        }
        return { valid: true };
      }

      case "openrouter": {
        const res = await fetch("https://openrouter.ai/api/v1/models", {
          headers: { Authorization: `Bearer ${rawKey}` },
        });
        if (res.ok) return { valid: true };
        return { valid: false, error: `HTTP ${res.status}` };
      }

      case "perplexity": {
        const res = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${rawKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [{ role: "user", content: "hi" }],
            max_tokens: 1,
          }),
        });
        if (res.status === 401 || res.status === 403) {
          return { valid: false, error: "Invalid API key" };
        }
        return { valid: true };
      }

      case "tavily": {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: rawKey, query: "test", max_results: 1 }),
        });
        if (res.status === 401 || res.status === 403) {
          return { valid: false, error: "Invalid API key" };
        }
        return { valid: true };
      }

      case "elevenlabs": {
        const res = await fetch("https://api.elevenlabs.io/v1/user", {
          headers: { "xi-api-key": rawKey },
        });
        if (res.ok) return { valid: true };
        if (res.status === 401) return { valid: false, error: "Invalid API key" };
        return { valid: false, error: `HTTP ${res.status}` };
      }

      default:
        return { valid: false, error: "Unknown provider" };
    }
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : "Validation failed" };
  }
}
