"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Phone,
  Upload,
  Play,
  Clock,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Target,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock call data
const RECENT_CALLS = [
  {
    id: "1",
    title: "Discovery Call - Acme Corp",
    contact: "Sarah Johnson",
    company: "Acme Corp",
    date: "2024-01-29",
    duration: "32 min",
    score: 85,
    status: "analyzed",
    insights: {
      discovery: 90,
      rapport: 85,
      objectionHandling: 80,
      nextSteps: 85,
    },
    keyMoments: [
      { type: "positive", text: "Strong discovery questions at 5:23" },
      { type: "positive", text: "Good objection reframe at 18:45" },
      { type: "improvement", text: "Missed opportunity to quantify pain at 12:30" },
    ],
  },
  {
    id: "2",
    title: "Demo - TechStart Inc",
    contact: "Mike Chen",
    company: "TechStart Inc",
    date: "2024-01-28",
    duration: "45 min",
    score: 72,
    status: "analyzed",
    insights: {
      discovery: 65,
      rapport: 80,
      objectionHandling: 70,
      nextSteps: 75,
    },
    keyMoments: [
      { type: "positive", text: "Engaging product demonstration" },
      { type: "improvement", text: "Too much talking, not enough listening" },
      { type: "improvement", text: "Vague next steps at the end" },
    ],
  },
  {
    id: "3",
    title: "Follow-up - Global Industries",
    contact: "Lisa Wang",
    company: "Global Industries",
    date: "2024-01-27",
    duration: "18 min",
    score: 92,
    status: "analyzed",
    insights: {
      discovery: 88,
      rapport: 95,
      objectionHandling: 90,
      nextSteps: 95,
    },
    keyMoments: [
      { type: "positive", text: "Excellent rapport building" },
      { type: "positive", text: "Clear and specific next steps" },
      { type: "positive", text: "Strong closing technique" },
    ],
  },
];

// Overall stats
const STATS = {
  totalCalls: 47,
  avgScore: 78,
  improvement: "+12%",
  hoursAnalyzed: 32,
};

export default function CallsPage() {
  const [selectedCall, setSelectedCall] = useState<string | null>(null);

  const selectedCallData = RECENT_CALLS.find((c) => c.id === selectedCall);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-automationgreen";
    if (score >= 70) return "text-warningamber";
    return "text-errorred";
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return "bg-automationgreen/20";
    if (score >= 70) return "bg-warningamber/20";
    return "bg-errorred/20";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
              <Phone className="h-6 w-6 text-neonblue" />
              Call Analyzer
            </h1>
            <p className="text-silver mt-1">
              Upload and analyze your sales calls with AI
            </p>
          </div>
          <Button className="bg-neonblue hover:bg-electricblue text-white">
            <Upload className="h-4 w-4 mr-2" />
            Upload Call
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-neonblue" />
              </div>
              <div>
                <p className="text-xs text-mist">Total Calls</p>
                <p className="text-lg font-semibold text-platinum">
                  {STATS.totalCalls}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-automationgreen/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-automationgreen" />
              </div>
              <div>
                <p className="text-xs text-mist">Avg Score</p>
                <p className="text-lg font-semibold text-platinum">
                  {STATS.avgScore}%
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warningamber/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-warningamber" />
              </div>
              <div>
                <p className="text-xs text-mist">Improvement</p>
                <p className="text-lg font-semibold text-automationgreen">
                  {STATS.improvement}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-infocyan/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-infocyan" />
              </div>
              <div>
                <p className="text-xs text-mist">Hours Analyzed</p>
                <p className="text-lg font-semibold text-platinum">
                  {STATS.hoursAnalyzed}h
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Call List */}
          <div className="lg:col-span-1">
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum">Recent Calls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {RECENT_CALLS.map((call) => (
                  <button
                    key={call.id}
                    onClick={() => setSelectedCall(call.id)}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-all",
                      "border",
                      selectedCall === call.id
                        ? "bg-neonblue/10 border-neonblue"
                        : "bg-onyx border-gunmetal hover:border-neonblue/50"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-platinum text-sm truncate">
                          {call.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-mist mt-1">
                          <User className="h-3 w-3" />
                          <span className="truncate">{call.contact}</span>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "text-xs",
                          getScoreBg(call.score),
                          getScoreColor(call.score)
                        )}
                      >
                        {call.score}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-silver">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {call.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {call.duration}
                      </span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Call Details */}
          <div className="lg:col-span-2">
            {selectedCallData ? (
              <div className="space-y-6">
                {/* Call Header */}
                <Card className="bg-graphite border-gunmetal">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-platinum">
                          {selectedCallData.title}
                        </h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-silver">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {selectedCallData.contact}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {selectedCallData.company}
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className={cn(
                            "text-4xl font-bold",
                            getScoreColor(selectedCallData.score)
                          )}
                        >
                          {selectedCallData.score}
                        </div>
                        <p className="text-xs text-mist">Overall Score</p>
                      </div>
                    </div>
                    <Button className="bg-neonblue hover:bg-electricblue text-white">
                      <Play className="h-4 w-4 mr-2" />
                      Play Recording
                    </Button>
                  </CardContent>
                </Card>

                {/* Scores Breakdown */}
                <Card className="bg-graphite border-gunmetal">
                  <CardHeader>
                    <CardTitle className="text-platinum">
                      Performance Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(selectedCallData.insights).map(
                      ([key, value]) => (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-silver capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            <span
                              className={cn(
                                "text-sm font-medium",
                                getScoreColor(value)
                              )}
                            >
                              {value}%
                            </span>
                          </div>
                          <Progress
                            value={value}
                            className="h-2 bg-onyx"
                          />
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>

                {/* Key Moments */}
                <Card className="bg-graphite border-gunmetal">
                  <CardHeader>
                    <CardTitle className="text-platinum">Key Moments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedCallData.keyMoments.map((moment, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg",
                          moment.type === "positive"
                            ? "bg-automationgreen/10"
                            : "bg-warningamber/10"
                        )}
                      >
                        {moment.type === "positive" ? (
                          <CheckCircle className="h-5 w-5 text-automationgreen shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-warningamber shrink-0 mt-0.5" />
                        )}
                        <p className="text-sm text-platinum">{moment.text}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-graphite border-gunmetal h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Phone className="h-12 w-12 text-mist mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-platinum mb-2">
                    Select a Call
                  </h3>
                  <p className="text-sm text-silver">
                    Choose a call from the list to view detailed analysis
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
