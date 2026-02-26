/**
 * Stripe Configuration — Tier-Based Pricing
 *
 * 3 tiers × 3 billing intervals = 9 Stripe Price IDs.
 * Environment variables: STRIPE_{TIER}_{INTERVAL}_PRICE_ID
 *
 * Example:
 *   STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxx
 *   STRIPE_GROWTH_QUARTERLY_PRICE_ID=price_yyy
 *   STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_zzz
 */

import Stripe from "stripe";
import type { TierSlug, BillingInterval } from "./pricing";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

// ─── Tier Price ID Lookup ────────────────────────────────────────────────────

const TIER_PRICE_IDS: Record<TierSlug, Record<BillingInterval, string | null>> = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || null,
    quarterly: process.env.STRIPE_STARTER_QUARTERLY_PRICE_ID || null,
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || null,
  },
  growth: {
    monthly: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID || null,
    quarterly: process.env.STRIPE_GROWTH_QUARTERLY_PRICE_ID || null,
    yearly: process.env.STRIPE_GROWTH_YEARLY_PRICE_ID || null,
  },
  enterprise: {
    monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || null,
    quarterly: process.env.STRIPE_ENTERPRISE_QUARTERLY_PRICE_ID || null,
    yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || null,
  },
};

/**
 * Get the Stripe Price ID for a tier + interval combo.
 * Returns null if the environment variable is not set.
 */
export function getTierPriceId(tier: TierSlug, interval: BillingInterval): string | null {
  return TIER_PRICE_IDS[tier]?.[interval] || null;
}

/**
 * Get the environment variable name for a tier + interval.
 * Useful for error messages.
 */
export function getTierPriceEnvVar(tier: TierSlug, interval: BillingInterval): string {
  return `STRIPE_${tier.toUpperCase()}_${interval.toUpperCase()}_PRICE_ID`;
}
