"use client";

import { useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PersonaSelector } from "@/components/features/practice/PersonaSelector";
import { RealtimeVoiceChat } from "@/components/features/practice/RealtimeVoiceChat";
import {
  ArrowLeft,
  Sparkles,
  Target,
  Clock,
  TrendingUp,
  Trophy,
  Phone,
  FileText,
  Globe,
  Image as ImageIcon,
  Upload,
  X,
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

// Mock user stats
const userStats = {
  sessionsThisWeek: 5,
  averageScore: 78,
  streak: 7,
  improvement: "+12%",
};

type AttachmentType = "pdf" | "image" | "url";
interface Attachment {
  type: AttachmentType;
  name: string;
  content?: string; // Base64 for files
  url?: string; // For website URLs
}

type TrainingFocus =
  | "cold-call"
  | "sales-call"
  | "discovery"
  | "demo"
  | "objection-handling"
  | "negotiation"
  | "closing"
  | "general";

const TRAINING_FOCUS_OPTIONS: {
  id: TrainingFocus;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "cold-call",
    title: "Cold Call",
    description: "Initial outreach to a new prospect",
    icon: "📞",
  },
  {
    id: "discovery",
    title: "Discovery",
    description: "Uncover needs and pain points",
    icon: "🔍",
  },
  {
    id: "demo",
    title: "Product Demo",
    description: "Present value and handle questions",
    icon: "💻",
  },
  {
    id: "objection-handling",
    title: "Objection Handling",
    description: "Practice tough pushback scenarios",
    icon: "🛡️",
  },
  {
    id: "negotiation",
    title: "Negotiation",
    description: "Price, terms, and risk management",
    icon: "💰",
  },
  {
    id: "closing",
    title: "Closing",
    description: "Secure commitment and next steps",
    icon: "🤝",
  },
  {
    id: "sales-call",
    title: "Full Sales Call",
    description: "Complete call flow from intro to close",
    icon: "🎯",
  },
  {
    id: "general",
    title: "General",
    description: "Open-ended role-play practice",
    icon: "🧠",
  },
];

