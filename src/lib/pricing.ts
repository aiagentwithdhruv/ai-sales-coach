/**
 * Module-Based Pricing System
 *
 * QuotaHit offers individual modules and an all-in-one bundle.
 * All modules accessible in free tier with tight usage limits.
 * Users bring their own AI API keys (BYOAPI) — platform manages infrastructure.
 */

export type ModuleSlug = "coaching" | "crm" | "calling" | "followups" | "analytics";
export type PlanType = "free" | "module" | "bundle";
export type BillingInterval = "monthly" | "quarterly" | "yearly";

export interface ModuleConfig {
  slug: ModuleSlug;
  name: string;
  description: string;
  monthlyPrice: number;
  marketPrice: number; // What competitors charge
  features: string[];
  icon: string; // Lucide icon name
}

export interface BundleConfig {
  name: string;
  description: string;
  monthlyPrice: number;
  individualTotal: number; // Sum of all module prices
  savings: number; // Percentage saved vs individual
}

// ─── Module Definitions ─────────────────────────────────────────────────────

export const MODULES: Record<ModuleSlug, ModuleConfig> = {
  coaching: {
    slug: "coaching",
    name: "AI Sales Coaching",
    description: "AI-powered practice sessions, roleplay, and real-time feedback",
    monthlyPrice: 39,
    marketPrice: 50,
    features: [
      "Unlimited AI coaching sessions",
      "Voice practice with GPT-4o Realtime",
      "Custom practice personas",
      "Objection handling training",
      "Session history & analytics",
      "PDF export reports",
    ],
    icon: "Brain",
  },
  crm: {
    slug: "crm",
    name: "CRM & Pipeline",
    description: "Full CRM with pipeline management and deal tracking",
    monthlyPrice: 25,
    marketPrice: 30,
    features: [
      "Unlimited contacts & deals",
      "Drag-and-drop pipeline",
      "AI contact enrichment",
      "Deal forecasting",
      "Activity timeline",
      "Webhook integrations",
    ],
    icon: "BarChart3",
  },
  calling: {
    slug: "calling",
    name: "AI Calling",
    description: "Outbound + inbound AI agents that make & receive calls, qualify leads, and book meetings",
    monthlyPrice: 79,
    marketPrice: 100,
    features: [
      "Outbound AI call campaigns",
      "Inbound call handling & routing",
      "AI Agent Builder",
      "Call recordings & transcriptions",
      "Phone number management",
      "Post-call CRM updates",
    ],
    icon: "Phone",
  },
  followups: {
    slug: "followups",
    name: "Follow-Up Automation",
    description: "Automated email and SMS follow-ups triggered by call outcomes",
    monthlyPrice: 29,
    marketPrice: 40,
    features: [
      "Unlimited follow-up sequences",
      "Email via Resend",
      "SMS via Twilio",
      "Outcome-based triggers",
      "Template variables",
      "Message scheduling",
    ],
    icon: "Mail",
  },
  analytics: {
    slug: "analytics",
    name: "Analytics & Reporting",
    description: "Advanced call analysis, scoring, and team analytics",
    monthlyPrice: 19,
    marketPrice: 30,
    features: [
      "Advanced call scoring",
      "Sentiment analysis",
      "Team leaderboards",
      "Manager dashboard",
      "Meeting notes AI",
      "Research mode",
    ],
    icon: "TrendingUp",
  },
};

export const ALL_MODULE_SLUGS: ModuleSlug[] = ["coaching", "crm", "calling", "followups", "analytics"];

// ─── Bundle ─────────────────────────────────────────────────────────────────

const individualTotal = Object.values(MODULES).reduce((sum, m) => sum + m.monthlyPrice, 0);

export const BUNDLE: BundleConfig = {
  name: "All-in-One Bundle",
  description: "Every module at the best price — save 32%+ vs buying individually",
  monthlyPrice: 129,
  individualTotal,
  savings: Math.round((1 - 129 / individualTotal) * 100),
};

// ─── Billing Discounts ──────────────────────────────────────────────────────

export const BILLING_DISCOUNTS: Record<BillingInterval, { label: string; discount: number; badge: string | null }> = {
  monthly: { label: "Monthly", discount: 0, badge: null },
  quarterly: { label: "Quarterly", discount: 10, badge: "Save 10%" },
  yearly: { label: "Yearly", discount: 20, badge: "Save 20%" },
};

// ─── Free Tier Limits ───────────────────────────────────────────────────────

export interface UsageLimits {
  coaching_sessions: number; // per month, -1 = unlimited
  contacts_created: number;  // total, -1 = unlimited
  ai_calls_made: number;     // per month
  followups_sent: number;    // per month
  analyses_run: number;      // per month
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

// Trial duration in days
export const TRIAL_DURATION_DAYS = 15;

// ─── Pricing Helpers ────────────────────────────────────────────────────────

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

/**
 * Calculate total monthly price for selected modules
 */
export function calculateModulesPrice(modules: ModuleSlug[], interval: BillingInterval): number {
  const total = modules.reduce((sum, slug) => sum + MODULES[slug].monthlyPrice, 0);
  return getDiscountedPrice(total, interval);
}

/**
 * Check if bundle is cheaper than selected modules
 */
export function isBundleCheaper(modules: ModuleSlug[]): boolean {
  if (modules.length <= 2) return false;
  const individualPrice = modules.reduce((sum, slug) => sum + MODULES[slug].monthlyPrice, 0);
  return BUNDLE.monthlyPrice < individualPrice;
}
