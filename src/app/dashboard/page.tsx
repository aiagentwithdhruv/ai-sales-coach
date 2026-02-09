"use client";

import { useState, useEffect } from "react";
import { WelcomeSection, QuickActions } from "@/components/features/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getSessions, getSessionStats } from "@/lib/session-history";
import {
  MessageSquare,
  Phone,
  Flame,
  Mic,
  ArrowRight,
  Swords,
  TrendingUp,
  Target,
  PenLine,
  History,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const mockStats = {
  winRate: 68,
  winRateChange: 12,
  pipeline: "$2.4M",
  pipelineChange: 8,
  activeDeals: 23,
  activeDealsChange: 3,
};

export default function DashboardPage() {
  const [userName, setUserName] = useState("there");
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    thisWeek: 0,
    thisMonth: 0,
    byType: { coach: 0, practice: 0, call: 0, tool: 0 },
  });
  const [recentSessions, setRecentSessions] = useState<
    { id: string; type: string; title: string; timestamp: number }[]
  >([]);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const fullName =
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "there";
        const firstName = fullName.split(" ")[0];
        setUserName(firstName);
      }
    };
    getUser();
  }, [supabase.auth]);

  useEffect(() => {
    setSessionStats(getSessionStats());
    const sessions = getSessions().slice(0, 5);
    setRecentSessions(
      sessions.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        timestamp: s.timestamp,
      }))
    );
  }, []);

  const TYPE_ICONS: Record<string, { icon: typeof MessageSquare; color: string; bg: string }> = {
    coach: { icon: MessageSquare, color: "text-neonblue", bg: "bg-neonblue/10" },
    practice: { icon: Mic, color: "text-automationgreen", bg: "bg-automationgreen/10" },
    call: { icon: Phone, color: "text-warningamber", bg: "bg-warningamber/10" },
    tool: { icon: Swords, color: "text-purple-400", bg: "bg-purple-400/10" },
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <WelcomeSection userName={userName} stats={mockStats} />

      {/* Progress Stats */}
      <section>
        <h2 className="text-lg font-semibold text-platinum mb-4">Your Progress</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-neonblue" />
              </div>
              <div>
                <p className="text-2xl font-bold text-platinum">{sessionStats.total}</p>
                <p className="text-xs text-mist">Total Sessions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-automationgreen/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-automationgreen" />
              </div>
              <div>
                <p className="text-2xl font-bold text-platinum">{sessionStats.thisWeek}</p>
                <p className="text-xs text-mist">This Week</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-neonblue" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neonblue">{sessionStats.byType.coach}</p>
                <p className="text-xs text-mist">Coaching</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-automationgreen/10 flex items-center justify-center">
                <Mic className="h-5 w-5 text-automationgreen" />
              </div>
              <div>
                <p className="text-2xl font-bold text-automationgreen">{sessionStats.byType.practice}</p>
                <p className="text-xs text-mist">Practice</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warningamber/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-warningamber" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warningamber">{sessionStats.byType.call}</p>
                <p className="text-xs text-mist">Calls</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-400/10 flex items-center justify-center">
                <Swords className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{sessionStats.byType.tool}</p>
                <p className="text-xs text-mist">Tools</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold text-platinum mb-4">Quick Actions</h2>
        <QuickActions />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Get Started Guide */}
        <Card className="lg:col-span-2 bg-onyx border-gunmetal">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-platinum">Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/dashboard/coach">
                <div className="p-4 rounded-lg bg-graphite border border-gunmetal hover:border-neonblue transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-neonblue/10">
                      <MessageSquare className="h-6 w-6 text-neonblue" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-platinum">Handle Objections</h4>
                      <p className="text-sm text-silver mt-1">Get AI-powered responses to any sales objection instantly</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-silver" />
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/text-practice">
                <div className="p-4 rounded-lg bg-graphite border border-gunmetal hover:border-infocyan transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-infocyan/10">
                      <PenLine className="h-6 w-6 text-infocyan" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-platinum">Text Practice</h4>
                      <p className="text-sm text-silver mt-1">Practice selling via chat with AI scoring at the end</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-silver" />
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/tools">
                <div className="p-4 rounded-lg bg-graphite border border-gunmetal hover:border-purple-400 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-400/10">
                      <Swords className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-platinum">Sales Tools</h4>
                      <p className="text-sm text-silver mt-1">Email crafter, pitch scorer, battle cards, deal strategy & more</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-silver" />
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sessions This Week */}
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warningamber/10">
                  <Flame className="h-8 w-8 text-warningamber" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-platinum">{sessionStats.thisWeek || 0}</p>
                  <p className="text-sm text-silver">Sessions This Week</p>
                </div>
              </div>
              <p className="text-xs text-mist mt-4">Keep practicing to sharpen your sales skills!</p>
              <Link href="/dashboard/practice">
                <Button className="w-full mt-4 bg-neonblue hover:bg-electricblue">Practice Now</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-onyx border-gunmetal">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-platinum flex items-center justify-between">
                Recent Activity
                {recentSessions.length > 0 && (
                  <Link href="/dashboard/history" className="text-xs text-neonblue hover:underline font-normal">View All</Link>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <div className="space-y-4">
                  {recentSessions.map((session) => {
                    const config = TYPE_ICONS[session.type] || TYPE_ICONS.tool;
                    const Icon = config.icon;
                    return (
                      <div key={session.id} className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg", config.bg)}>
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-platinum truncate">{session.title}</p>
                          <p className="text-xs text-mist">{formatTime(session.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <History className="h-8 w-8 text-mist mx-auto mb-2" />
                  <p className="text-sm text-silver">No activity yet</p>
                  <p className="text-xs text-mist">Start a coaching session to see your activity here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
