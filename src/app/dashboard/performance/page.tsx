"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCRM } from "@/hooks/useCRM";
import { getSessionStats, getSessions } from "@/lib/session-history";
import type { PipelineAnalytics, DealForecast } from "@/types/crm";
import {
  Target,
  TrendingUp,
  Trophy,
  Mic,
  MessageSquare,
  Phone,
  Swords,
  Clock,
  Zap,
  ArrowRight,
  BarChart3,
  DollarSign,
  Loader2,
  Flame,
  Award,
  Brain,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SkillScore {
  name: string;
  score: number;
  sessions: number;
  trend: "up" | "down" | "stable";
}

export default function PerformancePage() {
  const crm = useCRM();
  const [analytics, setAnalytics] = useState<PipelineAnalytics | null>(null);
  const [forecast, setForecast] = useState<DealForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    thisWeek: 0,
    thisMonth: 0,
    byType: { coach: 0, practice: 0, call: 0, tool: 0 },
  });
  const [recentSessions, setRecentSessions] = useState<
    Array<{ id: string; type: string; title: string; timestamp: number; score?: number }>
  >([]);
  const [skillScores, setSkillScores] = useState<SkillScore[]>([]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);

      // Load CRM analytics + forecast
      const [analyticsData, forecastData] = await Promise.all([
        crm.fetchAnalytics(),
        crm.fetchForecast(),
      ]);
      if (analyticsData) setAnalytics(analyticsData);
      if (forecastData) setForecast(forecastData);

      // Load session stats
      setSessionStats(getSessionStats());
      const sessions = getSessions().slice(0, 10);
      setRecentSessions(
        sessions.map((s: { id: string; type: string; title: string; timestamp: number; score?: number }) => ({
          id: s.id,
          type: s.type,
          title: s.title,
          timestamp: s.timestamp,
          score: s.score,
        }))
      );

      // Calculate skill scores from sessions
      const practicesSessions = sessions.filter((s: { type: string }) => s.type === "practice");
      const coachSessions = sessions.filter((s: { type: string }) => s.type === "coach");
      const callSessions = sessions.filter((s: { type: string }) => s.type === "call");

      setSkillScores([
        {
          name: "Objection Handling",
          score: coachSessions.length > 0 ? Math.min(40 + coachSessions.length * 8, 95) : 0,
          sessions: coachSessions.length,
          trend: coachSessions.length > 3 ? "up" : "stable",
        },
        {
          name: "Live Pitching",
          score: practicesSessions.length > 0 ? Math.min(35 + practicesSessions.length * 10, 95) : 0,
          sessions: practicesSessions.length,
          trend: practicesSessions.length > 2 ? "up" : "stable",
        },
        {
          name: "Call Analysis",
          score: callSessions.length > 0 ? Math.min(50 + callSessions.length * 7, 95) : 0,
          sessions: callSessions.length,
          trend: callSessions.length > 1 ? "up" : "stable",
        },
        {
          name: "Discovery",
          score: (coachSessions.length + practicesSessions.length) > 0
            ? Math.min(30 + (coachSessions.length + practicesSessions.length) * 6, 90) : 0,
          sessions: coachSessions.length + practicesSessions.length,
          trend: "stable",
        },
        {
          name: "Closing",
          score: practicesSessions.length > 1 ? Math.min(25 + practicesSessions.length * 12, 90) : 0,
          sessions: practicesSessions.length,
          trend: practicesSessions.length > 3 ? "up" : "stable",
        },
      ]);

      setLoading(false);
    };

    loadAll();
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-automationgreen";
    if (score >= 50) return "text-warningamber";
    if (score > 0) return "text-errorred";
    return "text-mist";
  };

  const overallScore = skillScores.length > 0
    ? Math.round(skillScores.reduce((sum, s) => sum + s.score, 0) / skillScores.length)
    : 0;

  const totalPracticeTime = sessionStats.total * 5; // Rough estimate: 5 min avg per session

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
            <Trophy className="h-6 w-6 text-warningamber" />
            Rep Performance
          </h1>
          <p className="text-sm text-silver mt-1">
            Track your skills, pipeline health, and improvement over time
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-neonblue" />
          </div>
        ) : (
          <>
            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat-card-premium rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warningamber/10">
                      <Award className="h-5 w-5 text-warningamber" />
                    </div>
                    <div>
                      <p className={cn("text-2xl font-bold", getScoreColor(overallScore))}>
                        {overallScore || "—"}
                      </p>
                      <p className="text-xs text-mist">Skill Score</p>
                    </div>
                  </div>
                </CardContent>
              </div>
              <div className="stat-card-premium rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-neonblue/10">
                      <Target className="h-5 w-5 text-neonblue" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-platinum">
                        {analytics?.winLoss.winRate || 0}%
                      </p>
                      <p className="text-xs text-mist">Win Rate</p>
                    </div>
                  </div>
                </CardContent>
              </div>
              <div className="stat-card-premium rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-automationgreen/10">
                      <DollarSign className="h-5 w-5 text-automationgreen" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-automationgreen">
                        {forecast ? formatCurrency(forecast.expectedRevenue) : "—"}
                      </p>
                      <p className="text-xs text-mist">Forecast</p>
                    </div>
                  </div>
                </CardContent>
              </div>
              <div className="stat-card-premium rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-400/10">
                      <Flame className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-400">
                        {sessionStats.total}
                      </p>
                      <p className="text-xs text-mist">Total Sessions</p>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Skills Breakdown */}
              <div className="card-metallic rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
                    <Brain className="h-5 w-5 text-neonblue" />
                    Skill Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {skillScores.some((s) => s.score > 0) ? (
                    <div className="space-y-4">
                      {skillScores.map((skill) => (
                        <div key={skill.name}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-platinum">{skill.name}</span>
                              {skill.trend === "up" && (
                                <TrendingUp className="h-3 w-3 text-automationgreen" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-mist">
                                {skill.sessions} session{skill.sessions !== 1 ? "s" : ""}
                              </span>
                              <span className={cn("text-sm font-bold", getScoreColor(skill.score))}>
                                {skill.score > 0 ? skill.score : "—"}
                              </span>
                            </div>
                          </div>
                          <Progress
                            value={skill.score}
                            className="h-2 bg-onyx"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="h-8 w-8 text-mist mx-auto mb-2" />
                      <p className="text-sm text-silver">No practice data yet</p>
                      <p className="text-xs text-mist mb-3">
                        Start coaching or practice sessions to build your skill profile
                      </p>
                      <Link href="/dashboard/coach">
                        <Button size="sm" className="bg-neonblue hover:bg-electricblue text-white gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Start Coaching
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </div>

              {/* Practice Activity */}
              <div className="card-metallic rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-automationgreen" />
                    Practice Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-onyx/50 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-neonblue" />
                      </div>
                      <p className="text-xl font-bold text-neonblue">
                        {sessionStats.byType.coach}
                      </p>
                      <p className="text-xs text-mist">Coaching</p>
                    </div>
                    <div className="p-3 rounded-lg bg-onyx/50 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Mic className="h-4 w-4 text-automationgreen" />
                      </div>
                      <p className="text-xl font-bold text-automationgreen">
                        {sessionStats.byType.practice}
                      </p>
                      <p className="text-xs text-mist">Voice Practice</p>
                    </div>
                    <div className="p-3 rounded-lg bg-onyx/50 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Phone className="h-4 w-4 text-warningamber" />
                      </div>
                      <p className="text-xl font-bold text-warningamber">
                        {sessionStats.byType.call}
                      </p>
                      <p className="text-xs text-mist">Calls Analyzed</p>
                    </div>
                    <div className="p-3 rounded-lg bg-onyx/50 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-silver" />
                      </div>
                      <p className="text-xl font-bold text-silver">
                        {totalPracticeTime}m
                      </p>
                      <p className="text-xs text-mist">Est. Practice Time</p>
                    </div>
                  </div>
                  <p className="text-xs text-mist">
                    This week: {sessionStats.thisWeek} session{sessionStats.thisWeek !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </div>

              {/* Pipeline Health */}
              {analytics && (
                <div className="card-metallic rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-warningamber" />
                      Pipeline Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-silver">Win Rate</span>
                        <span className={cn("text-sm font-bold", getScoreColor(analytics.winLoss.winRate))}>
                          {analytics.winLoss.winRate}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-silver">Avg Days to Win</span>
                        <span className="text-sm font-medium text-platinum">
                          {analytics.winLoss.avgDaysToWin || "—"} days
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-silver">Avg Won Deal</span>
                        <span className="text-sm font-medium text-automationgreen">
                          {analytics.winLoss.avgWonDealValue > 0
                            ? formatCurrency(analytics.winLoss.avgWonDealValue)
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-silver">Stalled Deals</span>
                        <span className={cn(
                          "text-sm font-medium",
                          analytics.stalledDeals.length > 0 ? "text-errorred" : "text-automationgreen"
                        )}>
                          {analytics.stalledDeals.length}
                        </span>
                      </div>
                      {analytics.stalledDeals.length > 0 && (
                        <Link href="/dashboard/crm/analytics">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-gunmetal text-silver hover:text-platinum gap-2 mt-2"
                          >
                            View Stalled Deals
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </div>
              )}

              {/* Recommended Actions */}
              <div className="card-metallic rounded-xl border-l-2 border-l-neonblue">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-platinum flex items-center gap-2">
                    <Zap className="h-5 w-5 text-neonblue" />
                    Recommended Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sessionStats.byType.coach === 0 && (
                      <Link href="/dashboard/coach" className="block">
                        <div className="p-3 rounded-lg bg-onyx/50 hover:bg-onyx transition-colors group">
                          <p className="text-sm text-platinum font-medium group-hover:text-neonblue transition-colors">
                            Start your first coaching session
                          </p>
                          <p className="text-xs text-mist mt-1">
                            Practice handling common objections with AI
                          </p>
                        </div>
                      </Link>
                    )}
                    {sessionStats.byType.practice === 0 && (
                      <Link href="/dashboard/practice" className="block">
                        <div className="p-3 rounded-lg bg-onyx/50 hover:bg-onyx transition-colors group">
                          <p className="text-sm text-platinum font-medium group-hover:text-neonblue transition-colors">
                            Try voice practice
                          </p>
                          <p className="text-xs text-mist mt-1">
                            Role-play with AI personas using real-time voice
                          </p>
                        </div>
                      </Link>
                    )}
                    {analytics && analytics.stalledDeals.length > 0 && (
                      <Link href="/dashboard/crm/analytics" className="block">
                        <div className="p-3 rounded-lg bg-onyx/50 hover:bg-onyx transition-colors group">
                          <p className="text-sm text-platinum font-medium group-hover:text-neonblue transition-colors">
                            Review {analytics.stalledDeals.length} stalled deal{analytics.stalledDeals.length > 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-mist mt-1">
                            Deals with no activity for 7+ days
                          </p>
                        </div>
                      </Link>
                    )}
                    {forecast && forecast.atRisk.length > 0 && (
                      <Link href="/dashboard/crm/analytics" className="block">
                        <div className="p-3 rounded-lg bg-onyx/50 hover:bg-onyx transition-colors group">
                          <p className="text-sm text-platinum font-medium group-hover:text-neonblue transition-colors">
                            {forecast.atRisk.length} deal{forecast.atRisk.length > 1 ? "s" : ""} at risk
                          </p>
                          <p className="text-xs text-mist mt-1">
                            {formatCurrency(forecast.atRisk.reduce((sum, r) => sum + r.contact.deal_value, 0))} in pipeline value at risk
                          </p>
                        </div>
                      </Link>
                    )}
                    {sessionStats.total > 0 && sessionStats.thisWeek === 0 && (
                      <Link href="/dashboard/practice" className="block">
                        <div className="p-3 rounded-lg bg-onyx/50 hover:bg-onyx transition-colors group">
                          <p className="text-sm text-platinum font-medium group-hover:text-neonblue transition-colors">
                            No practice this week
                          </p>
                          <p className="text-xs text-mist mt-1">
                            Keep your skills sharp with a quick session
                          </p>
                        </div>
                      </Link>
                    )}
                    {sessionStats.total === 0 && !analytics && (
                      <div className="p-3 rounded-lg bg-onyx/50">
                        <p className="text-sm text-silver">
                          Start using QuotaHit to get personalized recommendations
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
