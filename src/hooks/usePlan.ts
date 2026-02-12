"use client";

import { useState, useEffect } from "react";
import {
  getUserPlan,
  getPlanConfig,
  hasFeature,
  type PlanId,
  type PlanConfig,
} from "@/lib/plans";

export function usePlan() {
  const [planId, setPlanId] = useState<PlanId>("free");
  const [plan, setPlan] = useState<PlanConfig>(getPlanConfig("free"));

  useEffect(() => {
    const id = getUserPlan();
    setPlanId(id);
    setPlan(getPlanConfig(id));
  }, []);

  return {
    planId,
    plan,
    isPro: planId === "pro" || planId === "team" || planId === "enterprise",
    isTeam: planId === "team" || planId === "enterprise",
    isFree: planId === "free",
    hasFeature: (feature: keyof PlanConfig["features"]) => hasFeature(feature),
  };
}
