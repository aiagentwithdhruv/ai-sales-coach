/**
 * Item 22: Custom Loadout Builder
 *
 * Backend logic for customer-facing loadout builder UI.
 * Users can create, configure, and deploy their own agent loadouts:
 *   - Pick agents (scout, qualifier, outreach, closer, ops)
 *   - Configure each agent's behavior (prompts, channels, thresholds)
 *   - Set composition chain order
 *   - Preview and publish
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LoadoutConfig {
  id: string;
  userId: string;
  name: string;
  description: string;
  industry?: string;
  agents: AgentConfig[];
  chain: ChainConfig;
  settings: LoadoutSettings;
  status: "draft" | "active" | "published" | "archived";
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentConfig {
  type: "scout" | "researcher" | "qualifier" | "outreach" | "closer" | "ops" | "caller";
  enabled: boolean;
  config: {
    systemPrompt?: string;
    channels?: string[];
    threshold?: number;
    maxAttempts?: number;
    schedule?: string;
    customFields?: Record<string, unknown>;
  };
}

export interface ChainConfig {
  type: "full-autonomous" | "hybrid" | "inbound" | "re-engagement" | "custom";
  steps: Array<{
    agentType: string;
    action: string;
    condition?: string;
    delay?: number; // minutes
  }>;
}

export interface LoadoutSettings {
  timezone: string;
  businessHours: { start: number; end: number };
  maxContactsPerDay: number;
  channels: string[];
  notificationEmail?: string;
  webhookUrl?: string;
}

// ─── Available Agent Templates ──────────────────────────────────────────────

const AGENT_TEMPLATES: Record<string, Omit<AgentConfig, "enabled">> = {
  scout: {
    type: "scout",
    config: {
      channels: ["linkedin", "web"],
      maxAttempts: 100,
      customFields: { sources: ["linkedin", "apollo", "web_scraping"] },
    },
  },
  researcher: {
    type: "researcher",
    config: {
      channels: ["api"],
      customFields: { enrichSources: ["linkedin", "company_website", "news", "crunchbase"] },
    },
  },
  qualifier: {
    type: "qualifier",
    config: {
      threshold: 40,
      systemPrompt: "Qualify leads using BANT framework. Ask about Budget, Authority, Need, and Timeline.",
      customFields: { method: "bant_plus", minScore: 40 },
    },
  },
  outreach: {
    type: "outreach",
    config: {
      channels: ["email", "linkedin", "whatsapp"],
      maxAttempts: 7,
      schedule: "standard_b2b",
      customFields: { followUpDays: [1, 3, 7, 14, 21] },
    },
  },
  closer: {
    type: "closer",
    config: {
      channels: ["email", "call"],
      customFields: { proposalTemplate: "default", autoProposal: true },
    },
  },
  ops: {
    type: "ops",
    config: {
      channels: ["email"],
      customFields: { onboardingTemplate: "default", autoOnboard: true },
    },
  },
  caller: {
    type: "caller",
    config: {
      channels: ["phone"],
      maxAttempts: 3,
      schedule: "business_hours",
      customFields: { voiceProvider: "openai", maxDuration: 300 },
    },
  },
};

// ─── Create Loadout ─────────────────────────────────────────────────────────

export async function createLoadout(
  userId: string,
  params: {
    name: string;
    description?: string;
    industry?: string;
    agents?: string[]; // agent types to include
    chainType?: ChainConfig["type"];
  }
): Promise<LoadoutConfig> {
  const supabase = getAdmin();

  // Build agent configs from selected types
  const agentTypes = params.agents || ["researcher", "qualifier", "outreach", "closer"];
  const agents: AgentConfig[] = agentTypes.map((type) => ({
    ...AGENT_TEMPLATES[type] || AGENT_TEMPLATES.outreach,
    type: type as AgentConfig["type"],
    enabled: true,
  }));

  // Build default chain
  const chain: ChainConfig = {
    type: params.chainType || "full-autonomous",
    steps: agents.map((a) => ({
      agentType: a.type,
      action: getDefaultAction(a.type),
      delay: 0,
    })),
  };

  const settings: LoadoutSettings = {
    timezone: "America/New_York",
    businessHours: { start: 9, end: 17 },
    maxContactsPerDay: 50,
    channels: ["email", "linkedin"],
  };

  const { data } = await supabase
    .from("loadouts")
    .insert({
      user_id: userId,
      name: params.name,
      description: params.description || "",
      industry: params.industry || null,
      agents,
      chain,
      settings,
      status: "draft",
      version: 1,
    })
    .select("id, created_at")
    .single();

  return {
    id: data?.id || "",
    userId,
    name: params.name,
    description: params.description || "",
    industry: params.industry,
    agents,
    chain,
    settings,
    status: "draft",
    version: 1,
    createdAt: data?.created_at || new Date().toISOString(),
    updatedAt: data?.created_at || new Date().toISOString(),
  };
}

// ─── Update Loadout ─────────────────────────────────────────────────────────

export async function updateLoadout(
  userId: string,
  loadoutId: string,
  updates: Partial<{
    name: string;
    description: string;
    agents: AgentConfig[];
    chain: ChainConfig;
    settings: LoadoutSettings;
    status: LoadoutConfig["status"];
  }>
): Promise<boolean> {
  const supabase = getAdmin();

  const { error } = await supabase
    .from("loadouts")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", loadoutId)
    .eq("user_id", userId);

  return !error;
}

// ─── Activate Loadout ───────────────────────────────────────────────────────

export async function activateLoadout(
  userId: string,
  loadoutId: string
): Promise<boolean> {
  const supabase = getAdmin();

  // Deactivate other loadouts
  await supabase
    .from("loadouts")
    .update({ status: "draft" })
    .eq("user_id", userId)
    .eq("status", "active");

  // Activate this one
  const { error } = await supabase
    .from("loadouts")
    .update({ status: "active" })
    .eq("id", loadoutId)
    .eq("user_id", userId);

  return !error;
}

// ─── List / Get Loadouts ────────────────────────────────────────────────────

export async function listLoadouts(
  userId: string,
  filters?: { status?: string; industry?: string }
): Promise<LoadoutConfig[]> {
  const supabase = getAdmin();

  let query = supabase
    .from("loadouts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.industry) query = query.eq("industry", filters.industry);

  const { data } = await query;
  return (data || []).map(mapLoadout);
}

export async function getLoadout(
  userId: string,
  loadoutId: string
): Promise<LoadoutConfig | null> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("loadouts")
    .select("*")
    .eq("id", loadoutId)
    .eq("user_id", userId)
    .single();

  return data ? mapLoadout(data) : null;
}

// ─── Get Agent Templates ────────────────────────────────────────────────────

export function getAgentTemplates(): Array<{
  type: string;
  description: string;
  defaultChannels: string[];
}> {
  return [
    { type: "scout", description: "Find and import leads from various sources", defaultChannels: ["linkedin", "web"] },
    { type: "researcher", description: "Enrich contacts with company data, social profiles, and news", defaultChannels: ["api"] },
    { type: "qualifier", description: "Qualify leads with BANT+ scoring conversations", defaultChannels: ["chat"] },
    { type: "outreach", description: "Multi-channel outreach sequences (email, LinkedIn, WhatsApp)", defaultChannels: ["email", "linkedin", "whatsapp"] },
    { type: "closer", description: "Generate proposals and handle deal closing", defaultChannels: ["email", "call"] },
    { type: "ops", description: "Client onboarding and post-sale automation", defaultChannels: ["email"] },
    { type: "caller", description: "Autonomous AI phone calls for sales and follow-ups", defaultChannels: ["phone"] },
  ];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDefaultAction(agentType: string): string {
  const actions: Record<string, string> = {
    scout: "find_leads",
    researcher: "enrich_contact",
    qualifier: "qualify_bant",
    outreach: "enroll_sequence",
    closer: "generate_proposal",
    ops: "onboard_client",
    caller: "autonomous_call",
  };
  return actions[agentType] || "process";
}

function mapLoadout(data: Record<string, unknown>): LoadoutConfig {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    name: data.name as string,
    description: data.description as string,
    industry: data.industry as string | undefined,
    agents: data.agents as AgentConfig[],
    chain: data.chain as ChainConfig,
    settings: data.settings as LoadoutSettings,
    status: data.status as LoadoutConfig["status"],
    version: data.version as number,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}