export default function PracticePage() {
  const [selectedPersonaId, setSelectedPersonaId] = useState(PERSONAS[0].id);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [trainingFocus, setTrainingFocus] = useState<TrainingFocus>("cold-call");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [allowNoContext, setAllowNoContext] = useState(false);
  const [scriptText, setScriptText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scriptInputRef = useRef<HTMLInputElement>(null);

  const selectedPersona = PERSONAS.find((p) => p.id === selectedPersonaId)!;

  const handleStartSession = () => {
    setIsSessionActive(true);
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const type: AttachmentType = file.type === "application/pdf" ? "pdf" : "image";
        setAttachments((prev) => [
          ...prev,
          { type, name: file.name, content: base64 },
        ]);
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddUrl = () => {
    if (!websiteUrl.trim()) return;
    const url = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
    setAttachments((prev) => [
      ...prev,
      { type: "url", name: new URL(url).hostname, url },
    ]);
    setWebsiteUrl("");
    setShowUrlInput(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleScriptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setScriptText(text.trim());
    };
    reader.readAsText(file);
    if (scriptInputRef.current) scriptInputRef.current.value = "";
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
          <RealtimeVoiceChat
            persona={selectedPersona}
            scenario={TRAINING_FOCUS_OPTIONS.find((f) => f.id === trainingFocus)?.title}
            trainingFocus={trainingFocus}
            attachments={attachments}
            scriptText={scriptText}
            onEndSession={handleEndSession}
          />
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

            {/* Training Focus */}
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum">
                  Training Focus{" "}
                  <span className="text-mist font-normal text-sm">
                    (required)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TRAINING_FOCUS_OPTIONS.map((focus) => (
                    <button
                      key={focus.id}
                      onClick={() => setTrainingFocus(focus.id)}
                      className={cn(
                        "p-3 rounded-lg text-left transition-all duration-200 border",
                        trainingFocus === focus.id
                          ? "bg-automationgreen/10 border-automationgreen"
                          : "bg-onyx border-gunmetal hover:border-automationgreen/50"
                      )}
                    >
                      <span className="text-2xl">{focus.icon}</span>
                      <h4 className="font-medium text-platinum mt-2 text-sm">
                        {focus.title}
                      </h4>
                      <p className="text-xs text-mist mt-1">
                        {focus.description}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sales Script */}
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum">
                  Sales Script{" "}
                  <span className="text-mist font-normal text-sm">
                    (optional, enables live coaching)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Paste your sales script here. We'll use it to give real-time coaching during the live call."
                  className="min-h-[120px] w-full rounded-lg bg-onyx border border-gunmetal text-platinum placeholder:text-mist px-3 py-2 text-sm focus:border-neonblue focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    ref={scriptInputRef}
                    type="file"
                    accept=".txt,.md"
                    onChange={handleScriptUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => scriptInputRef.current?.click()}
                    className="border-gunmetal text-silver hover:text-platinum text-xs gap-1"
                  >
                    <Upload className="h-3 w-3" />
                    Upload Script (.txt)
                  </Button>
                  {scriptText && (
                    <span className="text-xs text-automationgreen">
                      Script loaded
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Practice Context */}
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum">
                  Add Context{" "}
                  <span className="text-mist font-normal text-sm">
                    (optional)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att, idx) => (
                      <div
                        key={`${att.type}-${att.name}-${idx}`}
                        className="flex items-center gap-2 px-3 py-1.5 bg-onyx border border-gunmetal rounded-lg text-sm"
                      >
                        {att.type === "pdf" && <FileText className="h-4 w-4 text-red-400" />}
                        {att.type === "image" && <ImageIcon className="h-4 w-4 text-blue-400" />}
                        {att.type === "url" && <Globe className="h-4 w-4 text-green-400" />}
                        <span className="text-silver truncate max-w-[180px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="text-mist hover:text-red-400 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-gunmetal text-silver hover:text-platinum text-xs gap-1"
                  >
                    <Upload className="h-3 w-3" />
                    PDF/Image
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="border-gunmetal text-silver hover:text-platinum text-xs gap-1"
                  >
                    <Globe className="h-3 w-3" />
                    Website URL
                  </Button>

                  {showUrlInput && (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://company.com"
                        className="h-8 text-xs bg-onyx border-gunmetal text-platinum"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddUrl())}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddUrl}
                        className="h-8 bg-neonblue hover:bg-electricblue text-white text-xs"
                      >
                        Add
                      </Button>
                    </div>
                  )}

                  <span className="text-xs text-mist ml-auto">
                    Use product docs, PDFs, or a website for realism
                  </span>
                </div>

                {attachments.length === 0 && (
                  <div className="mt-2 p-3 bg-warningamber/10 border border-warningamber/30 rounded-lg text-xs text-warningamber">
                    No context added yet. Upload a company profile or add a URL for best training results.
                    <button
                      type="button"
                      onClick={() => setAllowNoContext(!allowNoContext)}
                      className={cn(
                        "ml-2 underline",
                        allowNoContext ? "text-platinum" : "text-warningamber"
                      )}
                    >
                      {allowNoContext ? "Proceed without context" : "Proceed anyway"}
                    </button>
                  </div>
                )}
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
                  <p className="text-xs text-mist mb-1">Training Focus</p>
                  <p className="text-sm text-platinum">
                    {TRAINING_FOCUS_OPTIONS.find((f) => f.id === trainingFocus)?.title}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-mist mb-1">Industry</p>
                  <p className="text-sm text-platinum">
                    {selectedPersona.industry}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-mist mb-1">Script</p>
                  <p className="text-sm text-platinum">
                    {scriptText ? "Added" : "Not added"}
                  </p>
                </div>

                <Button
                  onClick={handleStartSession}
                  disabled={attachments.length === 0 && !allowNoContext}
                  className="w-full text-white mt-4 bg-automationgreen hover:bg-automationgreen/80"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Start Live Call
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
