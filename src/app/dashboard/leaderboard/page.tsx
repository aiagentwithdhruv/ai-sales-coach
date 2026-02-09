"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Medal,
  Flame,
  Target,
  TrendingUp,
  Award,
  Star,
  Zap,
  Crown,
  Shield,
  Swords,
  BookOpen,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimeFilter = "week" | "month" | "all";

interface TeamMember {
  id: string;
  name: string;
  avatar: string; // initials
  score: number;
  sessions: number;
  streak: number;
  badges: string[];
  isCurrentUser?: boolean;
}

interface BadgeInfo {
  id: string;
  name: string;
  icon: typeof Trophy;
  color: string;
}

// ---------------------------------------------------------------------------
// Badge definitions
// ---------------------------------------------------------------------------

const BADGE_MAP: Record<string, BadgeInfo> = {
  closer: {
    id: "closer",
    name: "Closer",
    icon: Target,
    color: "text-automationgreen",
  },
  streak_master: {
    id: "streak_master",
    name: "Streak Master",
    icon: Flame,
    color: "text-errorred",
  },
  top_scorer: {
    id: "top_scorer",
    name: "Top Scorer",
    icon: Star,
    color: "text-warningamber",
  },
  grinder: {
    id: "grinder",
    name: "Grinder",
    icon: Zap,
    color: "text-neonblue",
  },
  champion: {
    id: "champion",
    name: "Champion",
    icon: Crown,
    color: "text-warningamber",
  },
  defender: {
    id: "defender",
    name: "Defender",
    icon: Shield,
    color: "text-purple-400",
  },
  warrior: {
    id: "warrior",
    name: "Warrior",
    icon: Swords,
    color: "text-pink-400",
  },
  learner: {
    id: "learner",
    name: "Learner",
    icon: BookOpen,
    color: "text-sky-400",
  },
};

// ---------------------------------------------------------------------------
// Demo team data
// ---------------------------------------------------------------------------

const DEMO_TEAM: TeamMember[] = [
  {
    id: "demo-1",
    name: "Sarah Chen",
    avatar: "SC",
    score: 9420,
    sessions: 87,
    streak: 14,
    badges: ["champion", "streak_master", "closer"],
  },
  {
    id: "demo-2",
    name: "Mike Johnson",
    avatar: "MJ",
    score: 8850,
    sessions: 74,
    streak: 9,
    badges: ["top_scorer", "grinder"],
  },
  {
    id: "demo-3",
    name: "Emily Rodriguez",
    avatar: "ER",
    score: 8210,
    sessions: 68,
    streak: 12,
    badges: ["streak_master", "closer", "learner"],
  },
  {
    id: "demo-4",
    name: "David Park",
    avatar: "DP",
    score: 7640,
    sessions: 61,
    streak: 5,
    badges: ["warrior", "grinder"],
  },
  {
    id: "demo-5",
    name: "Lisa Wang",
    avatar: "LW",
    score: 7100,
    sessions: 53,
    streak: 7,
    badges: ["defender", "learner"],
  },
  {
    id: "demo-6",
    name: "James Wilson",
    avatar: "JW",
    score: 6500,
    sessions: 48,
    streak: 3,
    badges: ["grinder"],
  },
  {
    id: "demo-7",
    name: "Nina Patel",
    avatar: "NP",
    score: 5900,
    sessions: 42,
    streak: 6,
    badges: ["learner", "closer"],
  },
  {
    id: "demo-8",
    name: "Alex Thompson",
    avatar: "AT",
    score: 5200,
    sessions: 36,
    streak: 2,
    badges: ["warrior"],
  },
  {
    id: "demo-9",
    name: "Maria Garcia",
    avatar: "MG",
    score: 4600,
    sessions: 29,
    streak: 4,
    badges: ["learner"],
  },
  {
    id: "demo-10",
    name: "Ryan O'Brien",
    avatar: "RO",
    score: 3800,
    sessions: 22,
    streak: 1,
    badges: [],
  },
];

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const LEADERBOARD_KEY = "leaderboard-user-stats";

interface UserStats {
  score: number;
  sessions: number;
  streak: number;
  badges: string[];
}

