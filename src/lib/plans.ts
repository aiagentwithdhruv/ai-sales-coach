/**
 * Plan & Feature Gate System
 *
 * Now backed by user_subscriptions table (via /api/usage endpoint).
 * Free tier: all features accessible, just with usage limits.
 * Paid (module/bundle): unlimited usage for subscribed modules.
 *
 * Legacy PLANS config kept for backward compatibility with
 * existing feature-gate components.
 */

export type PlanId = "free" | "pro" | "team" | "enterprise";

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

// In the new system, free users get ALL features (with usage limits).
// Feature gates are kept for backward compatibility but all return true.
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
  pro: {
    id: "pro",
    name: "Pro",
    maxSessionHistory: -1,
    features: ALL_FEATURES_ENABLED,
  },
  team: {
    id: "team",
    name: "Team",
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
 * Get the user's current plan from localStorage (legacy, kept for compatibility)
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
  return PLANS[planId || getUserPlan()];
}

/**
 * Check if a specific feature is available.
 * In the new module-based system, all features are available to everyone.
 * Usage limits are enforced server-side via checkUsage().
 */
export function hasFeature(_feature: keyof PlanConfig["features"]): boolean {
  return true; // All features accessible in new model
}

/**
 * Get upgrade message for approaching usage limits
 */
export function getUpgradeMessage(_feature: keyof PlanConfig["features"]): string {
  return "Upgrade your plan for unlimited access";
}
