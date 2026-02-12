"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, ArrowRight } from "lucide-react";

interface UpgradePromptProps {
  feature: string;
  message?: string;
  compact?: boolean;
}

export function UpgradePrompt({ feature, message, compact = false }: UpgradePromptProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warningamber/10 border border-warningamber/20">
        <Crown className="h-4 w-4 text-warningamber shrink-0" />
        <p className="text-sm text-warningamber flex-1">
          {message || `${feature} requires Pro plan`}
        </p>
        <Link href="/pricing">
          <Button size="sm" className="bg-warningamber hover:bg-warningamber/90 text-black text-xs h-7">
            Upgrade
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="h-16 w-16 rounded-full bg-warningamber/10 flex items-center justify-center mb-4">
        <Crown className="h-8 w-8 text-warningamber" />
      </div>
      <h3 className="text-lg font-semibold text-platinum mb-2">
        Upgrade to Pro
      </h3>
      <p className="text-sm text-silver max-w-md mb-6">
        {message || `${feature} is available on the Pro plan. Upgrade to unlock all features and unlimited usage.`}
      </p>
      <Link href="/pricing">
        <Button className="bg-neonblue hover:bg-electricblue text-white gap-2">
          <Sparkles className="h-4 w-4" />
          See Plans
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
