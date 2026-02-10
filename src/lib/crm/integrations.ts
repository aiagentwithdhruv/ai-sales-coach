import { createClient } from "@supabase/supabase-js";
import type { CRMIntegration, IntegrationProvider } from "@/types/teams";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ---------- Get integrations ----------

export async function getIntegrations(userId: string): Promise<CRMIntegration[]> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("crm_integrations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data || []).map(stripTokens);
}

export async function getIntegration(
  userId: string,
  provider: IntegrationProvider
): Promise<CRMIntegration | null> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("crm_integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", provider)
    .single();
  return data ? stripTokens(data) : null;
}

// ---------- Connect / Disconnect ----------

export async function connectIntegration(
  userId: string,
  provider: IntegrationProvider,
  config?: { instance_url?: string; access_token?: string; refresh_token?: string }
): Promise<CRMIntegration | null> {
  const supabase = getAdmin();

  // Upsert: create or update
  const { data, error } = await supabase
    .from("crm_integrations")
    .upsert(
      {
        user_id: userId,
        provider,
        status: "connected",
        instance_url: config?.instance_url || null,
        access_token: config?.access_token || null,
        refresh_token: config?.refresh_token || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    )
    .select()
    .single();

  return error ? null : stripTokens(data);
}

export async function disconnectIntegration(
  userId: string,
  provider: IntegrationProvider
): Promise<boolean> {
  const supabase = getAdmin();
  const { error } = await supabase
    .from("crm_integrations")
    .update({
      status: "disconnected",
      access_token: null,
      refresh_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", provider);
  return !error;
}

// ---------- Sync Config ----------

export async function updateSyncConfig(
  userId: string,
  provider: IntegrationProvider,
  syncConfig: Partial<CRMIntegration["sync_config"]>
): Promise<boolean> {
  const supabase = getAdmin();
  const { data: existing } = await supabase
    .from("crm_integrations")
    .select("sync_config")
    .eq("user_id", userId)
    .eq("provider", provider)
    .single();

  if (!existing) return false;

  const merged = { ...existing.sync_config, ...syncConfig };
  const { error } = await supabase
    .from("crm_integrations")
    .update({ sync_config: merged, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("provider", provider);

  return !error;
}

// ---------- Sync trigger (mock) ----------

export async function triggerSync(
  userId: string,
  provider: IntegrationProvider
): Promise<{ synced: number; errors: number }> {
  const supabase = getAdmin();

  // Mark as syncing
  await supabase
    .from("crm_integrations")
    .update({ status: "syncing", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("provider", provider);

  // Mock sync — in production this would call the CRM API
  // Simulate a short delay worth of work
  const synced = Math.floor(Math.random() * 20) + 5;

  // Mark as connected + update last_sync_at
  await supabase
    .from("crm_integrations")
    .update({
      status: "connected",
      last_sync_at: new Date().toISOString(),
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", provider);

  return { synced, errors: 0 };
}

// ---------- Strip tokens from client response ----------

function stripTokens(integration: CRMIntegration): CRMIntegration {
  return {
    ...integration,
    // Never send tokens to client
    access_token: undefined as unknown as string,
    refresh_token: undefined as unknown as string,
  } as CRMIntegration;
}
