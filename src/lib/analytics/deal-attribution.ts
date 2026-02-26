/**
 * Deal Attribution Engine
 *
 * Tracks which AI agent contributed to each deal stage transition.
 * Enables per-agent ROI calculation and commission attribution.
 *
 * Attribution Model:
 *   - First-touch: Agent that created/discovered the contact
 *   - Multi-touch: All agents that interacted before close
 *   - Weighted: Time-decay model, recent touches get more credit
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ─────────────────────────────────────────────────────────────────

export type AgentType =
  | "scout"
  | "researcher"
  | "qualifier"
  | "outreach"
  | "caller"
  | "closer"
  | "ops"
  | "manual";

export interface TouchPoint {
  id?: string;
  contact_id: string;
  user_id: string;
  agent_type: AgentType;
  action: string; // e.g., "discovered_lead", "made_call", "sent_email"
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface Attribution {
  agent_type: AgentType;
  agent_label: string;
  touch_count: number;
  first_touch: boolean;
  last_touch: boolean;
  credit_percent: number; // 0-100
  credit_value: number; // dollar amount
}

export interface DealAttribution {
  contact_id: string;
  contact_name: string;
  company: string;
  deal_value: number;
  deal_stage: string;
  attributions: Attribution[];
  total_touches: number;
  days_to_close: number;
}

const AGENT_LABELS: Record<AgentType, string> = {
  scout: "Lead Finder",
  researcher: "Intel Analyst",
  qualifier: "Gatekeeper",
  outreach: "Outreach Rep",
  caller: "AI Caller",
  closer: "Deal Closer",
  ops: "Ops Manager",
  manual: "Manual Action",
};

// ─── Core Functions ────────────────────────────────────────────────────────

/**
 * Record an agent touchpoint on a contact.
 * Call this whenever an AI agent interacts with a lead.
 */
export async function recordTouchpoint(touch: TouchPoint): Promise<void> {
  const supabase = getAdmin();

  await supabase.from("agent_touchpoints").insert({
    contact_id: touch.contact_id,
    user_id: touch.user_id,
    agent_type: touch.agent_type,
    action: touch.action,
    metadata: touch.metadata || {},
    created_at: new Date().toISOString(),
  });
}

/**
 * Calculate attribution for a single deal using weighted multi-touch model.
 */
export async function calculateAttribution(
  contactId: string,
  userId: string
): Promise<DealAttribution | null> {
  const supabase = getAdmin();

  // Get contact
  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .eq("user_id", userId)
    .single();

  if (!contact) return null;

  // Get all touchpoints for this contact
  const { data: touchpoints } = await supabase
    .from("agent_touchpoints")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: true });

  if (!touchpoints || touchpoints.length === 0) {
    return {
      contact_id: contactId,
      contact_name: `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
      company: contact.company || "Unknown",
      deal_value: contact.deal_value || 0,
      deal_stage: contact.deal_stage || "new",
      attributions: [],
      total_touches: 0,
      days_to_close: 0,
    };
  }

  // Calculate time-decay weighted attribution
  const dealValue = contact.deal_value || 0;
  const now = Date.now();
  const firstTouch = new Date(touchpoints[0].created_at).getTime();
  const lastTouch = new Date(touchpoints[touchpoints.length - 1].created_at).getTime();
  const timeRange = lastTouch - firstTouch || 1;

  // Group by agent type with time-decay weights
  const agentWeights: Record<string, { count: number; totalWeight: number; first: boolean; last: boolean }> = {};

  touchpoints.forEach((tp, idx) => {
    const agent = tp.agent_type as AgentType;
    const touchTime = new Date(tp.created_at).getTime();
    // Time decay: more recent = higher weight. Linear decay from 0.5 to 1.0
    const recency = (touchTime - firstTouch) / timeRange;
    const weight = 0.5 + recency * 0.5;

    if (!agentWeights[agent]) {
      agentWeights[agent] = { count: 0, totalWeight: 0, first: false, last: false };
    }
    agentWeights[agent].count++;
    agentWeights[agent].totalWeight += weight;

    if (idx === 0) agentWeights[agent].first = true;
    if (idx === touchpoints.length - 1) agentWeights[agent].last = true;
  });

  // Calculate percentages
  const totalWeight = Object.values(agentWeights).reduce((s, a) => s + a.totalWeight, 0);

  const attributions: Attribution[] = Object.entries(agentWeights)
    .map(([agent, data]) => {
      const creditPct = totalWeight > 0
        ? Math.round((data.totalWeight / totalWeight) * 100)
        : 0;
      return {
        agent_type: agent as AgentType,
        agent_label: AGENT_LABELS[agent as AgentType] || agent,
        touch_count: data.count,
        first_touch: data.first,
        last_touch: data.last,
        credit_percent: creditPct,
        credit_value: Math.round(dealValue * (creditPct / 100) * 100) / 100,
      };
    })
    .sort((a, b) => b.credit_percent - a.credit_percent);

  const daysToClose = contact.deal_stage === "won"
    ? Math.ceil((lastTouch - firstTouch) / (1000 * 60 * 60 * 24))
    : Math.ceil((now - firstTouch) / (1000 * 60 * 60 * 24));

  return {
    contact_id: contactId,
    contact_name: `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
    company: contact.company || "Unknown",
    deal_value: dealValue,
    deal_stage: contact.deal_stage || "new",
    attributions,
    total_touches: touchpoints.length,
    days_to_close: daysToClose,
  };
}

