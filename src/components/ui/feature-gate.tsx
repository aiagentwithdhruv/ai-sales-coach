"use client";

import { usePlan } from "@/hooks/usePlan";
import { UpgradePrompt, CreditLimitPrompt } from "@/components/ui/upgrade-prompt";
import type { PlanConfig } from "@/lib/plans";

interface FeatureGateProps {
  feature?: keyof PlanConfig["features"];
  children: React.ReactNode;
  showCredits?: boolean;
}

/**
 * Wraps content that requires a specific plan feature or credits.
 * Shows upgrade prompt if user doesn't have access.
 * Shows credit counter if showCredits is true.
 */
export function FeatureGate({ feature, children, showCredits = false }: FeatureGateProps) {
  const { hasFeature, creditStatus, isFree } = usePlan();

  // Check feature access
  if (feature && !hasFeature(feature)) {
    return <UpgradePrompt feature={feature} />;
  }

  // Check credit limit for free users
  if (showCredits && isFree && !creditStatus.allowed) {
    return (
      <div className="space-y-4">
        <CreditLimitPrompt remaining={creditStatus.remaining} limit={creditStatus.limit} />
        <UpgradePrompt feature="daily credits" message="You've used all your free credits for today. Upgrade for unlimited access." />
      </div>
    );
  }

  return (
    <>
      {showCredits && isFree && creditStatus.remaining >= 0 && (
        <div className="mb-4">
          <CreditLimitPrompt remaining={creditStatus.remaining} limit={creditStatus.limit} />
        </div>
      )}
      {children}
    </>
  );
}
