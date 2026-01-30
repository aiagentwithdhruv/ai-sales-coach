"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Phone,
  MessageSquare,
  Trophy,
  Calendar,
  Users,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock analytics data
const PERFORMANCE_METRICS = [
  {
    label: "Win Rate",
    value: 32,
    target: 35,
    change: +5,
    trend: "up",
  },
  {
    label: "Avg Deal Size",
    value: 48500,
    target: 50000,
    change: +12,
    trend: "up",
    isCurrency: true,
  },
  {
    label: "Sales Cycle",
    value: 28,
    target: 25,
    change: -3,
    trend: "down",
    unit: "days",
  },
  {
    label: "Quota Attainment",
    value: 87,
    target: 100,
    change: +8,
    trend: "up",
    unit: "%",
  },
];

const SKILL_SCORES = [
  { skill: "Discovery", score: 85, benchmark: 75 },
  { skill: "Objection Handling", score: 72, benchmark: 70 },
  { skill: "Rapport Building", score: 90, benchmark: 80 },
  { skill: "Closing", score: 68, benchmark: 75 },
  { skill: "Follow-up", score: 78, benchmark: 72 },
  { skill: "Product Knowledge", score: 82, benchmark: 78 },
];

const ACTIVITY_STATS = [
  { label: "Calls Made", value: 127, change: +15 },
  { label: "Emails Sent", value: 342, change: +23 },
  { label: "Demos Given", value: 18, change: +4 },
  { label: "Proposals Sent", value: 12, change: +2 },
];

const WEEKLY_PROGRESS = [
  { day: "Mon", calls: 24, practice: 2 },
  { day: "Tue", calls: 31, practice: 1 },
  { day: "Wed", calls: 28, practice: 3 },
  { day: "Thu", calls: 19, practice: 2 },
  { day: "Fri", calls: 25, practice: 1 },
];

const TEAM_LEADERBOARD = [
  { rank: 1, name: "Sarah Chen", score: 94, deals: 8 },
  { rank: 2, name: "Mike Johnson", score: 89, deals: 7 },
  { rank: 3, name: "You", score: 85, deals: 6, isCurrentUser: true },
  { rank: 4, name: "Lisa Wang", score: 82, deals: 5 },
  { rank: 5, name: "David Park", score: 78, deals: 5 },
];

export default function AnalyticsPage() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-neonblue" />
            Performance Analytics
          </h1>
          <p className="text-silver mt-1">
            Track your sales performance and coaching progress
          </p>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PERFORMANCE_METRICS.map((metric) => (
            <Card key={metric.label} className="bg-graphite border-gunmetal">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm text-mist">{metric.label}</p>
                  <Badge
                    className={cn(
                      "text-xs",
                      metric.trend === "up"
                        ? "bg-automationgreen/20 text-automationgreen"
                        : "bg-errorred/20 text-errorred"
                    )}
                  >
                    {metric.trend === "up" ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    {metric.change > 0 ? "+" : ""}
                    {metric.change}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-platinum">
                  {metric.isCurrency
                    ? formatCurrency(metric.value)
                    : metric.value}
                  {metric.unit && (
                    <span className="text-sm font-normal text-mist ml-1">
                      {metric.unit}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-mist mb-1">
                    <span>Progress to target</span>
                    <span>
                      {Math.round((metric.value / metric.target) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min((metric.value / metric.target) * 100, 100)}
                    className="h-1.5 bg-onyx"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Skills Radar */}
          <Card className="lg:col-span-2 bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center gap-2">
                <Target className="h-5 w-5 text-neonblue" />
                Skill Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {SKILL_SCORES.map((skill) => (
                  <div key={skill.skill}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-silver">{skill.skill}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            skill.score >= skill.benchmark
                              ? "text-automationgreen"
                              : "text-warningamber"
                          )}
                        >
                          {skill.score}%
                        </span>
                        <span className="text-xs text-mist">
                          (avg: {skill.benchmark}%)
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={skill.score} className="h-2 bg-onyx" />
                      <div
                        className="absolute top-0 h-2 w-0.5 bg-mist"
                        style={{ left: `${skill.benchmark}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-mist">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-neonblue" />
                  <span>Your Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-mist" />
                  <span>Team Average</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Leaderboard */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center gap-2">
                <Trophy className="h-5 w-5 text-warningamber" />
                Team Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {TEAM_LEADERBOARD.map((member) => (
                <div
                  key={member.rank}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg",
                    member.isCurrentUser ? "bg-neonblue/10" : "bg-onyx"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      member.rank === 1
                        ? "bg-warningamber text-obsidian"
                        : member.rank === 2
                        ? "bg-silver text-obsidian"
                        : member.rank === 3
                        ? "bg-warningamber/50 text-obsidian"
                        : "bg-gunmetal text-silver"
                    )}
                  >
                    {member.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        member.isCurrentUser ? "text-neonblue" : "text-platinum"
                      )}
                    >
                      {member.name}
                    </p>
                    <p className="text-xs text-mist">{member.deals} deals</p>
                  </div>
                  <div className="text-sm font-medium text-platinum">
                    {member.score}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Stats */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center gap-2">
                <Phone className="h-5 w-5 text-neonblue" />
                Activity This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {ACTIVITY_STATS.map((stat) => (
                  <div key={stat.label} className="p-4 rounded-lg bg-onyx">
                    <p className="text-xs text-mist mb-1">{stat.label}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-platinum">
                        {stat.value}
                      </span>
                      <span className="text-xs text-automationgreen mb-1">
                        +{stat.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Progress */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center gap-2">
                <Calendar className="h-5 w-5 text-neonblue" />
                Weekly Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {WEEKLY_PROGRESS.map((day) => (
                  <div key={day.day} className="flex items-center gap-4">
                    <span className="w-8 text-sm text-mist">{day.day}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div
                        className="h-6 bg-neonblue/20 rounded"
                        style={{ width: `${(day.calls / 35) * 100}%` }}
                      >
                        <div
                          className="h-full bg-neonblue rounded"
                          style={{ width: `${(day.calls / 35) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-silver w-8">
                        {day.calls}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: day.practice }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-automationgreen"
                        />
                      ))}
                      {Array.from({ length: 3 - day.practice }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-gunmetal"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-mist">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-neonblue" />
                  <span>Calls</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-automationgreen" />
                  <span>Practice Sessions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
