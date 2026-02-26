/**
 * Tier-Based Pricing System
 *
 * QuotaHit is an Autonomous AI Sales Department with 7 AI agents.
 * 3 tiers: Starter ($297), Growth ($697), Enterprise ($1,497).
 * All tiers include BYOAPI — platform manages infrastructure.
 */

export type TierSlug = "starter" | "growth" | "enterprise";
export type BillingInterval = "monthly" | "quarterly" | "yearly";

export interface TierConfig {
  slug: TierSlug;
  name: string;
  tagline: string;
  monthlyPrice: number;
  contactLimit: string;
  agentCount: number;
  agents: string[];
  features: string[];
  cta: string;
  popular?: boolean;
}

// ─── Tier Definitions ─────────────────────────────────────────────────────

export const TIERS: Record<TierSlug, TierConfig> = {
  starter: {
    slug: "starter",
    name: "Starter",
    tagline: "For solo founders and small teams getting started with AI sales",
    monthlyPrice: 297,
    contactLimit: "500",
    agentCount: 3,
    agents: ["Scout", "Researcher", "Qualifier"],
    features: [
      "500 contacts/month",
      "3 AI agents (Scout, Researcher, Qualifier)",
      "Lead discovery & enrichment",
      "BANT+ lead scoring",
      "Basic CRM pipeline",
      "Email support",
      "BYOAPI — bring your own keys",
    ],
    cta: "Start Free Trial",
  },
  growth: {
    slug: "growth",
    name: "Growth",
    tagline: "For growing teams ready to automate outreach and close more deals",
    monthlyPrice: 697,
    contactLimit: "5,000",
    agentCount: 7,
    agents: ["Scout", "Researcher", "Qualifier", "Outreach", "Caller", "Closer", "Ops"],
    features: [
      "5,000 contacts/month",
      "All 7 AI agents",
      "Multi-channel outreach (email, LinkedIn, WhatsApp)",
      "Autonomous AI phone calls",
      "Self-improving templates",
      "Composition chains",
      "Voice commands",
      "Priority email support",
      "BYOAPI — bring your own keys",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  enterprise: {
    slug: "enterprise",
    name: "Enterprise",
    tagline: "For teams that want a fully autonomous AI sales department",
    monthlyPrice: 1497,
    contactLimit: "Unlimited",
    agentCount: 7,
    agents: ["Scout", "Researcher", "Qualifier", "Outreach", "Caller", "Closer", "Ops"],
    features: [
      "Unlimited contacts",
      "All 7 AI agents",
      "Full autonomous mode (zero-touch)",
      "Custom industry loadouts",
      "RAG knowledge base",
      "Auto-proposals & invoicing",
      "Auto-onboarding sequences",
      "Dedicated account manager",
      "Custom integrations",
      "SLA & priority support",
      "BYOAPI — bring your own keys",
    ],
    cta: "Contact Sales",
  },
};

export const ALL_TIER_SLUGS: TierSlug[] = ["starter", "growth", "enterprise"];

// ─── Agent Descriptions ──────────────────────────────────────────────────

export const AGENT_DESCRIPTIONS: Record<string, string> = {
  Scout: "Your Lead Finder — discovers prospects from LinkedIn, web, and databases",
  Researcher: "Your Intel Analyst — enriches leads with company data, funding, and tech stack",
  Qualifier: "Your Gatekeeper — scores leads with AI-powered BANT+ conversations",
  Outreach: "Your Outreach Rep — multi-channel sequences via email, LinkedIn, WhatsApp, SMS",
  Caller: "Your AI Caller — makes autonomous phone calls and handles objections",
  Closer: "Your Deal Closer — auto-generates proposals, sends invoices, collects payments",
  Ops: "Your Ops Manager — post-sale onboarding, welcome sequences, success check-ins",
};

// ─── Billing Discounts ──────────────────────────────────────────────────

export const BILLING_DISCOUNTS: Record<BillingInterval, { label: string; discount: number; badge: string | null }> = {
  monthly: { label: "Monthly", discount: 0, badge: null },
  quarterly: { label: "Quarterly", discount: 10, badge: "Save 10%" },
  yearly: { label: "Yearly", discount: 20, badge: "Save 20%" },
};

// Trial duration in days
export const TRIAL_DURATION_DAYS = 14;

// ─── Pricing Helpers ────────────────────────────────────────────────────

export function getDiscountedPrice(monthlyPrice: number, interval: BillingInterval): number {
  const discount = BILLING_DISCOUNTS[interval].discount;
  return Math.round((monthlyPrice * (100 - discount)) / 100 * 100) / 100;
}

export function getBillingTotal(monthlyPrice: number, interval: BillingInterval): number {
  const perMonth = getDiscountedPrice(monthlyPrice, interval);
  switch (interval) {
    case "monthly": return perMonth;
    case "quarterly": return Math.round(perMonth * 3 * 100) / 100;
    case "yearly": return Math.round(perMonth * 12 * 100) / 100;
  }
}

export function getYearlySavings(monthlyPrice: number, interval: BillingInterval): number {
  const fullYear = monthlyPrice * 12;
  const discountedYear = getDiscountedPrice(monthlyPrice, interval) * 12;
  return Math.round((fullYear - discountedYear) * 100) / 100;
}

// ─── Usage Limits (per tier) ──────────────────────────────────────────────

export interface UsageLimits {
  coaching_sessions: number;
  contacts_created: number;
  ai_calls_made: number;
  followups_sent: number;
  analyses_run: number;
}

/** Free tier / trial expired — tight limits */
export const FREE_LIMITS: UsageLimits = {
  coaching_sessions: 10,
  contacts_created: 50,
  ai_calls_made: 5,
  followups_sent: 10,
  analyses_run: 5,
};

/** Starter $297/mo — 500 contacts, 3 agents */
export const STARTER_LIMITS: UsageLimits = {
  coaching_sessions: -1,
  contacts_created: 500,
  ai_calls_made: 50,
  followups_sent: 100,
  analyses_run: -1,
};

/** Growth $697/mo — 5,000 contacts, all 7 agents */
export const GROWTH_LIMITS: UsageLimits = {
  coaching_sessions: -1,
  contacts_created: 5000,
  ai_calls_made: 500,
  followups_sent: -1,
  analyses_run: -1,
};

/** Enterprise $1,497/mo — unlimited everything */
export const ENTERPRISE_LIMITS: UsageLimits = {
  coaching_sessions: -1,
  contacts_created: -1,
  ai_calls_made: -1,
  followups_sent: -1,
  analyses_run: -1,
};

/** Legacy alias — paid = enterprise-level (used during trial) */
export const PAID_LIMITS: UsageLimits = ENTERPRISE_LIMITS;

/** Lookup limits by tier slug */
export const TIER_LIMITS: Record<TierSlug, UsageLimits> = {
  starter: STARTER_LIMITS,
  growth: GROWTH_LIMITS,
  enterprise: ENTERPRISE_LIMITS,
};

/** Get available agents for a tier */
export function getTierAgents(tier: TierSlug): string[] {
  return TIERS[tier].agents;
}

/** Check if a specific agent is available on a tier */
export function hasAgent(tier: TierSlug, agent: string): boolean {
  return TIERS[tier].agents.includes(agent);
}
