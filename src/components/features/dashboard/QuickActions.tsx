"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  UserSearch,
  PhoneOutgoing,
  Mail,
  Contact,
  LucideIcon,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface AgentStatus {
  icon: LucideIcon;
  title: string;
  status: string;
  metric: string;
  href: string;
  cta: string;
  iconColor: string;
  iconBg: string;
  glowColor: string;
}

const agentStatuses: AgentStatus[] = [
  {
    icon: UserSearch,
    title: "Scout Agent",
    status: "Finding leads matching your ICP",
    metric: "Configure your ICP to start",
    href: "/dashboard/crm",
    cta: "View Leads",
    iconColor: "text-neonblue",
    iconBg: "bg-neonblue/10",
    glowColor: "rgba(0, 179, 255, 0.4)",
  },
  {
    icon: PhoneOutgoing,
    title: "AI Calling",
    status: "Ready to make calls",
    metric: "Set up your first campaign",
    href: "/dashboard/ai-calling",
    cta: "Start Campaign",
    iconColor: "text-automationgreen",
    iconBg: "bg-automationgreen/10",
    glowColor: "rgba(0, 255, 136, 0.4)",
  },
  {
    icon: Mail,
    title: "Follow-ups",
    status: "Automated sequences ready",
    metric: "Create your first sequence",
    href: "/dashboard/follow-ups",
    cta: "Set Up Sequences",
    iconColor: "text-warningamber",
    iconBg: "bg-warningamber/10",
    glowColor: "rgba(255, 179, 0, 0.4)",
  },
  {
    icon: Contact,
    title: "CRM Pipeline",
    status: "Track deals from lead to close",
    metric: "Import or add contacts",
    href: "/dashboard/crm",
    cta: "View Pipeline",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-400/10",
    glowColor: "rgba(192, 132, 252, 0.4)",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {agentStatuses.map((agent) => (
        <Link key={agent.href + agent.title} href={agent.href}>
          <div
            className="glow-card group relative rounded-xl bg-onyx border border-gunmetal hover:border-transparent transition-all duration-300 cursor-pointer h-full"
            style={{
              "--glow-color": agent.glowColor,
            } as React.CSSProperties}
          >
            <div className="relative z-10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300",
                    agent.iconBg,
                    "group-hover:scale-110"
                  )}
                >
                  <agent.icon
                    className={cn(
                      "h-6 w-6 transition-colors duration-200",
                      agent.iconColor
                    )}
                  />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-mist group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="font-semibold text-platinum group-hover:text-white transition-colors">
                  {agent.title}
                </h3>
                <p className="text-sm text-silver mt-1">{agent.status}</p>
              </div>
              <div className="flex items-center gap-1.5 pt-1 border-t border-gunmetal/50">
                <Sparkles className={cn("h-3 w-3 shrink-0", agent.iconColor)} />
                <p className="text-xs text-mist group-hover:text-silver transition-colors">{agent.cta}</p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
