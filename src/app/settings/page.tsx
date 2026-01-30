"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Cpu,
  Key,
  User,
  Bell,
  Shield,
  Check,
  Zap,
  Brain,
  Sparkles,
  Globe,
  Edit3,
  X,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";

// API Types for models
type ApiType = "openrouter" | "openai" | "anthropic" | "perplexity";

// Available AI Models - Latest 2025/2026
const AI_MODELS: {
  id: string;
  name: string;
  provider: string;
  api: ApiType;
  description: string;
  speed: string;
  quality: string;
  recommended: boolean;
}[] = [
  // ===========================================
  // DIRECT API MODELS (Lower latency, no middleman)
  // ===========================================

  // Direct Anthropic API
  {
    id: "claude-opus-4-5-20251101",
    name: "Claude Opus 4.5",
    provider: "Anthropic",
    api: "anthropic",
    description: "Direct API - Most capable, premium intelligence",
    speed: "Medium",
    quality: "Exceptional",
    recommended: false,
  },
  {
    id: "claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    api: "anthropic",
    description: "Direct API - Smart model for complex agents",
    speed: "Fast",
    quality: "Excellent",
    recommended: false,
  },
  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    api: "anthropic",
    description: "Direct API - Fastest with near-frontier intelligence",
    speed: "Very Fast",
    quality: "Very Good",
    recommended: false,
  },
  // Direct OpenAI API
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "OpenAI",
    api: "openai",
    description: "Direct API - Best instruction following",
    speed: "Fast",
    quality: "Excellent",
    recommended: false,
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "OpenAI",
    api: "openai",
    description: "Direct API - Fast and efficient",
    speed: "Very Fast",
    quality: "Very Good",
    recommended: false,
  },
  {
    id: "o3-mini",
    name: "o3 Mini",
    provider: "OpenAI",
    api: "openai",
    description: "Direct API - Efficient reasoning model",
    speed: "Fast",
    quality: "Excellent",
    recommended: false,
  },

  // ===========================================
  // OPENROUTER MODELS (100+ models via gateway)
  // ===========================================

  // Anthropic Models (via OpenRouter)
  {
    id: "anthropic/claude-opus-4.5",
    name: "Claude Opus 4.5",
    provider: "Anthropic",
    api: "openrouter",
    description: "Via OpenRouter - Most capable reasoning",
    speed: "Medium",
    quality: "Exceptional",
    recommended: false,
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    api: "openrouter",
    description: "Via OpenRouter - Balanced speed and capability",
    speed: "Fast",
    quality: "Excellent",
    recommended: true,
  },
  {
    id: "anthropic/claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    api: "openrouter",
    description: "Via OpenRouter - Fast and intelligent",
    speed: "Very Fast",
    quality: "Very Good",
    recommended: false,
  },
  // OpenAI Models (via OpenRouter)
  {
    id: "openai/gpt-5",
    name: "GPT-5",
    provider: "OpenAI",
    api: "openrouter",
    description: "Via OpenRouter - Latest flagship model",
    speed: "Fast",
    quality: "Exceptional",
    recommended: false,
  },
  {
    id: "openai/gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "OpenAI",
    api: "openrouter",
    description: "Compact version with great performance",
    speed: "Very Fast",
    quality: "Excellent",
    recommended: false,
  },
  {
    id: "openai/gpt-4.1",
    name: "GPT-4.1",
    provider: "OpenAI",
    api: "openrouter",
    description: "Improved GPT-4 with better instruction following",
    speed: "Fast",
    quality: "Excellent",
    recommended: false,
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "OpenAI",
    api: "openrouter",
    description: "Fast and efficient for everyday tasks",
    speed: "Very Fast",
    quality: "Very Good",
    recommended: false,
  },
  {
    id: "openai/o3",
    name: "o3",
    provider: "OpenAI",
    api: "openrouter",
    description: "Advanced reasoning model for complex problems",
    speed: "Slow",
    quality: "Exceptional",
    recommended: false,
  },
  {
    id: "openai/o3-mini",
    name: "o3 Mini",
    provider: "OpenAI",
    api: "openrouter",
    description: "Efficient reasoning for structured tasks",
    speed: "Fast",
    quality: "Excellent",
    recommended: false,
  },
  // Google Models (via OpenRouter)
  {
    id: "google/gemini-3-pro",
    name: "Gemini 3 Pro",
    provider: "Google",
    api: "openrouter",
    description: "Most intelligent, best for multimodal and agentic tasks",
    speed: "Fast",
    quality: "Exceptional",
    recommended: false,
  },
  {
    id: "google/gemini-3-flash",
    name: "Gemini 3 Flash",
    provider: "Google",
    api: "openrouter",
    description: "Most balanced for speed, scale and intelligence",
    speed: "Very Fast",
    quality: "Excellent",
    recommended: false,
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    api: "openrouter",
    description: "Best price-performance for large scale processing",
    speed: "Very Fast",
    quality: "Very Good",
    recommended: false,
  },
  // Meta Models (via OpenRouter)
  {
    id: "meta-llama/llama-4-maverick",
    name: "Llama 4 Maverick",
    provider: "Meta",
    api: "openrouter",
    description: "Open source flagship with great reasoning",
    speed: "Fast",
    quality: "Excellent",
    recommended: false,
  },
  {
    id: "meta-llama/llama-4-scout",
    name: "Llama 4 Scout",
    provider: "Meta",
    api: "openrouter",
    description: "Efficient open source model",
    speed: "Very Fast",
    quality: "Very Good",
    recommended: false,
  },
  // Perplexity Models (via OpenRouter)
  {
    id: "perplexity/sonar-pro",
    name: "Sonar Pro",
    provider: "Perplexity",
    api: "openrouter",
    description: "Best for research with real-time search",
    speed: "Fast",
    quality: "Excellent",
    recommended: false,
  },
  {
    id: "perplexity/sonar",
    name: "Sonar",
    provider: "Perplexity",
    api: "openrouter",
    description: "Fast research assistant",
    speed: "Very Fast",
    quality: "Good",
    recommended: false,
  },
];

