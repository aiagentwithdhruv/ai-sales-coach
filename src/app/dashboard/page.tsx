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
  Calendar,
  ExternalLink,
  Rocket,
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

      {/* Start Here - Onboarding Guide */}
      <Card className="bg-onyx border-gunmetal">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
            <Rocket className="h-5 w-5 text-neonblue" />
            Start Here — Try It in 30 Seconds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/coach" className="block">
              <div className="glow-card p-4 rounded-xl bg-graphite border border-gunmetal hover:border-neonblue transition-all cursor-pointer group" style={{ "--glow-color": "rgba(0, 179, 255, 0.4)" } as React.CSSProperties}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center h-7 w-7 rounded-full bg-neonblue/20 text-neonblue text-xs font-bold">1</span>
                  <h4 className="font-medium text-platinum group-hover:text-neonblue transition-colors">Handle an Objection</h4>
                </div>
                <p className="text-sm text-silver mb-3">Type any objection like &quot;Your price is too high&quot; and get an instant AI coaching response.</p>
                <div className="flex items-center gap-1.5 text-xs text-neonblue font-medium">
                  Try it now <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <Link href="/dashboard/practice" className="block">
              <div className="glow-card p-4 rounded-xl bg-graphite border border-gunmetal hover:border-automationgreen transition-all cursor-pointer group" style={{ "--glow-color": "rgba(0, 255, 136, 0.4)" } as React.CSSProperties}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center h-7 w-7 rounded-full bg-automationgreen/20 text-automationgreen text-xs font-bold">2</span>
                  <h4 className="font-medium text-platinum group-hover:text-automationgreen transition-colors">Practice a Live Call</h4>
                </div>
                <p className="text-sm text-silver mb-3">Click &quot;Start Live Call&quot; to role-play with an AI prospect using real-time voice.</p>
                <div className="flex items-center gap-1.5 text-xs text-automationgreen font-medium">
                  Start practicing <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <Link href="/dashboard/calls" className="block">
              <div className="glow-card p-4 rounded-xl bg-graphite border border-gunmetal hover:border-warningamber transition-all cursor-pointer group" style={{ "--glow-color": "rgba(255, 179, 0, 0.4)" } as React.CSSProperties}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center h-7 w-7 rounded-full bg-warningamber/20 text-warningamber text-xs font-bold">3</span>
                  <h4 className="font-medium text-platinum group-hover:text-warningamber transition-colors">Analyze a Call</h4>
                </div>
                <p className="text-sm text-silver mb-3">Upload any sales call recording and get a full AI scorecard with actionable feedback.</p>
                <div className="flex items-center gap-1.5 text-xs text-warningamber font-medium">
                  Upload a call <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Book Demo + Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Book a Demo CTA */}
          <div className="glow-card relative overflow-hidden rounded-xl bg-gradient-to-r from-graphite via-onyx to-graphite border border-neonblue/30 p-6 animate-pulse-glow-subtle" style={{ "--glow-color": "rgba(0, 179, 255, 0.3)" } as React.CSSProperties}>
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-neonblue/10 border border-neonblue/20">
                  <Calendar className="h-8 w-8 text-neonblue" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-platinum">Want AI to Work for Your Sales Team?</h3>
                  <p className="text-sm text-silver mt-1">Book a free consultation — we&apos;ll show you how QuotaHit can 10x your team&apos;s performance.</p>
                </div>
              </div>
              <a
                href="https://calendly.com/aiwithdhruv/makeaiworkforyou"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-premium px-6 py-3 rounded-xl font-semibold cursor-pointer shrink-0"
              >
                <span className="btn-premium-text relative z-10 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Book Free Demo
                  <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            </div>
          </div>

          {/* Recent Activity - moved to main area */}
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

          {/* Get a Consultation - Sidebar CTA */}
          <Card className="bg-onyx border-gunmetal border-l-2 border-l-neonblue">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-5 w-5 text-neonblue" />
                <h4 className="font-semibold text-platinum text-sm">Get a Free Consultation</h4>
              </div>
              <p className="text-xs text-silver mb-4">
                See how AI can transform your sales process. 15-min call, zero commitment.
              </p>
              <a
                href="https://calendly.com/aiwithdhruv/makeaiworkforyou"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full bg-neonblue hover:bg-electricblue text-sm gap-2">
                  <Calendar className="h-4 w-4" />
                  Book Demo
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
