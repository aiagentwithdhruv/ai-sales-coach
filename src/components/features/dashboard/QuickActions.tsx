"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Mic,
  Phone,
  Swords,
  LucideIcon,
} from "lucide-react";

interface QuickAction {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  iconColor: string;
  iconBg: string;
}

const quickActions: QuickAction[] = [
  {
    icon: MessageSquare,
    title: "Handle Objection",
    description: "Get AI-powered responses to common objections",
    href: "/dashboard/coach",
    iconColor: "text-neonblue",
    iconBg: "bg-neonblue/10",
  },
  {
    icon: Mic,
    title: "Practice Pitch",
    description: "Role-play with AI to sharpen your skills",
    href: "/dashboard/practice",
    iconColor: "text-automationgreen",
    iconBg: "bg-automationgreen/10",
  },
  {
    icon: Phone,
    title: "Analyze Call",
    description: "Upload a call recording for AI insights",
    href: "/dashboard/calls",
    iconColor: "text-warningamber",
    iconBg: "bg-warningamber/10",
  },
  {
    icon: Swords,
    title: "Sales Tools",
    description: "Email crafter, pitch scorer, battle cards & more",
    href: "/dashboard/tools",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-400/10",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {quickActions.map((action) => (
        <Link key={action.href} href={action.href}>
          <Card className="bg-onyx border-gunmetal hover:border-neonblue transition-all duration-200 group cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-200",
                    action.iconBg,
                    "group-hover:bg-neonblue/20"
                  )}
                >
                  <action.icon
                    className={cn(
                      "h-6 w-6 transition-colors duration-200",
                      action.iconColor,
                      "group-hover:text-neonblue"
                    )}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-platinum group-hover:text-neonblue transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-silver mt-1">{action.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
