"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Mic,
  Phone,
  Swords,
  LucideIcon,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface QuickAction {
  icon: LucideIcon;
  title: string;
  description: string;
  hint: string;
  href: string;
  iconColor: string;
  iconBg: string;
  glowColor: string;
  step: number;
}

const quickActions: QuickAction[] = [
  {
    icon: MessageSquare,
    title: "Handle Objection",
    description: "Get AI-powered responses to common objections",
    hint: "Try it: Type any objection and get instant coaching",
    href: "/dashboard/coach",
    iconColor: "text-neonblue",
    iconBg: "bg-neonblue/10",
    glowColor: "rgba(0, 179, 255, 0.4)",
    step: 1,
  },
  {
    icon: Mic,
    title: "Practice Pitch",
    description: "Role-play with AI to sharpen your skills",
    hint: "Start a live voice call with an AI prospect",
    href: "/dashboard/practice",
    iconColor: "text-automationgreen",
    iconBg: "bg-automationgreen/10",
    glowColor: "rgba(0, 255, 136, 0.4)",
    step: 2,
  },
  {
    icon: Phone,
    title: "Analyze Call",
    description: "Upload a call recording for AI insights",
    hint: "Upload any sales call to get a full AI scorecard",
    href: "/dashboard/calls",
    iconColor: "text-warningamber",
    iconBg: "bg-warningamber/10",
    glowColor: "rgba(255, 179, 0, 0.4)",
    step: 3,
  },
  {
    icon: Swords,
    title: "Sales Tools",
    description: "Email crafter, pitch scorer, battle cards & more",
    hint: "Generate emails, battle cards, deal strategies",
    href: "/dashboard/tools",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-400/10",
    glowColor: "rgba(192, 132, 252, 0.4)",
    step: 4,
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {quickActions.map((action) => (
        <Link key={action.href} href={action.href}>
          <div
            className="glow-card group relative rounded-xl bg-onyx border border-gunmetal hover:border-transparent transition-all duration-300 cursor-pointer h-full animate-pulse-glow-subtle"
            style={{
              "--glow-color": action.glowColor,
            } as React.CSSProperties}
          >
            <div className="relative z-10 p-6 space-y-4">
              {/* Step badge */}
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300",
                    action.iconBg,
                    "group-hover:scale-110"
                  )}
                >
                  <action.icon
                    className={cn(
                      "h-6 w-6 transition-colors duration-200",
                      action.iconColor
                    )}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-mist uppercase tracking-wider">Step {action.step}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-mist group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-platinum group-hover:text-white transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-silver mt-1">{action.description}</p>
              </div>
              {/* Hint text */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-gunmetal/50">
                <Sparkles className={cn("h-3 w-3 shrink-0", action.iconColor)} />
                <p className="text-xs text-mist group-hover:text-silver transition-colors">{action.hint}</p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
