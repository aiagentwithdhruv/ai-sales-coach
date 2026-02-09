"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Target,
  Flame,
  Calendar,
  Brain,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
} from "recharts";

// ---------- Types ----------
interface ScoreDataPoint {
  date: string;
  label: string;
  score: number;
}

interface SkillScore {
  skill: string;
  score: number;
  fullMark: number;
}

interface HeatmapCell {
  day: string;
  week: number;
  count: number;
}

interface SessionRecord {
  id: string;
  date: string;
  type: "Coach" | "Practice" | "Call";
  score: number;
  duration: number; // in minutes
}

interface AnalyticsData {
  totalSessions: number;
  averageScore: number;
  creditsUsed: number;
  practiceStreak: number;
  scoreTrend: ScoreDataPoint[];
  skillScores: SkillScore[];
  activityHeatmap: HeatmapCell[];
  sessionHistory: SessionRecord[];
  generatedAt: number;
}

type SortKey = "date" | "type" | "score" | "duration";
type SortDir = "asc" | "desc";

// ---------- Constants ----------
const STORAGE_KEY = "ai_sales_coach_analytics";

const COLORS = {
  neonblue: "#00B3FF",
  automationgreen: "#2DFF8E",
  warningamber: "#FFB800",
  errorred: "#FF4757",
  graphite: "#121821",
  onyx: "#171E27",
  gunmetal: "#2A2F36",
  steel: "#3A4048",
  platinum: "#C7CCD1",
  silver: "#9AA4AF",
  mist: "#6B7280",
};

const SKILL_LABELS = [
  "Discovery",
  "Objection Handling",
  "Closing",
  "Rapport",
  "Value Prop",
  "Active Listening",
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SESSION_TYPES: SessionRecord["type"][] = ["Coach", "Practice", "Call"];

// ---------- Data Generation ----------
function generateSampleData(): AnalyticsData {
  const now = Date.now();
  const dayMs = 86400000;

  // Score trend: 30 days with a gradual upward trajectory + noise
  const scoreTrend: ScoreDataPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    const baseScore = 58 + ((29 - i) / 29) * 18; // trend from ~58 to ~76
    const noise = Math.floor(Math.random() * 14) - 7;
    const score = Math.max(30, Math.min(100, Math.round(baseScore + noise)));
    scoreTrend.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score,
    });
  }

  // Skill scores with realistic variation
  const skillScores: SkillScore[] = [
    { skill: "Discovery", score: 78, fullMark: 100 },
    { skill: "Objection Handling", score: 55, fullMark: 100 },
    { skill: "Closing", score: 68, fullMark: 100 },
    { skill: "Rapport", score: 85, fullMark: 100 },
    { skill: "Value Prop", score: 72, fullMark: 100 },
    { skill: "Active Listening", score: 80, fullMark: 100 },
  ];

  // Activity heatmap: 4 weeks x 7 days
  const activityHeatmap: HeatmapCell[] = [];
  for (let week = 0; week < 4; week++) {
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const isWeekend = dayIdx >= 5;
      const maxCount = isWeekend ? 2 : 5;
      const count = Math.floor(Math.random() * (maxCount + 1));
      activityHeatmap.push({
        day: DAY_LABELS[dayIdx],
        week,
        count,
      });
    }
  }

  // Session history: 20 sessions over the last 30 days
  const sessionHistory: SessionRecord[] = [];
  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const d = new Date(now - daysAgo * dayMs);
    const type = SESSION_TYPES[Math.floor(Math.random() * SESSION_TYPES.length)];
    const baseScore = type === "Coach" ? 72 : type === "Practice" ? 65 : 60;
    const score = Math.max(30, Math.min(100, baseScore + Math.floor(Math.random() * 24) - 8));
    const duration = type === "Coach" ? 15 + Math.floor(Math.random() * 20) : type === "Practice" ? 5 + Math.floor(Math.random() * 15) : 20 + Math.floor(Math.random() * 25);
    sessionHistory.push({
      id: `session-${i}`,
      date: d.toISOString().slice(0, 10),
      type,
      score,
      duration,
    });
  }
  // Sort by date descending
  sessionHistory.sort((a, b) => b.date.localeCompare(a.date));

  const totalSessions = sessionHistory.length;
  const averageScore = Math.round(
    sessionHistory.reduce((s, r) => s + r.score, 0) / totalSessions
  );
  const creditsUsed = totalSessions * 3 + Math.floor(Math.random() * 20);
  const practiceStreak = 4 + Math.floor(Math.random() * 8); // 4-11 day streak

  return {
    totalSessions,
    averageScore,
    creditsUsed,
    practiceStreak,
    scoreTrend,
    skillScores,
    activityHeatmap,
    sessionHistory,
    generatedAt: now,
  };
}

