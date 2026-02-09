"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getUserProgress,
  syncProgressFromSessions,
  ACHIEVEMENTS,
  type Achievement,
} from "@/lib/achievements";
import { getSessionStats } from "@/lib/session-history";
import {
  Trophy,
  Flame,
  Target,
  TrendingUp,
  Award,
  Lock,
  MessageSquare,
  Mic,
  Phone,
  Swords,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UserProgress = ReturnType<typeof getUserProgress>;
type SessionStats = ReturnType<typeof getSessionStats>;

interface ProgressMilestone {
  category: Achievement["category"];
  current: number;
  next: number;
  label: string;
  color: string;
}

function getNextMilestone(
  category: Achievement["category"],
  currentValue: number
): number {
  const categoryAchievements = ACHIEVEMENTS.filter(
    (a) => a.category === category
  ).sort((a, b) => a.requirement - b.requirement);

  for (const a of categoryAchievements) {
    if (currentValue < a.requirement) return a.requirement;
  }

  const last = categoryAchievements[categoryAchievements.length - 1];
  return last ? last.requirement : 1;
}

export default function ProgressPage() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    syncProgressFromSessions();
    setProgress(getUserProgress());
    setStats(getSessionStats());
    setLoaded(true);
  }, []);

  if (!loaded || !progress || !stats) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-silver">Loading progress...</div>
        </div>
      </DashboardLayout>
    );
  }

  const milestones: ProgressMilestone[] = [
    {
      category: "practice",
      current: progress.totalPractice,
      next: getNextMilestone("practice", progress.totalPractice),
      label: "Practice Sessions",
      color: "bg-neonblue",
    },
    {
      category: "coaching",
      current: progress.totalCoaching,
      next: getNextMilestone("coaching", progress.totalCoaching),
      label: "Coaching Sessions",
      color: "bg-automationgreen",
    },
    {
      category: "tools",
      current: progress.totalTools,
      next: getNextMilestone("tools", progress.totalTools),
      label: "Tool Uses",
      color: "bg-warningamber",
    },
    {
      category: "streak",
      current: progress.currentStreak,
      next: getNextMilestone("streak", progress.currentStreak),
      label: "Day Streak",
      color: "bg-errorred",
    },
    {
      category: "milestone",
      current: progress.totalSessions,
      next: getNextMilestone("milestone", progress.totalSessions),
      label: "Total Sessions",
      color: "bg-purple-400",
    },
  ];

  const topStats = [
    {
      label: "Total Sessions",
      value: progress.totalSessions,
      icon: TrendingUp,
      iconColor: "text-neonblue",
    },
    {
      label: "Current Streak",
      value: `${progress.currentStreak} days`,
      icon: Flame,
      iconColor: "text-errorred",
    },
    {
      label: "Longest Streak",
      value: `${progress.longestStreak} days best`,
      icon: Award,
      iconColor: "text-warningamber",
    },
    {
      label: "Practice",
      value: progress.totalPractice,
      icon: Mic,
      iconColor: "text-automationgreen",
    },
    {
      label: "Coaching",
      value: progress.totalCoaching,
      icon: MessageSquare,
      iconColor: "text-purple-400",
    },
    {
      label: "Tools Used",
      value: progress.totalTools,
      icon: Swords,
      iconColor: "text-warningamber",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
            <Trophy className="h-6 w-6 text-warningamber" />
            Your Progress
          </h1>
          <p className="text-silver mt-1">
            Track your achievements and keep building momentum
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {topStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="bg-graphite border-gunmetal">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Icon className={cn("h-5 w-5 mb-2", stat.iconColor)} />
                  <p className="text-xs text-mist mb-1">{stat.label}</p>
                  <p className="text-lg font-bold text-platinum">
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-graphite border-gunmetal">
          <CardHeader>
            <CardTitle className="text-platinum flex items-center gap-2">
              <Target className="h-5 w-5 text-neonblue" />
              Progress to Next Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {milestones.map((m) => {
              const pct = Math.min(
                Math.round((m.current / m.next) * 100),
                100
              );
              return (
                <div key={m.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-silver">{m.label}</span>
                    <span className="text-xs text-mist">
                      {m.current} / {m.next}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-onyx rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", m.color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold text-platinum mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-warningamber" />
            Achievements
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = progress.unlockedBadges.includes(achievement.id);
              return (
                <div
                  key={achievement.id}
                  className={cn(
                    "relative rounded-xl border p-4 transition-all",
                    unlocked
                      ? "bg-neonblue/5 border-neonblue/50 shadow-[0_0_15px_rgba(0,163,255,0.1)]"
                      : "bg-onyx border-gunmetal opacity-50"
                  )}
                >
                  {!unlocked && (
                    <div className="absolute top-3 right-3">
                      <Lock className="h-4 w-4 text-mist" />
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center gap-2">
                    <span className="text-3xl">{achievement.icon}</span>
                    <h3
                      className={cn(
                        "text-sm font-semibold",
                        unlocked ? "text-platinum" : "text-silver"
                      )}
                    >
                      {achievement.name}
                    </h3>
                    <p className="text-xs text-mist leading-relaxed">
                      {achievement.description}
                    </p>
                    {unlocked ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-neonblue bg-neonblue/10 px-2 py-0.5 rounded-full">
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] text-mist">
                        {achievement.requirement} {achievement.unit} needed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="bg-graphite border-gunmetal">
          <CardHeader>
            <CardTitle className="text-platinum flex items-center gap-2">
              <Phone className="h-5 w-5 text-neonblue" />
              This Week Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-neonblue/10 border border-neonblue/30">
                <span className="text-2xl font-bold text-neonblue">
                  {stats.thisWeek}
                </span>
              </div>
              <div>
                <p className="text-sm text-platinum font-medium">
                  {stats.thisWeek === 1 ? "1 session" : `${stats.thisWeek} sessions`} this week
                </p>
                <p className="text-xs text-mist mt-0.5">
                  {stats.thisMonth} sessions this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
