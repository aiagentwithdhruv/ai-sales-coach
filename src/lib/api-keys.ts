/**
 * Public API Key System
 *
 * Allows developers to authenticate via API keys instead of
 * Bearer tokens. Each key is scoped to a user and has:
 *   - Rate limiting (per tier)
 *   - Usage tracking
 *   - Revocation
 *   - Optional IP whitelist
 *
 * Key format: qh_live_<random32chars> or qh_test_<random32chars>
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes, createHash } from "crypto";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string; // First 8 chars shown in UI
  key_hash: string; // SHA-256 hash for lookup
  environment: "live" | "test";
  scopes: string[];
  rate_limit: number; // requests per minute
  ip_whitelist: string[] | null;
  last_used_at: string | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface ApiKeyCreateResult {
  key: string; // Only returned once on creation
  id: string;
  name: string;
  key_prefix: string;
  environment: "live" | "test";
}

// ─── Rate Limits by Tier ───────────────────────────────────────────────────

const TIER_RATE_LIMITS: Record<string, number> = {
  starter: 60, // 60 req/min
  growth: 300, // 300 req/min
  enterprise: 1000, // 1000 req/min
  free: 10, // 10 req/min
};

const DEFAULT_SCOPES = [
  "contacts:read",
  "contacts:write",
  "leads:read",
  "analytics:read",
  "campaigns:read",
  "campaigns:write",
];

// ─── Core Functions ────────────────────────────────────────────────────────

/**
 * Generate a new API key for a user.
 */
export async function createApiKey(
  userId: string,
  name: string,
  options?: {
    environment?: "live" | "test";
    scopes?: string[];
    ipWhitelist?: string[];
    expiresInDays?: number;
  }
): Promise<ApiKeyCreateResult> {
  const supabase = getAdmin();
  const env = options?.environment || "live";

  // Generate the key
  const randomPart = randomBytes(32).toString("hex");
  const key = `qh_${env}_${randomPart}`;
  const keyPrefix = key.substring(0, 12);
  const keyHash = createHash("sha256").update(key).digest("hex");

  // Get user's tier for rate limit
  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("plan_type")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  const tier = sub?.plan_type || "free";
  const rateLimit = TIER_RATE_LIMITS[tier] || TIER_RATE_LIMITS.free;

  const expiresAt = options?.expiresInDays
    ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("developer_api_keys")
    .insert({
      user_id: userId,
      name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      environment: env,
      scopes: options?.scopes || DEFAULT_SCOPES,
      rate_limit: rateLimit,
      ip_whitelist: options?.ipWhitelist || null,
      is_active: true,
      usage_count: 0,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create API key: ${error.message}`);

  return {
    key, // Only returned here, never stored in plaintext
    id: data.id,
    name,
    key_prefix: keyPrefix,
    environment: env,
  };
}

/**
 * Validate an API key and return the associated user.
 */
export async function validateApiKey(
  key: string
): Promise<{
  valid: boolean;
  userId?: string;
  scopes?: string[];
  error?: string;
}> {
  if (!key.startsWith("qh_")) {
    return { valid: false, error: "Invalid API key format" };
  }

  const keyHash = createHash("sha256").update(key).digest("hex");
  const supabase = getAdmin();

  const { data: apiKey } = await supabase
    .from("developer_api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .single();

  if (!apiKey) {
    return { valid: false, error: "Invalid or revoked API key" };
  }

  // Check expiry
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return { valid: false, error: "API key expired" };
  }

  // Update usage stats
  await supabase
    .from("developer_api_keys")
    .update({
      last_used_at: new Date().toISOString(),
      usage_count: (apiKey.usage_count || 0) + 1,
    })
    .eq("id", apiKey.id);

  return {
    valid: true,
    userId: apiKey.user_id,
    scopes: apiKey.scopes,
  };
}

/**
 * List all API keys for a user (without showing the actual key).
 */
export async function listApiKeys(
  userId: string
): Promise<Omit<ApiKey, "key_hash">[]> {
  const supabase = getAdmin();

  const { data } = await supabase
    .from("developer_api_keys")
    .select("id, user_id, name, key_prefix, environment, scopes, rate_limit, ip_whitelist, last_used_at, usage_count, is_active, created_at, expires_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data || [];
}

/**
 * Revoke (deactivate) an API key.
 */
export async function revokeApiKey(
  userId: string,
  keyId: string
): Promise<boolean> {
  const supabase = getAdmin();

  const { error } = await supabase
    .from("developer_api_keys")
    .update({ is_active: false })
    .eq("id", keyId)
    .eq("user_id", userId);

  return !error;
}

/**
 * Middleware: Authenticate via API key or Bearer token.
 * Returns userId and scopes if valid.
 */
export async function authenticateRequest(
  authHeader: string | null,
  apiKeyHeader?: string | null
): Promise<{
  authenticated: boolean;
  userId?: string;
  scopes?: string[];
  method: "bearer" | "api_key" | "none";
  error?: string;
}> {
  // Try API key first (X-Api-Key header)
  if (apiKeyHeader) {
    const result = await validateApiKey(apiKeyHeader);
    if (result.valid) {
      return {
        authenticated: true,
        userId: result.userId,
        scopes: result.scopes,
        method: "api_key",
      };
    }
    return { authenticated: false, method: "api_key", error: result.error };
  }

  // Fall back to Bearer token
  if (authHeader?.startsWith("Bearer ")) {
    const supabase = getAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (error || !user) {
      return { authenticated: false, method: "bearer", error: "Invalid token" };
    }
    return {
      authenticated: true,
      userId: user.id,
      scopes: DEFAULT_SCOPES,
      method: "bearer",
    };
  }

  return { authenticated: false, method: "none", error: "No authentication provided" };
}