/**
 * Get aggregated agent performance across all deals for a user.
 */
export async function getAgentPerformance(
  userId: string,
  period?: { start: string; end: string }
): Promise<{
  agents: Array<{
    agent_type: AgentType;
    agent_label: string;
    total_touches: number;
    deals_touched: number;
    deals_won: number;
    revenue_attributed: number;
    avg_contribution: number;
  }>;
  totals: {
    total_deals: number;
    total_revenue: number;
    total_touches: number;
  };
}> {
  const supabase = getAdmin();

  // Get touchpoints
  let query = supabase
    .from("agent_touchpoints")
    .select("agent_type, contact_id, created_at")
    .eq("user_id", userId);

  if (period) {
    query = query.gte("created_at", period.start).lte("created_at", period.end);
  }

  const { data: touchpoints } = await query;
  if (!touchpoints || touchpoints.length === 0) {
    return {
      agents: [],
      totals: { total_deals: 0, total_revenue: 0, total_touches: 0 },
    };
  }

  // Get unique contacts with deal info
  const contactIds = [...new Set(touchpoints.map((t) => t.contact_id))];
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, deal_stage, deal_value")
    .eq("user_id", userId)
    .in("id", contactIds);

  const contactMap = new Map(contacts?.map((c) => [c.id, c]) || []);

  // Aggregate per agent
  const agentStats: Record<string, {
    touches: number;
    contactIds: Set<string>;
    wonContactIds: Set<string>;
    revenue: number;
  }> = {};

  touchpoints.forEach((tp) => {
    const agent = tp.agent_type;
    if (!agentStats[agent]) {
      agentStats[agent] = {
        touches: 0,
        contactIds: new Set(),
        wonContactIds: new Set(),
        revenue: 0,
      };
    }
    agentStats[agent].touches++;
    agentStats[agent].contactIds.add(tp.contact_id);

    const contact = contactMap.get(tp.contact_id);
    if (contact?.deal_stage === "won") {
      agentStats[agent].wonContactIds.add(tp.contact_id);
      // Approximate attribution: split deal value by total agents that touched it
      const agentsOnDeal = touchpoints.filter((t) => t.contact_id === tp.contact_id);
      const uniqueAgents = new Set(agentsOnDeal.map((t) => t.agent_type)).size;
      agentStats[agent].revenue += (contact.deal_value || 0) / uniqueAgents;
    }
  });

  const totalRevenue = contacts
    ?.filter((c) => c.deal_stage === "won")
    .reduce((s, c) => s + (c.deal_value || 0), 0) || 0;

  return {
    agents: Object.entries(agentStats)
      .map(([agent, stats]) => ({
        agent_type: agent as AgentType,
        agent_label: AGENT_LABELS[agent as AgentType] || agent,
        total_touches: stats.touches,
        deals_touched: stats.contactIds.size,
        deals_won: stats.wonContactIds.size,
        revenue_attributed: Math.round(stats.revenue * 100) / 100,
        avg_contribution:
          stats.contactIds.size > 0
            ? Math.round((stats.revenue / stats.contactIds.size) * 100) / 100
            : 0,
      }))
      .sort((a, b) => b.revenue_attributed - a.revenue_attributed),
    totals: {
      total_deals: contactIds.length,
      total_revenue: totalRevenue,
      total_touches: touchpoints.length,
    },
  };
}
