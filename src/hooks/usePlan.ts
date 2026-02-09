"use client";

import { useState, useEffect } from "react";
import {
  getUserPlan,
  getPlanConfig,
  hasFeature,
  canUseCredit,
  incrementDailyUsage,
  type PlanId,
  type PlanConfig,
} from "@/lib/plans";

export function usePlan() {
  const [planId, setPlanId] = useState<PlanId>("free");
  const [plan, setPlan] = useState<PlanConfig>(getPlanConfig("free"));
  const [creditStatus, setCreditStatus] = useState({ allowed: true, remaining: -1, limit: -1 });

  useEffect(() => {
    const id = getUserPlan();
    setPlanId(id);
    setPlan(getPlanConfig(id));
    setCreditStatus(canUseCredit());
  }, []);

  const useCredit = () => {
    incrementDailyUsage();
    setCreditStatus(canUseCredit());
  };

  const refreshCredits = () => {
    setCreditStatus(canUseCredit());
  };

  return {
    planId,
    plan,
    isPro: planId === "pro" || planId === "team" || planId === "enterprise",
    isTeam: planId === "team" || planId === "enterprise",
    isFree: planId === "free",
    hasFeature: (feature: keyof PlanConfig["features"]) => hasFeature(feature),
    creditStatus,
    useCredit,
    refreshCredits,
  };
}