function loadOrGenerateData(): AnalyticsData {
  if (typeof window === "undefined") return generateSampleData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AnalyticsData;
      // Regenerate if older than 24 hours
      if (Date.now() - parsed.generatedAt < 86400000) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  const data = generateSampleData();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded, ignore
  }
  return data;
}

// ---------- Custom Tooltip ----------
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-gunmetal bg-onyx px-3 py-2 shadow-lg">
      <p className="text-xs text-mist mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-semibold" style={{ color: COLORS.neonblue }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

// ---------- Heatmap Cell Color ----------
function heatmapColor(count: number): string {
  if (count === 0) return COLORS.onyx;
  if (count === 1) return `${COLORS.neonblue}33`; // 20% opacity
  if (count === 2) return `${COLORS.neonblue}66`; // 40% opacity
  if (count === 3) return `${COLORS.neonblue}99`; // 60% opacity
  if (count === 4) return `${COLORS.neonblue}CC`; // 80% opacity
  return COLORS.neonblue; // 100%
}

// ---------- Insights Generator ----------
function generateInsights(data: AnalyticsData): string[] {
  const insights: string[] = [];

  // Find weakest skill
  const weakest = [...data.skillScores].sort((a, b) => a.score - b.score)[0];
  insights.push(`Your top improvement area is ${weakest.skill} (${weakest.score}/100)`);

  // Find busiest day
  const dayTotals: Record<string, number> = {};
  data.activityHeatmap.forEach((cell) => {
    dayTotals[cell.day] = (dayTotals[cell.day] || 0) + cell.count;
  });
  const busiestDay = Object.entries(dayTotals).sort(([, a], [, b]) => b - a)[0];
  if (busiestDay) {
    insights.push(`You practice most on ${busiestDay[0]}s`);
  }

  // Score improvement trend
  const first7 = data.scoreTrend.slice(0, 7);
  const last7 = data.scoreTrend.slice(-7);
  const avgFirst = Math.round(first7.reduce((s, d) => s + d.score, 0) / first7.length);
  const avgLast = Math.round(last7.reduce((s, d) => s + d.score, 0) / last7.length);
  const diff = avgLast - avgFirst;
  if (diff > 0) {
    insights.push(`Your scores have improved ${diff}% this month`);
  } else if (diff < 0) {
    insights.push(`Your scores have dipped ${Math.abs(diff)}% recently -- keep practicing!`);
  } else {
    insights.push("Your scores are holding steady -- push for the next level!");
  }

  // Strongest skill
  const strongest = [...data.skillScores].sort((a, b) => b.score - a.score)[0];
  insights.push(`Your strongest skill is ${strongest.skill} at ${strongest.score}/100`);

  // Average session length
  const avgDuration = Math.round(
    data.sessionHistory.reduce((s, r) => s + r.duration, 0) / data.sessionHistory.length
  );
  insights.push(`Your average session lasts ${avgDuration} minutes`);

  return insights;
}

// ---------- Main Component ----------
export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    setData(loadOrGenerateData());
  }, []);

  const handleRefresh = useCallback(() => {
    const fresh = generateSampleData();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // ignore
    }
    setData(fresh);
  }, []);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey]
  );

  const sortedSessions = useMemo(() => {
    if (!data) return [];
    const sessions = [...data.sessionHistory].slice(0, 10);
    sessions.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = a.date.localeCompare(b.date);
      else if (sortKey === "type") cmp = a.type.localeCompare(b.type);
      else if (sortKey === "score") cmp = a.score - b.score;
      else if (sortKey === "duration") cmp = a.duration - b.duration;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sessions;
  }, [data, sortKey, sortDir]);

  const insights = useMemo(() => (data ? generateInsights(data) : []), [data]);

  // SSR guard
  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neonblue border-t-transparent rounded-full animate-spin" />
          <p className="text-silver text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Calculate changes for stat cards
  const first10Scores = data.scoreTrend.slice(0, 10).map((d) => d.score);
  const last10Scores = data.scoreTrend.slice(-10).map((d) => d.score);
  const avgFirst10 = Math.round(first10Scores.reduce((s, v) => s + v, 0) / first10Scores.length);
  const avgLast10 = Math.round(last10Scores.reduce((s, v) => s + v, 0) / last10Scores.length);
  const scoreChange = avgLast10 - avgFirst10;

  return (
    <div className="p-6 space-y-6">
      {/* ---------- Page Header ---------- */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-neonblue" />
            Performance Analytics
          </h1>
          <p className="text-silver mt-1">
            Track your sales coaching progress and skill development
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="border-gunmetal text-silver hover:text-platinum hover:border-neonblue bg-transparent"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* ---------- 1. Top Stats Row ---------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Practice Sessions */}
        <Card className="bg-graphite border-gunmetal">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-neonblue/10">
                <BarChart3 className="h-5 w-5 text-neonblue" />
              </div>
              <span className="flex items-center text-xs font-medium text-automationgreen">
                <ArrowUp className="h-3 w-3 mr-0.5" />
                +3 this week
              </span>
            </div>
            <p className="text-3xl font-bold text-platinum">{data.totalSessions}</p>
            <p className="text-sm text-mist mt-1">Total Practice Sessions</p>
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card className="bg-graphite border-gunmetal">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-automationgreen/10">
                <TrendingUp className="h-5 w-5 text-automationgreen" />
              </div>
              <span
                className={`flex items-center text-xs font-medium ${
                  scoreChange >= 0 ? "text-automationgreen" : "text-errorred"
                }`}
              >
                {scoreChange >= 0 ? (
                  <ArrowUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-0.5" />
                )}
                {scoreChange >= 0 ? "+" : ""}
                {scoreChange}%
              </span>
            </div>
            <p className="text-3xl font-bold text-platinum">{data.averageScore}</p>
            <p className="text-sm text-mist mt-1">Average Score</p>
          </CardContent>
        </Card>

        {/* Credits Used */}
        <Card className="bg-graphite border-gunmetal">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-warningamber/10">
                <Zap className="h-5 w-5 text-warningamber" />
              </div>
              <span className="text-xs font-medium text-silver">this month</span>
            </div>
            <p className="text-3xl font-bold text-platinum">{data.creditsUsed}</p>
            <p className="text-sm text-mist mt-1">Credits Used</p>
          </CardContent>
        </Card>

        {/* Practice Streak */}
        <Card className="bg-graphite border-gunmetal">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-errorred/10">
                <Flame className="h-5 w-5 text-[#FF4757]" />
              </div>
              <span className="text-xs font-medium text-automationgreen">
                Personal best!
              </span>
            </div>
            <p className="text-3xl font-bold text-platinum">
              {data.practiceStreak}
              <span className="text-base font-normal text-mist ml-1">days</span>
            </p>
            <p className="text-sm text-mist mt-1">Current Streak</p>
          </CardContent>
        </Card>
      </div>

      {/* ---------- 2. Score Trend + 3. Skills Radar ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Trend Chart */}
        <Card className="lg:col-span-2 bg-graphite border-gunmetal">
          <CardHeader>
            <CardTitle className="text-platinum flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-neonblue" />
              Score Trend
              <span className="text-xs font-normal text-mist ml-2">Last 30 days</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.scoreTrend}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={COLORS.gunmetal}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke={COLORS.mist}
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: COLORS.gunmetal }}
                    interval={4}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke={COLORS.mist}
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: COLORS.gunmetal }}
                    tickCount={6}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Score"
                    stroke={COLORS.neonblue}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: COLORS.neonblue,
                      stroke: COLORS.graphite,
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Skills Radar Chart */}
        <Card className="bg-graphite border-gunmetal">
          <CardHeader>
            <CardTitle className="text-platinum flex items-center gap-2">
              <Target className="h-5 w-5 text-neonblue" />
              Skills Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.skillScores}>
                  <PolarGrid
                    stroke={COLORS.gunmetal}
                    gridType="polygon"
                  />
                  <PolarAngleAxis
                    dataKey="skill"
                    stroke={COLORS.silver}
                    fontSize={11}
                    tickLine={false}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    stroke={COLORS.gunmetal}
                    fontSize={10}
                    tickCount={5}
                    tick={{ fill: COLORS.mist }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke={COLORS.neonblue}
                    fill={COLORS.neonblue}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Skill breakdown list */}
            <div className="mt-2 space-y-1.5">
              {data.skillScores.map((s) => (
                <div key={s.skill} className="flex items-center justify-between text-xs">
                  <span className="text-silver">{s.skill}</span>
                  <span
                    className={`font-medium ${
                      s.score >= 75
                        ? "text-automationgreen"
                        : s.score >= 60
                        ? "text-warningamber"
                        : "text-[#FF4757]"
                    }`}
                  >
                    {s.score}/100
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---------- 4. Activity Heatmap + 6. AI Insights ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Heatmap */}
        <Card className="bg-graphite border-gunmetal">
          <CardHeader>
            <CardTitle className="text-platinum flex items-center gap-2">
              <Calendar className="h-5 w-5 text-neonblue" />
              Activity Heatmap
              <span className="text-xs font-normal text-mist ml-2">Last 4 weeks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {/* Column headers */}
              <div className="flex items-center gap-1 mb-2">
                <div className="w-10" />
                {["Week 1", "Week 2", "Week 3", "Week 4"].map((w) => (
                  <div
                    key={w}
                    className="flex-1 text-center text-[10px] text-mist"
                  >
                    {w}
                  </div>
                ))}
              </div>
              {/* Grid rows */}
              {DAY_LABELS.map((day, dayIdx) => (
                <div key={day} className="flex items-center gap-1">
                  <div className="w-10 text-xs text-mist text-right pr-2">{day}</div>
                  {[0, 1, 2, 3].map((week) => {
                    const cell = data.activityHeatmap.find(
                      (c) => c.day === day && c.week === week
                    );
                    const count = cell?.count || 0;
                    return (
                      <div
                        key={`${day}-${week}`}
                        className="flex-1 aspect-square rounded-md transition-colors cursor-default relative group"
                        style={{ backgroundColor: heatmapColor(count) }}
                        title={`${day}, Week ${week + 1}: ${count} session${count !== 1 ? "s" : ""}`}
                      >
                        {/* Hover tooltip */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                          <div className="bg-onyx border border-gunmetal rounded px-2 py-1 text-[10px] text-platinum whitespace-nowrap shadow-lg">
                            {count} session{count !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gunmetal">
                <span className="text-[10px] text-mist">Less</span>
                {[0, 1, 2, 3, 4, 5].map((v) => (
                  <div
                    key={v}
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: heatmapColor(v) }}
                  />
                ))}
                <span className="text-[10px] text-mist">More</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="bg-graphite border-gunmetal">
          <CardHeader>
            <CardTitle className="text-platinum flex items-center gap-2">
              <Brain className="h-5 w-5 text-neonblue" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, idx) => {
                // Icon + color per insight type
                const iconColor =
                  idx === 0
                    ? "text-warningamber"
                    : idx === 1
                    ? "text-neonblue"
                    : idx === 2
                    ? "text-automationgreen"
                    : idx === 3
                    ? "text-neonblue"
                    : "text-silver";

                const bgColor =
                  idx === 0
                    ? "bg-warningamber/10 border-warningamber/20"
                    : idx === 1
                    ? "bg-neonblue/10 border-neonblue/20"
                    : idx === 2
                    ? "bg-automationgreen/10 border-automationgreen/20"
                    : idx === 3
                    ? "bg-neonblue/10 border-neonblue/20"
                    : "bg-onyx border-gunmetal";

                const InsightIcon =
                  idx === 0
                    ? Target
                    : idx === 1
                    ? Calendar
                    : idx === 2
                    ? TrendingUp
                    : idx === 3
                    ? Flame
                    : BarChart3;

                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${bgColor} transition-colors`}
                  >
                    <div className="mt-0.5">
                      <InsightIcon className={`h-4 w-4 ${iconColor}`} />
                    </div>
                    <p className="text-sm text-platinum leading-relaxed">{insight}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---------- 5. Session History Table ---------- */}
      <Card className="bg-graphite border-gunmetal">
        <CardHeader>
          <CardTitle className="text-platinum flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-neonblue" />
            Recent Sessions
            <span className="text-xs font-normal text-mist ml-2">Last 10 sessions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gunmetal">
                  {(
                    [
                      { key: "date", label: "Date" },
                      { key: "type", label: "Type" },
                      { key: "score", label: "Score" },
                      { key: "duration", label: "Duration" },
                    ] as { key: SortKey; label: string }[]
                  ).map((col) => (
                    <th
                      key={col.key}
                      className="text-left py-3 px-4 text-mist font-medium cursor-pointer select-none hover:text-platinum transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key ? (
                          sortDir === "desc" ? (
                            <ChevronDown className="h-3.5 w-3.5 text-neonblue" />
                          ) : (
                            <ChevronUp className="h-3.5 w-3.5 text-neonblue" />
                          )
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-gunmetal" />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedSessions.map((session, idx) => {
                  const typeColor =
                    session.type === "Coach"
                      ? "bg-neonblue/15 text-neonblue"
                      : session.type === "Practice"
                      ? "bg-automationgreen/15 text-automationgreen"
                      : "bg-warningamber/15 text-warningamber";

                  const scoreColor =
                    session.score >= 80
                      ? "text-automationgreen"
                      : session.score >= 60
                      ? "text-warningamber"
                      : "text-[#FF4757]";

                  return (
                    <tr
                      key={session.id}
                      className={`border-b border-gunmetal/50 transition-colors hover:bg-onyx/60 ${
                        idx % 2 === 0 ? "bg-transparent" : "bg-onyx/30"
                      }`}
                    >
                      <td className="py-3 px-4 text-platinum">
                        {new Date(session.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor}`}
                        >
                          {session.type}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-semibold ${scoreColor}`}>
                        {session.score}
                      </td>
                      <td className="py-3 px-4 text-silver">{session.duration} min</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {sortedSessions.length === 0 && (
            <div className="py-12 text-center text-mist">
              No sessions recorded yet. Start practicing to see your history!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
