import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

export const PLANS = {
  free: {
    name: "Free",
    priceId: null,
    credits: 5, // per day
    features: ["5 AI credits/day", "Text-only practice", "Basic coaching"],
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID || null,
    credits: -1, // unlimited
    features: ["Unlimited credits", "Voice practice", "All AI models"],
  },
  team: {
    name: "Team",
    priceId: process.env.STRIPE_TEAM_PRICE_ID || null,
    credits: -1, // unlimited
    features: ["Everything in Pro", "Up to 5 users", "Team analytics"],
  },
} as const;

export type PlanId = keyof typeof PLANS;
