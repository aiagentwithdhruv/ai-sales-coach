"use client";

import { usePlan } from "@/hooks/usePlan";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import type { PlanConfig } from "@/lib/plans";

interface FeatureGateProps {
  feature?: keyof PlanConfig["features"];
  children: React.ReactNode;
}

/**
 * Wraps content that requires a specific plan feature.
 * Shows upgrade prompt if user doesn't have access.
 */
export function FeatureGate({ feature, children }: FeatureGateProps) {
  const { hasFeature } = usePlan();

  // Check feature access
  if (feature && !hasFeature(feature)) {
    return <UpgradePrompt feature={feature} />;
  }

  return <>{children}</>;
}
