"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Briefcase } from "lucide-react";

interface WelcomeSectionProps {
  userName: string;
  stats: {
    winRate: number;
    winRateChange: number;
    pipeline: string;
    pipelineChange: number;
    activeDeals: number;
    activeDealsChange: number;
  };
}

export function WelcomeSection({ userName, stats }: WelcomeSectionProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <Card className="bg-gradient-to-br from-onyx to-graphite border-gunmetal overflow-hidden">
      <CardContent className="p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Greeting */}
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-platinum">
              {getGreeting()}, {userName}! 👋
            </h1>
            <p className="text-silver max-w-md">
              Ready to crush your sales goals today? Let&apos;s see how you&apos;re
              performing.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-6 lg:gap-8">
            {/* Win Rate */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-automationgreen/10">
                <Target className="h-5 w-5 text-automationgreen" />
              </div>
              <div>
                <p className="text-2xl font-bold text-platinum">{stats.winRate}%</p>
                <p className="text-xs text-silver">Win Rate</p>
              </div>
              <Badge
                variant="secondary"
                className={
                  stats.winRateChange >= 0
                    ? "bg-automationgreen/20 text-automationgreen"
                    : "bg-errorred/20 text-errorred"
                }
              >
                {stats.winRateChange >= 0 ? "+" : ""}
                {stats.winRateChange}%
              </Badge>
            </div>

            {/* Divider */}
            <div className="h-12 w-px bg-gunmetal hidden lg:block" />

            {/* Pipeline */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neonblue/10">
                <TrendingUp className="h-5 w-5 text-neonblue" />
              </div>
              <div>
                <p className="text-2xl font-bold text-platinum">{stats.pipeline}</p>
                <p className="text-xs text-silver">Pipeline</p>
              </div>
              <Badge
                variant="secondary"
                className={
                  stats.pipelineChange >= 0
                    ? "bg-automationgreen/20 text-automationgreen"
                    : "bg-errorred/20 text-errorred"
                }
              >
                {stats.pipelineChange >= 0 ? "+" : ""}
                {stats.pipelineChange}%
              </Badge>
            </div>

            {/* Divider */}
            <div className="h-12 w-px bg-gunmetal hidden lg:block" />

            {/* Active Deals */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warningamber/10">
                <Briefcase className="h-5 w-5 text-warningamber" />
              </div>
              <div>
                <p className="text-2xl font-bold text-platinum">{stats.activeDeals}</p>
                <p className="text-xs text-silver">Active Deals</p>
              </div>
              <Badge
                variant="secondary"
                className={
                  stats.activeDealsChange >= 0
                    ? "bg-automationgreen/20 text-automationgreen"
                    : "bg-errorred/20 text-errorred"
                }
              >
                {stats.activeDealsChange >= 0 ? "+" : ""}
                {stats.activeDealsChange}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
