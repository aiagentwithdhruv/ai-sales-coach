import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

// ─── Module-Based Products ──────────────────────────────────────────────────

export const MODULE_PRICES = {
  coaching: {
    name: "AI Sales Coaching",
    priceId: process.env.STRIPE_COACHING_PRICE_ID || null,
    monthlyPrice: 39,
  },
  crm: {
    name: "CRM & Pipeline",
    priceId: process.env.STRIPE_CRM_PRICE_ID || null,
    monthlyPrice: 25,
  },
  calling: {
    name: "AI Outbound Calling",
    priceId: process.env.STRIPE_CALLING_PRICE_ID || null,
    monthlyPrice: 79,
  },
  followups: {
    name: "Follow-Up Automation",
    priceId: process.env.STRIPE_FOLLOWUPS_PRICE_ID || null,
    monthlyPrice: 29,
  },
  analytics: {
    name: "Analytics & Reporting",
    priceId: process.env.STRIPE_ANALYTICS_PRICE_ID || null,
    monthlyPrice: 19,
  },
  bundle: {
    name: "All-in-One Bundle",
    priceId: process.env.STRIPE_BUNDLE_PRICE_ID || null,
    monthlyPrice: 129,
  },
} as const;

export type ModuleId = keyof typeof MODULE_PRICES;

// Legacy PLANS for backward compatibility
export const PLANS = {
  free: {
    name: "Free",
    priceId: null,
    features: ["All features with usage limits", "Text-only practice", "Basic coaching"],
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID || null,
    features: ["Unlimited usage", "Voice practice", "All AI models"],
  },
  team: {
    name: "Team",
    priceId: process.env.STRIPE_TEAM_PRICE_ID || null,
    features: ["Everything in Pro", "Up to 5 users", "Team analytics"],
  },
} as const;

export type PlanId = keyof typeof PLANS;