// API badge colors and labels
const API_BADGES: Record<ApiType, { label: string; color: string }> = {
  openrouter: { label: "OpenRouter", color: "bg-purple-500/20 text-purple-400" },
  openai: { label: "OpenAI API", color: "bg-green-500/20 text-green-400" },
  anthropic: { label: "Claude API", color: "bg-orange-500/20 text-orange-400" },
  perplexity: { label: "Perplexity API", color: "bg-cyan-500/20 text-cyan-400" },
};

export default function SettingsPage() {
  const [selectedModel, setSelectedModel] = useState("anthropic/claude-sonnet-4");
  const [saved, setSaved] = useState(false);

  // Profile state
  const [profileName, setProfileName] = useState("Dhruv");
  const [profileEmail, setProfileEmail] = useState("aiwithdhruv@gmail.com");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const savedModel = localStorage.getItem("ai_model");
    if (savedModel && AI_MODELS.some((m) => m.id === savedModel)) {
      setSelectedModel(savedModel);
    }

    // Load profile data
    const savedName = localStorage.getItem("profile_name");
    const savedEmail = localStorage.getItem("profile_email");
    if (savedName) setProfileName(savedName);
    if (savedEmail) setProfileEmail(savedEmail);
  }, []);

  const handleSaveModel = () => {
    localStorage.setItem("ai_model", selectedModel);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Start editing profile
  const handleEditProfile = () => {
    setTempName(profileName);
    setTempEmail(profileEmail);
    setIsEditingProfile(true);
  };

  // Save profile changes
  const handleSaveProfile = () => {
    if (tempName.trim()) {
      setProfileName(tempName.trim());
      localStorage.setItem("profile_name", tempName.trim());
    }
    if (tempEmail.trim()) {
      setProfileEmail(tempEmail.trim());
      localStorage.setItem("profile_email", tempEmail.trim());
    }
    setIsEditingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setTempName("");
    setTempEmail("");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
            <Settings className="h-6 w-6 text-neonblue" />
            Settings
          </h1>
          <p className="text-silver mt-1">
            Configure your AI Sales Coach preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Model Selection */}
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-neonblue" />
                  AI Model Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-silver">
                  Choose the AI model that powers your coaching sessions. Different
                  models have different strengths.
                </p>

                <div className="space-y-3">
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={cn(
                        "w-full p-4 rounded-lg text-left transition-all border",
                        selectedModel === model.id
                          ? "bg-neonblue/10 border-neonblue"
                          : "bg-onyx border-gunmetal hover:border-neonblue/50"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-platinum">
                              {model.name}
                            </h4>
                            <Badge className={cn("text-xs", API_BADGES[model.api].color)}>
                              {API_BADGES[model.api].label}
                            </Badge>
                            {model.recommended && (
                              <Badge className="bg-automationgreen/20 text-automationgreen text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-mist mt-0.5">
                            {model.provider}
                          </p>
                          <p className="text-sm text-silver mt-1">
                            {model.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-mist flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {model.speed}
                            </span>
                            <span className="text-xs text-mist flex items-center gap-1">
                              <Brain className="h-3 w-3" />
                              {model.quality}
                            </span>
                          </div>
                        </div>
                        {selectedModel === model.id && (
                          <Check className="h-5 w-5 text-neonblue shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleSaveModel}
                  className="bg-neonblue hover:bg-electricblue text-white"
                >
                  {saved ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    "Save Model Selection"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* API Keys (Admin) */}
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center gap-2">
                  <Key className="h-5 w-5 text-warningamber" />
                  API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-silver">
                  API keys are configured server-side. Contact your administrator
                  to update them.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-onyx rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-automationgreen/20 flex items-center justify-center">
                        <Check className="h-4 w-4 text-automationgreen" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-platinum">OpenRouter</p>
                        <p className="text-xs text-mist">Connected</p>
                      </div>
                    </div>
                    <Badge className="bg-automationgreen/20 text-automationgreen">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-onyx rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-automationgreen/20 flex items-center justify-center">
                        <Check className="h-4 w-4 text-automationgreen" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-platinum">OpenAI</p>
                        <p className="text-xs text-mist">Connected</p>
                      </div>
                    </div>
                    <Badge className="bg-automationgreen/20 text-automationgreen">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-onyx rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-automationgreen/20 flex items-center justify-center">
                        <Check className="h-4 w-4 text-automationgreen" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-platinum">Anthropic</p>
                        <p className="text-xs text-mist">Connected</p>
                      </div>
                    </div>
                    <Badge className="bg-automationgreen/20 text-automationgreen">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-onyx rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-automationgreen/20 flex items-center justify-center">
                        <Check className="h-4 w-4 text-automationgreen" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-platinum">Perplexity AI</p>
                        <p className="text-xs text-mist">Connected</p>
                      </div>
                    </div>
                    <Badge className="bg-automationgreen/20 text-automationgreen">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile */}
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="h-5 w-5 text-neonblue" />
                    Profile
                  </span>
                  {profileSaved && (
                    <span className="text-xs text-automationgreen flex items-center gap-1">
                      <Check className="h-3 w-3" /> Saved
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditingProfile ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full bg-neonblue flex items-center justify-center text-white font-medium text-xl">
                          {getInitials(tempName || profileName)}
                        </div>
                        <button className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-graphite border border-gunmetal flex items-center justify-center text-mist hover:text-platinum">
                          <Camera className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-mist mb-1 block">Name</label>
                        <Input
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          placeholder="Your name"
                          className="bg-onyx border-gunmetal text-platinum"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-mist mb-1 block">Email</label>
                        <Input
                          type="email"
                          value={tempEmail}
                          onChange={(e) => setTempEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="bg-onyx border-gunmetal text-platinum"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveProfile}
                        className="flex-1 bg-neonblue hover:bg-electricblue text-white"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="border-gunmetal text-silver hover:text-platinum"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-neonblue flex items-center justify-center text-white font-medium text-lg">
                        {getInitials(profileName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-platinum truncate">{profileName}</p>
                        <p className="text-sm text-mist truncate">{profileEmail}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleEditProfile}
                      className="w-full border-gunmetal text-silver hover:text-platinum gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center gap-2">
                  <Bell className="h-5 w-5 text-neonblue" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-silver">Practice reminders</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gunmetal bg-onyx"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-silver">Call analysis ready</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gunmetal bg-onyx"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-silver">Weekly reports</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gunmetal bg-onyx"
                  />
                </label>
              </CardContent>
            </Card>

            {/* Current Model */}
            <Card className="bg-onyx border-gunmetal">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-neonblue" />
                  <span className="text-sm font-medium text-platinum">
                    Current Model
                  </span>
                </div>
                <p className="text-lg font-bold text-neonblue">
                  {AI_MODELS.find((m) => m.id === selectedModel)?.name}
                </p>
                <p className="text-xs text-mist mt-1">
                  {AI_MODELS.find((m) => m.id === selectedModel)?.provider}
                </p>
                {AI_MODELS.find((m) => m.id === selectedModel)?.api && (
                  <Badge className={cn("text-xs mt-2", API_BADGES[AI_MODELS.find((m) => m.id === selectedModel)!.api].color)}>
                    via {API_BADGES[AI_MODELS.find((m) => m.id === selectedModel)!.api].label}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
