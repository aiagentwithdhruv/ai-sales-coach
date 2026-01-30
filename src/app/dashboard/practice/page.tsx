"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PersonaSelector } from "@/components/features/practice/PersonaSelector";
import { ChatInterface } from "@/components/features/practice/ChatInterface";
import { RealtimeVoiceChat } from "@/components/features/practice/RealtimeVoiceChat";
import {
  ArrowLeft,
  Sparkles,
  Target,
  Clock,
  TrendingUp,
  Trophy,
  MessageSquare,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Personas data (matching the API)
const PERSONAS = [
  {
    id: "sarah-startup",
    name: "Sarah Chen",
    title: "CEO & Co-founder",
    company: "TechFlow Startup",
    personality:
      "Friendly but busy. Values efficiency and quick value demonstration.",
    difficulty: "easy" as const,
    industry: "SaaS / Technology",
  },
  {
    id: "marcus-enterprise",
    name: "Marcus Williams",
    title: "VP of Operations",
    company: "Global Manufacturing Inc.",
    personality:
      "Professional, analytical, risk-averse. Needs thorough documentation and proof.",
    difficulty: "medium" as const,
    industry: "Manufacturing",
  },
  {
    id: "jennifer-skeptic",
    name: "Jennifer Rodriguez",
    title: "Director of Sales",
    company: "Velocity Consulting",
    personality:
      "Highly skeptical, been burned before. Tests salespeople with tough objections.",
    difficulty: "hard" as const,
    industry: "Consulting",
  },
  {
    id: "david-gatekeeper",
    name: "David Park",
    title: "Executive Assistant",
    company: "Apex Financial",
    personality: "Protective gatekeeper. Screens all calls for the CEO.",
    difficulty: "medium" as const,
    industry: "Financial Services",
  },
];

// Practice scenarios
const SCENARIOS = [
  {
    id: "cold-call",
    title: "Cold Call",
    description: "Initial outreach to a new prospect",
    icon: "📞",
  },
  {
    id: "discovery",
    title: "Discovery Call",
    description: "Uncover needs and pain points",
    icon: "🔍",
  },
  {
    id: "demo",
    title: "Product Demo",
    description: "Present your solution",
    icon: "💻",
  },
  {
    id: "objection",
    title: "Objection Handling",
    description: "Handle tough pushback",
    icon: "🛡️",
  },
  {
    id: "negotiation",
    title: "Price Negotiation",
    description: "Navigate discount requests",
    icon: "💰",
  },
  {
    id: "closing",
    title: "Closing the Deal",
    description: "Seal the agreement",
    icon: "🤝",
  },
];

// Mock user stats
const userStats = {
  sessionsThisWeek: 5,
  averageScore: 78,
  streak: 7,
  improvement: "+12%",
};

type PracticeMode = "chat" | "realtime";

export default function PracticePage() {
  const [selectedPersonaId, setSelectedPersonaId] = useState(PERSONAS[0].id);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("realtime");

  const selectedPersona = PERSONAS.find((p) => p.id === selectedPersonaId)!;

  const handleStartSession = () => {
    setIsSessionActive(true);
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
  };

  if (isSessionActive) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Button
            variant="ghost"
            onClick={handleEndSession}
            className="mb-4 text-silver hover:text-platinum"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Setup
          </Button>
          {practiceMode === "realtime" ? (
            <RealtimeVoiceChat
              persona={selectedPersona}
              scenario={
                selectedScenario
                  ? SCENARIOS.find((s) => s.id === selectedScenario)?.title
                  : undefined
              }
              onEndSession={handleEndSession}
            />
          ) : (
            <ChatInterface
              persona={selectedPersona}
              scenario={
                selectedScenario
                  ? SCENARIOS.find((s) => s.id === selectedScenario)?.title
                  : undefined
              }
              onEndSession={handleEndSession}
            />
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-neonblue" />
              Practice Session
            </h1>
            <p className="text-silver mt-1">
              Role-play with AI prospects to sharpen your sales skills
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-neonblue" />
              </div>
              <div>
                <p className="text-xs text-mist">This Week</p>
                <p className="text-lg font-semibold text-platinum">
                  {userStats.sessionsThisWeek} sessions
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-automationgreen/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-automationgreen" />
              </div>
              <div>
                <p className="text-xs text-mist">Avg Score</p>
                <p className="text-lg font-semibold text-platinum">
                  {userStats.averageScore}%
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warningamber/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warningamber" />
              </div>
              <div>
                <p className="text-xs text-mist">Streak</p>
                <p className="text-lg font-semibold text-platinum">
                  {userStats.streak} days 🔥
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-infocyan/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-infocyan" />
              </div>
              <div>
                <p className="text-xs text-mist">Improvement</p>
                <p className="text-lg font-semibold text-automationgreen">
                  {userStats.improvement}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Persona Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum">
                  Choose Your Prospect
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PersonaSelector
                  personas={PERSONAS}
                  selectedId={selectedPersonaId}
                  onSelect={setSelectedPersonaId}
                />
              </CardContent>
            </Card>

            {/* Scenario Selection */}
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum">
                  Select a Scenario{" "}
                  <span className="text-mist font-normal text-sm">
                    (optional)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SCENARIOS.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() =>
                        setSelectedScenario(
                          selectedScenario === scenario.id ? null : scenario.id
                        )
                      }
                      className={cn(
                        "p-3 rounded-lg text-left transition-all duration-200 border",
                        selectedScenario === scenario.id
                          ? "bg-neonblue/10 border-neonblue"
                          : "bg-onyx border-gunmetal hover:border-neonblue/50"
                      )}
                    >
                      <span className="text-2xl">{scenario.icon}</span>
                      <h4 className="font-medium text-platinum mt-2 text-sm">
                        {scenario.title}
                      </h4>
                      <p className="text-xs text-mist mt-1">
                        {scenario.description}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Session Summary */}
          <div className="space-y-6">
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum">Session Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-mist mb-1">Prospect</p>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-onyx flex items-center justify-center text-platinum text-sm font-medium">
                      {selectedPersona.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-platinum">
                        {selectedPersona.name}
                      </p>
                      <p className="text-xs text-mist">
                        {selectedPersona.company}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-mist mb-1">Difficulty</p>
                  <Badge
                    className={cn(
                      selectedPersona.difficulty === "easy" &&
                        "bg-automationgreen/20 text-automationgreen",
                      selectedPersona.difficulty === "medium" &&
                        "bg-warningamber/20 text-warningamber",
                      selectedPersona.difficulty === "hard" &&
                        "bg-errorred/20 text-errorred"
                    )}
                  >
                    {selectedPersona.difficulty === "easy" && "Beginner"}
                    {selectedPersona.difficulty === "medium" && "Intermediate"}
                    {selectedPersona.difficulty === "hard" && "Advanced"}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs text-mist mb-1">Scenario</p>
                  <p className="text-sm text-platinum">
                    {selectedScenario
                      ? SCENARIOS.find((s) => s.id === selectedScenario)?.title
                      : "Free Practice"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-mist mb-1">Industry</p>
                  <p className="text-sm text-platinum">
                    {selectedPersona.industry}
                  </p>
                </div>

                {/* Practice Mode Selection */}
                <div>
                  <p className="text-xs text-mist mb-2">Practice Mode</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPracticeMode("realtime")}
                      className={cn(
                        "p-3 rounded-lg text-center transition-all duration-200 border",
                        practiceMode === "realtime"
                          ? "bg-automationgreen/10 border-automationgreen"
                          : "bg-onyx border-gunmetal hover:border-automationgreen/50"
                      )}
                    >
                      <Phone className={cn(
                        "h-5 w-5 mx-auto mb-1",
                        practiceMode === "realtime" ? "text-automationgreen" : "text-mist"
                      )} />
                      <p className={cn(
                        "text-xs font-medium",
                        practiceMode === "realtime" ? "text-automationgreen" : "text-silver"
                      )}>
                        Live Call
                      </p>
                      <p className="text-[10px] text-mist mt-0.5">
                        Real-time voice
                      </p>
                    </button>
                    <button
                      onClick={() => setPracticeMode("chat")}
                      className={cn(
                        "p-3 rounded-lg text-center transition-all duration-200 border",
                        practiceMode === "chat"
                          ? "bg-neonblue/10 border-neonblue"
                          : "bg-onyx border-gunmetal hover:border-neonblue/50"
                      )}
                    >
                      <MessageSquare className={cn(
                        "h-5 w-5 mx-auto mb-1",
                        practiceMode === "chat" ? "text-neonblue" : "text-mist"
                      )} />
                      <p className={cn(
                        "text-xs font-medium",
                        practiceMode === "chat" ? "text-neonblue" : "text-silver"
                      )}>
                        Text/Voice
                      </p>
                      <p className="text-[10px] text-mist mt-0.5">
                        Chat + recording
                      </p>
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleStartSession}
                  className={cn(
                    "w-full text-white mt-4",
                    practiceMode === "realtime"
                      ? "bg-automationgreen hover:bg-automationgreen/80"
                      : "bg-neonblue hover:bg-electricblue"
                  )}
                >
                  {practiceMode === "realtime" ? (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Start Live Call
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Start Practice Session
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="bg-onyx border-gunmetal">
              <CardContent className="p-4">
                <h4 className="font-medium text-platinum mb-2 flex items-center gap-2">
                  💡 Pro Tips
                </h4>
                <ul className="space-y-2 text-xs text-silver">
                  <li>• Start with an introduction and build rapport</li>
                  <li>• Ask open-ended questions to uncover needs</li>
                  <li>• Listen for buying signals and objections</li>
                  <li>• Always aim for a clear next step</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
