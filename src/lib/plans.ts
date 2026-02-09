/**
 * Plan & Tier System
 * Defines feature gates and limits per plan.
 * Works with localStorage for now, plugs into Stripe later.
 */

export type PlanId = "free" | "pro" | "team" | "enterprise";

export interface PlanConfig {
  id: PlanId;
  name: string;
  dailyCredits: number; // -1 = unlimited
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

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    dailyCredits: 5,
    maxSessionHistory: 20,
    features: {
      voicePractice: false,
      callAnalysis: true,
      pdfExport: false,
      customPersonas: false,
      researchMode: true,
      meetingNotes: true,
      allAIModels: false,
      teamDashboard: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    dailyCredits: -1,
    maxSessionHistory: -1,
    features: {
      voicePractice: true,
      callAnalysis: true,
      pdfExport: true,
      customPersonas: true,
      researchMode: true,
      meetingNotes: true,
      allAIModels: true,
      teamDashboard: false,
    },
  },
  team: {
    id: "team",
    name: "Team",
    dailyCredits: -1,
    maxSessionHistory: -1,
    features: {
      voicePractice: true,
      callAnalysis: true,
      pdfExport: true,
      customPersonas: true,
      researchMode: true,
      meetingNotes: true,
      allAIModels: true,
      teamDashboard: true,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    dailyCredits: -1,
    maxSessionHistory: -1,
    features: {
      voicePractice: true,
      callAnalysis: true,
      pdfExport: true,
      customPersonas: true,
      researchMode: true,
      meetingNotes: true,
      allAIModels: true,
      teamDashboard: true,
    },
  },
};

const PLAN_STORAGE_KEY = "sales-coach-plan";
const DAILY_USAGE_KEY = "sales-coach-daily-usage";

/**
 * Get the user's current plan (from localStorage for now, Stripe later)
 */
export function getUserPlan(): PlanId {
  if (typeof window === "undefined") return "free";
  return (localStorage.getItem(PLAN_STORAGE_KEY) as PlanId) || "free";
}

/**
 * Set the user's plan (called after Stripe checkout succeeds)
 */
export function setUserPlan(planId: PlanId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAN_STORAGE_KEY, planId);
}

/**
 * Get the plan config for a given plan ID
 */
export function getPlanConfig(planId?: PlanId): PlanConfig {
  return PLANS[planId || getUserPlan()];
}

/**
 * Check if a specific feature is available on the user's plan
 */
export function hasFeature(feature: keyof PlanConfig["features"]): boolean {
  const plan = getPlanConfig();
  return plan.features[feature];
}

interface DailyUsage {
  date: string; // YYYY-MM-DD
  count: number;
}

/**
 * Get today's usage count for free tier tracking
 */
function getDailyUsage(): DailyUsage {
  if (typeof window === "undefined") return { date: "", count: 0 };
  const today = new Date().toISOString().split("T")[0];
  try {
    const raw = localStorage.getItem(DAILY_USAGE_KEY);
    if (raw) {
      const usage: DailyUsage = JSON.parse(raw);
      if (usage.date === today) return usage;
    }
  } catch {
    // ignore parse errors
  }
  return { date: today, count: 0 };
}

/**
 * Increment daily usage counter
 */
export function incrementDailyUsage(): void {
  if (typeof window === "undefined") return;
  const usage = getDailyUsage();
  usage.count += 1;
  usage.date = new Date().toISOString().split("T")[0];
  localStorage.setItem(DAILY_USAGE_KEY, JSON.stringify(usage));
}

/**
 * Check if user can use an AI credit (respects daily limit for free tier)
 */
export function canUseCredit(): { allowed: boolean; remaining: number; limit: number } {
  const plan = getPlanConfig();
  if (plan.dailyCredits === -1) {
    return { allowed: true, remaining: -1, limit: -1 };
  }
  const usage = getDailyUsage();
  const remaining = Math.max(0, plan.dailyCredits - usage.count);
  return {
    allowed: remaining > 0,
    remaining,
    limit: plan.dailyCredits,
  };
}

/**
 * Get upgrade message for a locked feature
 */
export function getUpgradeMessage(feature: keyof PlanConfig["features"]): string {
  const messages: Record<string, string> = {
    voicePractice: "Upgrade to Pro for real-time voice practice with GPT-4o",
    pdfExport: "Upgrade to Pro to export reports as PDF",
    customPersonas: "Upgrade to Pro to create custom practice personas",
    allAIModels: "Upgrade to Pro for access to all AI models",
    teamDashboard: "Upgrade to Team for team analytics and management",
    callAnalysis: "Upgrade to Pro for unlimited call analysis",
    researchMode: "Upgrade to Pro for unlimited research",
    meetingNotes: "Upgrade to Pro for unlimited meeting notes",
  };
  return messages[feature] || "Upgrade your plan for this feature";
}
