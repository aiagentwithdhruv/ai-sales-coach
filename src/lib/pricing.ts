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
  Scout: "Finds leads from LinkedIn, web, and databases",
  Researcher: "Enriches leads with company data, funding, and tech stack",
  Qualifier: "Scores leads with AI-powered BANT+ conversations",
  Outreach: "Multi-channel sequences: email, LinkedIn, WhatsApp, SMS",
  Caller: "Autonomous AI phone calls that handle objections",
  Closer: "Auto-generates proposals, sends invoices, collects payments",
  Ops: "Post-sale onboarding, welcome sequences, success check-ins",
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

// ─── Usage Limits (for usage.ts) ──────────────────────────────────────────

export interface UsageLimits {
  coaching_sessions: number;
  contacts_created: number;
  ai_calls_made: number;
  followups_sent: number;
  analyses_run: number;
}

export const FREE_LIMITS: UsageLimits = {
  coaching_sessions: 10,
  contacts_created: 50,
  ai_calls_made: 5,
  followups_sent: 10,
  analyses_run: 5,
};

export const PAID_LIMITS: UsageLimits = {
  coaching_sessions: -1,
  contacts_created: -1,
  ai_calls_made: -1,
  followups_sent: -1,
  analyses_run: -1,
};

// ─── Legacy Compat (used by sales agent tools) ───────────────────────────

export type ModuleSlug = "coaching" | "crm" | "calling" | "followups" | "analytics";

export interface ModuleConfig {
  slug: ModuleSlug;
  name: string;
  description: string;
  monthlyPrice: number;
  marketPrice: number;
  features: string[];
  icon: string;
}

export const MODULES: Record<ModuleSlug, ModuleConfig> = {
  coaching: {
    slug: "coaching",
    name: "AI Sales Coaching",
    description: "AI-powered practice sessions, roleplay, and real-time feedback",
    monthlyPrice: 39,
    marketPrice: 50,
    features: ["Unlimited AI coaching sessions", "Voice practice", "Custom personas", "Objection training", "Session analytics", "PDF reports"],
    icon: "Brain",
  },
  crm: {
    slug: "crm",
    name: "CRM & Pipeline",
    description: "Full CRM with pipeline management and deal tracking",
    monthlyPrice: 25,
    marketPrice: 30,
    features: ["Unlimited contacts & deals", "Drag-and-drop pipeline", "AI enrichment", "Deal forecasting", "Activity timeline", "Webhooks"],
    icon: "BarChart3",
  },
  calling: {
    slug: "calling",
    name: "AI Calling",
    description: "Autonomous AI phone calls that qualify leads and book meetings",
    monthlyPrice: 79,
    marketPrice: 100,
    features: ["Outbound AI campaigns", "Inbound call handling", "AI Agent Builder", "Call transcriptions", "Phone management", "CRM updates"],
    icon: "Phone",
  },
  followups: {
    slug: "followups",
    name: "Follow-Up Automation",
    description: "Automated email and SMS follow-ups triggered by call outcomes",
    monthlyPrice: 29,
    marketPrice: 40,
    features: ["Unlimited sequences", "Email via Resend", "SMS via Twilio", "Outcome triggers", "Template variables", "Scheduling"],
    icon: "Mail",
  },
  analytics: {
    slug: "analytics",
    name: "Analytics & Reporting",
    description: "Advanced call analysis, scoring, and team analytics",
    monthlyPrice: 19,
    marketPrice: 30,
    features: ["Advanced call scoring", "Sentiment analysis", "Leaderboards", "Manager dashboard", "Meeting notes AI", "Research mode"],
    icon: "TrendingUp",
  },
};

export const ALL_MODULE_SLUGS: ModuleSlug[] = ["coaching", "crm", "calling", "followups", "analytics"];

const individualTotal = Object.values(MODULES).reduce((sum, m) => sum + m.monthlyPrice, 0);

export const BUNDLE = {
  name: "All-in-One Bundle",
  description: "Every module at the best price",
  monthlyPrice: 129,
  individualTotal,
  savings: Math.round((1 - 129 / individualTotal) * 100),
};

export function calculateModulesPrice(modules: ModuleSlug[], interval: BillingInterval): number {
  const total = modules.reduce((sum, slug) => sum + MODULES[slug].monthlyPrice, 0);
  return getDiscountedPrice(total, interval);
}

export function isBundleCheaper(modules: ModuleSlug[]): boolean {
  if (modules.length <= 2) return false;
  const individualPrice = modules.reduce((sum, slug) => sum + MODULES[slug].monthlyPrice, 0);
  return BUNDLE.monthlyPrice < individualPrice;
}
