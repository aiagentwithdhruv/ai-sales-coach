"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  className,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!change) return null;
    if (change.value > 0) {
      return <TrendingUp className="h-3 w-3 text-automationgreen" />;
    } else if (change.value < 0) {
      return <TrendingDown className="h-3 w-3 text-errorred" />;
    }
    return <Minus className="h-3 w-3 text-silver" />;
  };

  const getChangeColor = () => {
    if (!change) return "text-silver";
    if (change.value > 0) return "text-automationgreen";
    if (change.value < 0) return "text-errorred";
    return "text-silver";
  };

  return (
    <Card className={cn("bg-onyx border-gunmetal", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-silver">{title}</p>
            <p className="text-3xl font-bold text-platinum">{value}</p>
            {change && (
              <div className={cn("flex items-center gap-1 text-xs", getChangeColor())}>
                {getTrendIcon()}
                <span>
                  {change.value > 0 ? "+" : ""}
                  {change.value}% {change.label}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="p-3 rounded-lg bg-neonblue/10 text-neonblue">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