function getUserStats(): UserStats {
  if (typeof window === "undefined")
    return { score: 0, sessions: 0, streak: 0, badges: [] };
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* empty */
  }
  // Derive from session history if available
  try {
    const sessions = localStorage.getItem("sales-coach-sessions");
    if (sessions) {
      const parsed = JSON.parse(sessions);
      const count = Array.isArray(parsed) ? parsed.length : 0;
      const badges: string[] = [];
      if (count >= 5) badges.push("learner");
      if (count >= 20) badges.push("grinder");
      if (count >= 50) badges.push("warrior");
      return {
        score: count * 100 + Math.floor(Math.random() * 50),
        sessions: count,
        streak: Math.min(count, 7),
        badges,
      };
    }
  } catch {
    /* empty */
  }
  return { score: 0, sessions: 0, streak: 0, badges: [] };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [userStats, setUserStats] = useState<UserStats>({
    score: 0,
    sessions: 0,
    streak: 0,
    badges: [],
  });

  useEffect(() => {
    setUserStats(getUserStats());
  }, []);

  // Build full leaderboard with current user merged in
  const leaderboard = useMemo(() => {
    const currentUser: TeamMember = {
      id: "current-user",
      name: "You",
      avatar: "YO",
      score: userStats.score,
      sessions: userStats.sessions,
      streak: userStats.streak,
      badges: userStats.badges,
      isCurrentUser: true,
    };

    // Scale demo scores by time filter
    const scaleMap: Record<TimeFilter, number> = {
      week: 0.15,
      month: 0.45,
      all: 1,
    };
    const scale = scaleMap[timeFilter];

    const scaled = DEMO_TEAM.map((m) => ({
      ...m,
      score: Math.round(m.score * scale),
      sessions: Math.round(m.sessions * scale),
      streak:
        timeFilter === "week"
          ? Math.min(m.streak, 7)
          : timeFilter === "month"
            ? m.streak
            : m.streak,
    }));

    const all = [...scaled, currentUser];
    all.sort((a, b) => b.score - a.score);
    return all;
  }, [userStats, timeFilter]);

  const currentUserRank =
    leaderboard.findIndex((m) => m.isCurrentUser) + 1 || leaderboard.length;

  const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "all", label: "All Time" },
  ];

  const getRankStyle = (rank: number) => {
    if (rank === 1)
      return {
        bg: "bg-warningamber/10",
        border: "border-warningamber/40",
        text: "text-warningamber",
        rankBg: "bg-warningamber",
        rankText: "text-obsidian",
      };
    if (rank === 2)
      return {
        bg: "bg-silver/5",
        border: "border-silver/30",
        text: "text-silver",
        rankBg: "bg-silver",
        rankText: "text-obsidian",
      };
    if (rank === 3)
      return {
        bg: "bg-amber-700/10",
        border: "border-amber-700/30",
        text: "text-amber-600",
        rankBg: "bg-amber-700",
        rankText: "text-white",
      };
    return {
      bg: "bg-transparent",
      border: "border-gunmetal",
      text: "text-mist",
      rankBg: "bg-graphite",
      rankText: "text-silver",
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-warningamber/10 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-warningamber" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-platinum">
              Team Leaderboard
            </h1>
            <p className="text-sm text-silver">
              Compete with your team and climb the ranks
            </p>
          </div>
        </div>

        {/* Time Filter */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-onyx border border-gunmetal">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimeFilter(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                timeFilter === opt.value
                  ? "bg-neonblue/10 text-neonblue"
                  : "text-silver hover:text-platinum"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Your Stats Card */}
      <Card className="bg-gradient-to-r from-neonblue/5 via-onyx to-onyx border-neonblue/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-neonblue/15 border-2 border-neonblue/40 flex items-center justify-center">
                <span className="text-lg font-bold text-neonblue">
                  #{currentUserRank}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-platinum">
                  Your Ranking
                </h3>
                <p className="text-sm text-silver">
                  {currentUserRank <= 3
                    ? "You are in the top 3! Keep it up!"
                    : currentUserRank <= 5
                      ? "Almost there! Push for the podium."
                      : "Keep practicing to climb the ranks."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xl font-bold text-neonblue">
                  {userStats.score.toLocaleString()}
                </p>
                <p className="text-xs text-mist">Score</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-automationgreen">
                  {userStats.sessions}
                </p>
                <p className="text-xs text-mist">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-warningamber">
                  {userStats.streak}
                </p>
                <p className="text-xs text-mist">Day Streak</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-purple-400">
                  {userStats.badges.length}
                </p>
                <p className="text-xs text-mist">Badges</p>
              </div>
            </div>
          </div>

          {/* User Badges */}
          {userStats.badges.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gunmetal">
              <p className="text-xs text-mist mb-2">Your Badges</p>
              <div className="flex flex-wrap gap-2">
                {userStats.badges.map((badgeId) => {
                  const badge = BADGE_MAP[badgeId];
                  if (!badge) return null;
                  const Icon = badge.icon;
                  return (
                    <div
                      key={badgeId}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-graphite border border-gunmetal"
                    >
                      <Icon className={cn("h-3.5 w-3.5", badge.color)} />
                      <span className="text-xs text-platinum">
                        {badge.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4">
        {leaderboard.slice(0, 3).map((member, idx) => {
          const rank = idx + 1;
          const style = getRankStyle(rank);
          const PodiumIcon =
            rank === 1 ? Crown : rank === 2 ? Medal : Award;

          return (
            <Card
              key={member.id}
              className={cn(
                "border transition-all",
                style.bg,
                style.border,
                member.isCurrentUser && "ring-2 ring-neonblue/30"
              )}
            >
              <CardContent className="p-5 flex flex-col items-center text-center">
                <PodiumIcon className={cn("h-6 w-6 mb-2", style.text)} />
                <div
                  className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold mb-2",
                    member.isCurrentUser
                      ? "bg-neonblue/20 border-2 border-neonblue text-neonblue"
                      : cn("border-2", style.border, style.text, "bg-graphite")
                  )}
                >
                  {member.avatar}
                </div>
                <h3
                  className={cn(
                    "font-semibold text-sm",
                    member.isCurrentUser ? "text-neonblue" : "text-platinum"
                  )}
                >
                  {member.name}
                </h3>
                <p className={cn("text-2xl font-bold mt-1", style.text)}>
                  {member.score.toLocaleString()}
                </p>
                <p className="text-xs text-mist mt-0.5">points</p>

                <div className="flex items-center gap-3 mt-3 text-xs text-mist">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {member.sessions}
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-errorred/60" />
                    {member.streak}d
                  </span>
                </div>

                {member.badges.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {member.badges.slice(0, 3).map((badgeId) => {
                      const badge = BADGE_MAP[badgeId];
                      if (!badge) return null;
                      const Icon = badge.icon;
                      return (
                        <div
                          key={badgeId}
                          title={badge.name}
                          className="p-1 rounded-full bg-graphite border border-gunmetal"
                        >
                          <Icon className={cn("h-3 w-3", badge.color)} />
                        </div>
                      );
                    })}
                    {member.badges.length > 3 && (
                      <span className="text-[10px] text-mist">
                        +{member.badges.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full Ranking Table */}
      <Card className="bg-onyx border-gunmetal">
        <CardHeader>
          <CardTitle className="text-platinum flex items-center gap-2">
            <Users className="h-5 w-5 text-neonblue" />
            Full Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs text-mist font-medium">
              <div className="col-span-1">Rank</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-2 text-right">Score</div>
              <div className="col-span-2 text-right">Sessions</div>
              <div className="col-span-1 text-right">Streak</div>
              <div className="col-span-3">Badges</div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gunmetal" />

            {/* Rows */}
            {leaderboard.map((member, idx) => {
              const rank = idx + 1;
              const style = getRankStyle(rank);

              return (
                <div
                  key={member.id}
                  className={cn(
                    "grid grid-cols-12 gap-3 px-4 py-3 rounded-lg items-center transition-colors",
                    member.isCurrentUser
                      ? "bg-neonblue/5 border border-neonblue/20"
                      : "hover:bg-graphite/50 border border-transparent"
                  )}
                >
                  {/* Rank */}
                  <div className="col-span-1">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                        style.rankBg,
                        style.rankText
                      )}
                    >
                      {rank}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                        member.isCurrentUser
                          ? "bg-neonblue/20 text-neonblue border border-neonblue/40"
                          : "bg-graphite text-silver border border-gunmetal"
                      )}
                    >
                      {member.avatar}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium truncate",
                        member.isCurrentUser ? "text-neonblue" : "text-platinum"
                      )}
                    >
                      {member.name}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-semibold text-platinum">
                      {member.score.toLocaleString()}
                    </span>
                  </div>

                  {/* Sessions */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm text-silver">
                      {member.sessions}
                    </span>
                  </div>

                  {/* Streak */}
                  <div className="col-span-1 text-right">
                    <span className="text-sm text-silver flex items-center justify-end gap-1">
                      <Flame className="h-3 w-3 text-errorred/60" />
                      {member.streak}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {member.badges.length === 0 && (
                        <span className="text-xs text-mist">--</span>
                      )}
                      {member.badges.slice(0, 4).map((badgeId) => {
                        const badge = BADGE_MAP[badgeId];
                        if (!badge) return null;
                        const Icon = badge.icon;
                        return (
                          <div
                            key={badgeId}
                            title={badge.name}
                            className="p-1 rounded-full bg-graphite border border-gunmetal"
                          >
                            <Icon className={cn("h-3 w-3", badge.color)} />
                          </div>
                        );
                      })}
                      {member.badges.length > 4 && (
                        <span className="text-[10px] text-mist ml-0.5">
                          +{member.badges.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Badge Legend */}
      <Card className="bg-onyx border-gunmetal">
        <CardHeader>
          <CardTitle className="text-platinum flex items-center gap-2">
            <Award className="h-5 w-5 text-warningamber" />
            Badge Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(BADGE_MAP).map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.id}
                  className="flex items-center gap-2.5 p-3 rounded-lg bg-graphite border border-gunmetal"
                >
                  <div className="p-1.5 rounded-full bg-onyx border border-gunmetal">
                    <Icon className={cn("h-4 w-4", badge.color)} />
                  </div>
                  <span className="text-sm text-platinum">{badge.name}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
