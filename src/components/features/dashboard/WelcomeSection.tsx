"use client";

import { CardContent } from "@/components/ui/card";
import { Users, PhoneOutgoing, Mail, Sparkles } from "lucide-react";

interface WelcomeSectionProps {
  userName: string;
  stats: {
    totalContacts: number;
    aiCallsMade: number;
    followupsSent: number;
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
    <div className="welcome-premium rounded-xl">
      <CardContent className="p-8 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Greeting */}
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-platinum">
              {getGreeting()}, {userName}!
            </h1>
            <p className="text-silver max-w-md">
              Your AI sales department is ready. Here&apos;s what&apos;s happening.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-6 lg:gap-8">
            {/* Contacts */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neonblue/10">
                <Users className="h-5 w-5 text-neonblue" />
              </div>
              <div>
                <p className="text-2xl font-bold text-platinum">{stats.totalContacts}</p>
                <p className="text-xs text-silver">Contacts</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-12 w-px bg-gunmetal hidden lg:block" />

            {/* AI Calls */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-automationgreen/10">
                <PhoneOutgoing className="h-5 w-5 text-automationgreen" />
              </div>
              <div>
                <p className="text-2xl font-bold text-platinum">{stats.aiCallsMade}</p>
                <p className="text-xs text-silver">AI Calls</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-12 w-px bg-gunmetal hidden lg:block" />

            {/* Follow-ups */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warningamber/10">
                <Mail className="h-5 w-5 text-warningamber" />
              </div>
              <div>
                <p className="text-2xl font-bold text-platinum">{stats.followupsSent}</p>
                <p className="text-xs text-silver">Follow-ups</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
}
