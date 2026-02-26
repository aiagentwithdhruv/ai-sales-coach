/**
 * Plan & Feature Gate System — Tier-Based
 *
 * Now backed by user_subscriptions table (via /api/usage endpoint).
 * Free tier: all features accessible, just with usage limits.
 * Paid tiers (starter/growth/enterprise): tier-specific usage limits.
 *
 * All features are accessible to all users — gating is done via usage limits.
 */

import type { TierSlug } from "./pricing";

export type PlanId = "free" | TierSlug;

export interface PlanConfig {
  id: PlanId;
  name: string;
  maxSessionHistory: number; // -1 = unlimited
  features: {
    voicePractice: boolean;
    callAnalysis: boolean;
    pdfExport: boolean;
    customPersonas: boolean;
    researchMode: boolean;
    meetingNotes: boolean;
    allAIModels: boolean;
    teamDashboard: boolean;
  };
}

// All features enabled for all users — gating is via usage limits, not feature flags
const ALL_FEATURES_ENABLED = {
  voicePractice: true,
  callAnalysis: true,
  pdfExport: true,
  customPersonas: true,
  researchMode: true,
  meetingNotes: true,
  allAIModels: true,
  teamDashboard: true,
};

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    maxSessionHistory: -1,
    features: ALL_FEATURES_ENABLED,
  },
  starter: {
    id: "starter",
    name: "Starter",
    maxSessionHistory: -1,
    features: ALL_FEATURES_ENABLED,
  },
  growth: {
    id: "growth",
    name: "Growth",
    maxSessionHistory: -1,
    features: ALL_FEATURES_ENABLED,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    maxSessionHistory: -1,
    features: ALL_FEATURES_ENABLED,
  },
};

/**
 * Get the user's current plan from localStorage (client-side cache)
 * In the new system, use /api/usage to get actual subscription status.
 */
export function getUserPlan(): PlanId {
  if (typeof window === "undefined") return "free";
  return (localStorage.getItem("user_plan") as PlanId) || "free";
}

/**
 * Set the user's plan in localStorage
 */
export function setUserPlan(planId: PlanId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("user_plan", planId);
}

/**
 * Get the plan config for a given plan ID
 */
export function getPlanConfig(planId?: PlanId): PlanConfig {
  const id = planId || getUserPlan();
  return PLANS[id] || PLANS.free;
}

/**
 * Check if a specific feature is available.
 * All features are available — usage limits are enforced server-side.
 */
export function hasFeature(_feature: keyof PlanConfig["features"]): boolean {
  return true;
}

/**
 * Get upgrade message for approaching usage limits
 */
export function getUpgradeMessage(_feature: keyof PlanConfig["features"]): string {
  return "Upgrade your plan for higher limits";
}
