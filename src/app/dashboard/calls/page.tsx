"use client";

import { useRef, useState } from "react";
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
  Loader2,
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
    transcript: `Rep: Thanks for taking the time today, Sarah. Before we jump in, can you share how you're handling onboarding today?\n\nProspect: It's mostly manual. Spreadsheets, a lot of back-and-forth.\n\nRep: What does that cost you in time each week?\n\nProspect: Maybe 6 to 8 hours between me and ops.\n\nRep: If we could cut that in half and give you visibility in one dashboard, would that be valuable?\n\nProspect: Definitely, as long as implementation isn't heavy.\n\nRep: Totally fair. Implementation typically takes two weeks, and we handle most of the setup. Would a quick technical walkthrough with your ops lead make sense?`,
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
    transcript: `Rep: Let me show you how teams like yours track pipeline in real time.\n\nProspect: We already use a CRM for that.\n\nRep: Understood. The difference here is automated deal health and next-step prompts. Where do deals typically stall for you?\n\nProspect: Usually after the first demo.\n\nRep: Got it. We can trigger follow-up sequences and surface risk signals. Would you want to see that in action with your data?`,
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
    transcript: `Rep: Last time you mentioned compliance was a blocker. Did you get a chance to review the security docs?\n\nProspect: Yes, and they looked solid. We just need legal to confirm.\n\nRep: Great. Would it help if I joined a 20-minute call with legal to answer any questions?\n\nProspect: That would speed things up.\n\nRep: Perfect. I’ll send a few time options and we’ll lock it in today.`,
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
  {
    id: "4",
    title: "Pricing Negotiation - Northwind",
    contact: "Priya Desai",
    company: "Northwind Logistics",
    date: "2024-01-26",
    duration: "28 min",
    score: 76,
    status: "analyzed",
    transcript: `Prospect: Your pricing is higher than what we pay today.\n\nRep: That makes sense. Can I ask what you're comparing it against—total cost or just the license?\n\nProspect: Mostly license.\n\nRep: Got it. When we include the time saved and reduced churn, most teams see a net decrease. If I quantified that with your numbers, would you be open to revisiting?\n\nProspect: Possibly, but we still need a discount.\n\nRep: If we commit to an annual plan, I can offer a 10% reduction. In return, can we agree on a 30‑day pilot kickoff date?`,
    insights: {
      discovery: 70,
      rapport: 72,
      objectionHandling: 78,
      nextSteps: 75,
    },
    keyMoments: [
      { type: "positive", text: "Reframed pricing vs. total cost" },
      { type: "improvement", text: "Could quantify ROI with clearer metrics" },
    ],
  },
  {
    id: "5",
    title: "Objection Handling - Velocity Consulting",
    contact: "Jennifer Rodriguez",
    company: "Velocity Consulting",
    date: "2024-01-25",
    duration: "22 min",
    score: 81,
    status: "analyzed",
    transcript: `Prospect: We've tried tools like this before. It didn't work.\n\nRep: I hear you. What specifically broke down last time—adoption, data quality, or results?\n\nProspect: Adoption. Reps didn’t use it.\n\nRep: That’s helpful. We’ve seen success when we roll out in stages with champion reps. If I showed a rollout plan and change‑management playbook, would that address the concern?\n\nProspect: Maybe. I'm still skeptical.\n\nRep: Fair. Would it help if I connected you with a leader who ran a similar rollout last quarter?`,
    insights: {
      discovery: 80,
      rapport: 75,
      objectionHandling: 85,
      nextSteps: 78,
    },
    keyMoments: [
      { type: "positive", text: "Diagnosed root cause of past failure" },
      { type: "positive", text: "Offered peer reference as proof" },
    ],
  },
  {
    id: "6",
    title: "Closing Call - Apex Financial",
    contact: "David Park",
    company: "Apex Financial",
    date: "2024-01-24",
    duration: "16 min",
    score: 89,
    status: "analyzed",
    transcript: `Rep: To recap, you want faster onboarding and better visibility for execs. We can deliver both within 30 days.\n\nProspect: That matches what we need.\n\nRep: Great. If I send the order form today, can we lock in a start date for next Monday?\n\nProspect: Yes, pending legal review.\n\nRep: Perfect. I’ll send the order form and book a 20‑minute legal review. Anything else you need from us to finalize?`,
    insights: {
      discovery: 85,
      rapport: 88,
      objectionHandling: 86,
      nextSteps: 92,
    },
    keyMoments: [
      { type: "positive", text: "Clear recap tied to outcomes" },
      { type: "positive", text: "Strong, specific next steps" },
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

type CallAnalysis = {
  id: string;
  title: string;
  date: string;
  duration: string;
  score: number;
  status: "analyzed";
  transcript?: string;
  insights: {
    discovery: number;
    rapport: number;
    objectionHandling: number;
    nextSteps: number;
  };
  summary: string;
  strengths: string[];
  improvements: string[];
  talkRatio: {
    rep: number;
    prospect: number;
  };
  keyMoments: { type: "positive" | "improvement"; text: string }[];
  nextSteps: string[];
};

export default function CallsPage() {
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CallAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCallData = RECENT_CALLS.find((c) => c.id === selectedCall);
  const selectedAnalysis = selectedCall === "latest" ? analysis : null;

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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ai/analyze-call", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "Analysis failed");
      }

      const data = await res.json();
      const report = data.analysis as CallAnalysis;

      const derived: CallAnalysis = {
        id: "latest",
        title: `Uploaded Call - ${file.name}`,
        date: new Date().toISOString().slice(0, 10),
        duration: "Processing",
        score: report.score,
        status: "analyzed",
        insights: report.insights || {
          discovery: 70,
          rapport: 70,
          objectionHandling: 70,
          nextSteps: 70,
        },
        summary: report.summary,
        strengths: report.strengths || [],
        improvements: report.improvements || [],
        talkRatio: report.talkRatio || { rep: 60, prospect: 40 },
        keyMoments: report.keyMoments || [],
        nextSteps: report.nextSteps || [],
      };

      setAnalysis(derived);
      setSelectedCall("latest");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze call";
      setAnalyzeError(message);
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={handleUploadClick}
              className="bg-neonblue hover:bg-electricblue text-white"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Call
                </>
              )}
            </Button>
          </div>
        </div>
        {analyzeError && (
          <div className="p-3 bg-errorred/10 border border-errorred/30 rounded-lg text-errorred text-sm">
            {analyzeError}
          </div>
        )}

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
                {analysis && (
                  <button
                    onClick={() => setSelectedCall("latest")}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-all",
                      "border",
                      selectedCall === "latest"
                        ? "bg-neonblue/10 border-neonblue"
                        : "bg-onyx border-gunmetal hover:border-neonblue/50"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-platinum text-sm truncate">
                          {analysis.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-mist mt-1">
                          <User className="h-3 w-3" />
                          <span className="truncate">Uploaded</span>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "text-xs",
                          getScoreBg(analysis.score),
                          getScoreColor(analysis.score)
                        )}
                      >
                        {analysis.score}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-silver">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {analysis.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {analysis.duration}
                      </span>
                    </div>
                  </button>
                )}
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
            {selectedAnalysis ? (
              <div className="space-y-6">
                <Card className="bg-graphite border-gunmetal">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-platinum">
                          {selectedAnalysis.title}
                        </h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-silver">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {selectedAnalysis.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {selectedAnalysis.duration}
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className={cn(
                            "text-4xl font-bold",
                            getScoreColor(selectedAnalysis.score)
                          )}
                        >
                          {selectedAnalysis.score}
                        </div>
                        <p className="text-xs text-mist">Overall Score</p>
                      </div>
                    </div>
                    <div className="text-sm text-silver">
                      {selectedAnalysis.summary}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-graphite border-gunmetal">
                  <CardHeader>
                    <CardTitle className="text-platinum">
                      Performance Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(selectedAnalysis.insights).map(
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-graphite border-gunmetal">
                    <CardHeader>
                      <CardTitle className="text-platinum">
                        Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-silver">
                      {selectedAnalysis.strengths.length > 0 ? (
                        selectedAnalysis.strengths.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-automationgreen mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <p>No strengths detected.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-graphite border-gunmetal">
                    <CardHeader>
                      <CardTitle className="text-platinum">
                        Improvements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-silver">
                      {selectedAnalysis.improvements.length > 0 ? (
                        selectedAnalysis.improvements.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-warningamber mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <p>No improvement areas detected.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-graphite border-gunmetal">
                    <CardHeader>
                      <CardTitle className="text-platinum">
                        Talk Ratio
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-silver">
                      <div className="flex items-center justify-between">
                        <span>Rep</span>
                        <span>{selectedAnalysis.talkRatio.rep}%</span>
                      </div>
                      <Progress value={selectedAnalysis.talkRatio.rep} className="h-2 bg-onyx" />
                      <div className="flex items-center justify-between">
                        <span>Prospect</span>
                        <span>{selectedAnalysis.talkRatio.prospect}%</span>
                      </div>
                      <Progress value={selectedAnalysis.talkRatio.prospect} className="h-2 bg-onyx" />
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-graphite border-gunmetal">
                  <CardHeader>
                    <CardTitle className="text-platinum">
                      Key Moments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedAnalysis.keyMoments.length > 0 ? (
                      selectedAnalysis.keyMoments.map((moment, index) => (
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
                      ))
                    ) : (
                      <p className="text-sm text-silver">No key moments detected.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-graphite border-gunmetal">
                  <CardHeader>
                    <CardTitle className="text-platinum">
                      Recommended Next Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-silver">
                    {selectedAnalysis.nextSteps.length > 0 ? (
                      selectedAnalysis.nextSteps.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-neonblue mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))
                    ) : (
                      <p>No next steps detected.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : selectedCallData ? (
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

                {/* Transcript (Mock) */}
                {selectedCallData.transcript && (
                  <Card className="bg-graphite border-gunmetal">
                    <CardHeader>
                      <CardTitle className="text-platinum">Transcript (Mock)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-silver whitespace-pre-wrap max-h-80 overflow-y-auto">
                        {selectedCallData.transcript}
                      </div>
                    </CardContent>
                  </Card>
                )}
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
