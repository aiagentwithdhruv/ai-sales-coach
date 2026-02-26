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
  Crown,
  CreditCard,
  Loader2,
  ExternalLink,
  Lock,
  BarChart3,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";

// API Types for models
type ApiType = "openrouter" | "openai" | "anthropic" | "perplexity";

// Premium model IDs - visible but locked for free users
const PREMIUM_MODEL_IDS = new Set([
  "claude-sonnet-4-5-20250929",
  "claude-opus-4-6",
  "gpt-5.2",
  "gpt-5.1",
]);

// Available AI Models - Latest 2026 Models
const AI_MODELS: {
  id: string;
  name: string;
  provider: string;
  api: ApiType;
  description: string;
  speed: string;
  quality: string;
  recommended: boolean;
  premium: boolean;
}[] = [
  // ===========================================
  // DIRECT API MODELS (Lower latency, no middleman)
  // ===========================================

  // Direct Anthropic API - Claude 4.6/4.5 Series (Latest 2026)
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    provider: "Anthropic",
    api: "anthropic",
    description: "Direct API - Most intelligent, agents & coding",
    speed: "Moderate",
    quality: "Exceptional",
    recommended: false,
    premium: true,
  },
  {
    id: "claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    api: "anthropic",
    description: "Direct API - Best balance of speed & intelligence",
    speed: "Fast",
    quality: "Exceptional",
    recommended: true,
    premium: true,
  },
  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    api: "anthropic",
    description: "Direct API - Fastest with near-frontier intelligence",
    speed: "Fastest",
    quality: "Very Good",
    recommended: false,
    premium: false,
  },

  // Direct OpenAI API - GPT-5 Series (Latest 2026)
  {
    id: "gpt-5.2",
    name: "GPT-5.2",
    provider: "OpenAI",
    api: "openai",
    description: "Direct API - Latest flagship reasoning model",
    speed: "Fast",
    quality: "Exceptional",
    recommended: false,
    premium: true,
  },
  {
    id: "gpt-5.1",
    name: "GPT-5.1",
    provider: "OpenAI",
    api: "openai",
    description: "Direct API - Previous flagship model",
    speed: "Fast",
    quality: "Exceptional",
    recommended: false,
    premium: true,
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "OpenAI",
    api: "openai",
    description: "Direct API - Fast reasoning at lower cost",
    speed: "Very Fast",
    quality: "Excellent",
    recommended: false,
    premium: false,
  },

  // OpenAI o-Series (Reasoning Models)
  {
    id: "o3",
    name: "o3",
    provider: "OpenAI",
    api: "openai",
    description: "Direct API - Most powerful reasoning model",
    speed: "Medium",
    quality: "Exceptional",
    recommended: false,
    premium: false,
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
    premium: false,
  },

  // OpenAI GPT-4.1 Series
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "OpenAI",
    api: "openai",
    description: "Direct API - Best instruction following",
    speed: "Fast",
    quality: "Excellent",
    recommended: false,
    premium: false,
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
    premium: false,
  },

  // ===========================================
  // PERPLEXITY MODELS (Web Search + AI)
  // ===========================================
  {
    id: "sonar-pro",
    name: "Sonar Pro",
    provider: "Perplexity",
    api: "perplexity",
    description: "Direct API - Premier web search + reasoning",
    speed: "Fast",
    quality: "Exceptional",
    recommended: false,
    premium: false,
  },
  {
    id: "sonar",
    name: "Sonar",
    provider: "Perplexity",
    api: "perplexity",
    description: "Direct API - Fast web search with citations",
    speed: "Very Fast",
    quality: "Excellent",
    recommended: false,
    premium: false,
  },
  {
    id: "sonar-reasoning-pro",
    name: "Sonar Reasoning Pro",
    provider: "Perplexity",
    api: "perplexity",
    description: "Direct API - Deep reasoning with web grounding",
    speed: "Medium",
    quality: "Exceptional",
    recommended: false,
    premium: false,
  },

  // ===========================================
  // OPENROUTER MODELS (Budget & Fallback)
  // ===========================================

  // xAI Grok
  {
    id: "x-ai/grok-4.1-fast",
    name: "Grok 4.1 Fast",
    provider: "xAI",
    api: "openrouter",
    description: "Via OpenRouter - Agentic tool calling with 2M context",
    speed: "Very Fast",
    quality: "Excellent",
    recommended: false,
    premium: false,
  },

  // Google Gemini
  {
    id: "google/gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "Google",
    api: "openrouter",
    description: "Via OpenRouter - High-speed thinking model",
    speed: "Very Fast",
    quality: "Excellent",
    recommended: false,
    premium: false,
  },
  {
    id: "google/gemini-2.5-flash-preview",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    api: "openrouter",
    description: "Via OpenRouter - Advanced reasoning model",
    speed: "Very Fast",
    quality: "Very Good",
    recommended: false,
    premium: false,
  },

  // OpenRouter - OpenAI
  {
    id: "openai/gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "OpenAI",
    api: "openrouter",
    description: "Via OpenRouter - Fast & affordable",
    speed: "Very Fast",
    quality: "Excellent",
    recommended: false,
    premium: false,
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "OpenAI",
    api: "openrouter",
    description: "Via OpenRouter - Efficient & budget-friendly",
    speed: "Very Fast",
    quality: "Very Good",
    recommended: false,
    premium: false,
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
    premium: false,
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
    premium: false,
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
    premium: false,
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
    premium: false,
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
    premium: false,
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
    premium: false,
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
    premium: false,
  },
];

// API badge colors and labels
const API_BADGES: Record<ApiType, { label: string; color: string }> = {
  openrouter: { label: "OpenRouter", color: "bg-purple-500/20 text-purple-400" },
  openai: { label: "OpenAI Direct", color: "bg-green-500/20 text-green-400" },
  anthropic: { label: "Claude Direct", color: "bg-orange-500/20 text-orange-400" },
  perplexity: { label: "Perplexity", color: "bg-cyan-500/20 text-cyan-400" },
};

// BYOAPI provider definitions
const BYOAPI_PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "O", color: "bg-green-500/20 text-green-400", category: "ai" },
  { id: "anthropic", name: "Anthropic", icon: "A", color: "bg-orange-500/20 text-orange-400", category: "ai" },
  { id: "openrouter", name: "OpenRouter", icon: "R", color: "bg-purple-500/20 text-purple-400", category: "ai" },
  { id: "perplexity", name: "Perplexity", icon: "P", color: "bg-cyan-500/20 text-cyan-400", category: "search" },
  { id: "tavily", name: "Tavily", icon: "T", color: "bg-emerald-500/20 text-emerald-400", category: "search" },
  { id: "elevenlabs", name: "ElevenLabs", icon: "E", color: "bg-pink-500/20 text-pink-400", category: "voice" },
] as const;

// Platform-managed services
const PLATFORM_SERVICES = [
  { name: "Twilio", description: "Voice & SMS" },
  { name: "Deepgram", description: "Speech-to-Text" },
  { name: "Resend", description: "Email delivery" },
];

// Types for API key management
interface UserKeyInfo {
  provider: string;
  key_hint: string;
  is_valid: boolean;
  updated_at: string;
}

// Types for usage dashboard
interface UsageModule {
  used: number;
  limit: number;
  label: string;
}

interface UsageData {
  modules: Record<string, UsageModule>;
}

export default function SettingsPage() {
  const [selectedModel, setSelectedModel] = useState("gpt-5-mini");
  const [saved, setSaved] = useState(false);
  const [premiumPrompt, setPremiumPrompt] = useState<string | null>(null);

  // Profile state
  const [profileName, setProfileName] = useState("Dhruv");
  const [profileEmail, setProfileEmail] = useState("aiwithdhruv@gmail.com");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  // Subscription state
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("free");

  // API Keys state
  const [userKeys, setUserKeys] = useState<UserKeyInfo[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [addingKeyFor, setAddingKeyFor] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [keyValidating, setKeyValidating] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keySuccess, setKeySuccess] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  // Usage state
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  // Trial state
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login?redirect=/settings";
        return;
      }
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Could not open billing portal.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingPortal(false);
    }
  };

  // Fetch user API keys
  const fetchUserKeys = async () => {
    setKeysLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setKeysLoading(false); return; }
      const res = await fetch("/api/user-keys", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserKeys(data.keys || []);
      } else {
        // API not implemented yet, use empty
        setUserKeys([]);
      }
    } catch {
      setUserKeys([]);
    } finally {
      setKeysLoading(false);
    }
  };

  // Save an API key
  const handleSaveKey = async (provider: string) => {
    if (!keyInput.trim()) {
      setKeyError("Please enter an API key.");
      return;
    }
    setKeyValidating(true);
    setKeyError(null);
    setKeySuccess(null);
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setKeyError("Not authenticated. Please log in again."); setKeyValidating(false); return; }
      const res = await fetch("/api/user-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ provider, key: keyInput.trim() }),
      });
      if (res.ok) {
        setKeySuccess("Key validated and saved successfully.");
        setAddingKeyFor(null);
        setKeyInput("");
        fetchUserKeys();
        setTimeout(() => setKeySuccess(null), 3000);
      } else {
        const data = await res.json();
        setKeyError(data.error || "Failed to validate key. Please check and try again.");
      }
    } catch {
      setKeyError("Network error. Please try again.");
    } finally {
      setKeyValidating(false);
    }
  };

  // Delete an API key
  const handleDeleteKey = async (provider: string) => {
    setDeletingKey(provider);
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setDeletingKey(null); return; }
      const res = await fetch(`/api/user-keys?provider=${provider}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        fetchUserKeys();
      }
    } catch {
      // silent fail
    } finally {
      setDeletingKey(null);
    }
  };

  // Fetch usage data (also sets plan + trial info from database)
  const USAGE_LABELS: Record<string, string> = {
    coaching_sessions: "Coaching Sessions",
    contacts_created: "Contacts",
    ai_calls_made: "AI Calls",
    followups_sent: "Follow-ups",
    analyses_run: "Analyses",
  };

  const fetchUsageData = async () => {
    setUsageLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setUsageLoading(false); return; }
      const res = await fetch("/api/usage", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Update plan from database
        if (data.plan_type) setCurrentPlan(data.plan_type);
        // Update trial days from database
        if (data.is_trial && data.trial_ends_at) {
          const remaining = Math.max(0, Math.ceil((new Date(data.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          setTrialDaysRemaining(remaining);
        } else {
          setTrialDaysRemaining(null);
        }
        // Transform flat API response to { modules: { key: { used, limit, label } } }
        const modules: Record<string, UsageModule> = {};
        for (const key of Object.keys(USAGE_LABELS)) {
          if (data[key] && typeof data[key] === "object") {
            modules[key] = {
              used: data[key].used ?? 0,
              limit: data[key].limit ?? -1,
              label: USAGE_LABELS[key],
            };
          }
        }
        setUsageData({ modules });
      }
    } catch {
      // silent fail — usage display not critical
    } finally {
      setUsageLoading(false);
    }
  };

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

    // Fetch API keys and usage (trial + plan info loaded from DB via fetchUsageData)
    fetchUserKeys();
    fetchUsageData();
  }, []);

  const handleSaveModel = () => {
    // Prevent saving a premium model on free plan
    if (PREMIUM_MODEL_IDS.has(selectedModel) && currentPlan === "free") {
      setPremiumPrompt(AI_MODELS.find(m => m.id === selectedModel)?.name || "This model");
      return;
    }
    localStorage.setItem("ai_model", selectedModel);
    setPremiumPrompt(null);
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

  // Helper: get key info for a provider
  const getKeyForProvider = (providerId: string): UserKeyInfo | undefined => {
    return userKeys.find((k) => k.provider === providerId);
  };

  // Helper: check if user has any BYOAPI keys
  const hasAnyKeys = userKeys.length > 0;

  // Helper: get subscription label
  const getSubscriptionLabel = () => {
    if (currentPlan === "module") return "Active Subscription";
    if (currentPlan === "bundle") return "All-in-One Bundle";
    if (currentPlan === "starter") return "Starter";
    if (currentPlan === "growth") return "Growth";
    if (currentPlan === "enterprise") return "Enterprise";
    return "Free";
  };

  // Helper: usage bar percentage
  const getUsagePercent = (used: number, limit: number) => {
    if (limit === -1) return 0; // unlimited
    if (limit === 0) return 100;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  // Helper: usage bar color
  const getUsageBarColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500";
    if (percent >= 70) return "bg-warningamber";
    return "bg-neonblue";
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
                  {AI_MODELS.map((model) => {
                    const isPremium = model.premium;
                    const isLocked = isPremium && currentPlan === "free";

                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          if (isLocked) {
                            setPremiumPrompt(model.name);
                            return;
                          }
                          setSelectedModel(model.id);
                          setPremiumPrompt(null);
                        }}
                        className={cn(
                          "w-full p-4 rounded-lg text-left transition-all border relative",
                          isLocked
                            ? "bg-onyx/60 border-gunmetal cursor-not-allowed"
                            : selectedModel === model.id
                              ? "bg-neonblue/10 border-neonblue"
                              : "bg-onyx border-gunmetal hover:border-neonblue/50"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className={cn("flex-1", isLocked && "opacity-60")}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-platinum">
                                {model.name}
                              </h4>
                              <Badge className={cn("text-xs", API_BADGES[model.api].color)}>
                                {API_BADGES[model.api].label}
                              </Badge>
                              {isPremium && (
                                <Badge className="bg-warningamber/20 text-warningamber text-xs flex items-center gap-1">
                                  <Crown className="h-3 w-3" />
                                  Pro
                                </Badge>
                              )}
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
                          {isLocked ? (
                            <Lock className="h-5 w-5 text-warningamber shrink-0" />
                          ) : selectedModel === model.id ? (
                            <Check className="h-5 w-5 text-neonblue shrink-0" />
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Premium upgrade prompt */}
                {premiumPrompt && currentPlan === "free" && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-warningamber/10 border border-warningamber/30">
                    <Lock className="h-5 w-5 text-warningamber shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-platinum font-medium">
                        {premiumPrompt} requires a Pro plan
                      </p>
                      <p className="text-xs text-silver mt-0.5">
                        Upgrade to unlock premium models with superior intelligence and speed.
                      </p>
                    </div>
                    <Link href="/pricing">
                      <Button size="sm" className="bg-warningamber hover:bg-warningamber/80 text-black shrink-0">
                        <Crown className="h-3.5 w-3.5 mr-1" />
                        Upgrade
                      </Button>
                    </Link>
                  </div>
                )}

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

            {/* ============================================= */}
            {/* API Keys Section */}
            {/* ============================================= */}
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center gap-2">
                  <Key className="h-5 w-5 text-warningamber" />
                  API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Trial Banner */}
                {!hasAnyKeys && currentPlan === "free" && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-warningamber/10 border border-warningamber/30">
                    <AlertTriangle className="h-5 w-5 text-warningamber shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-platinum font-medium">
                        Trial Mode
                      </p>
                      <p className="text-xs text-silver mt-0.5">
                        Using platform AI keys for {trialDaysRemaining !== null ? trialDaysRemaining : 15} days. Add your own API keys to continue after trial ends.
                      </p>
                    </div>
                    {trialDaysRemaining !== null && (
                      <Badge className="bg-warningamber/20 text-warningamber text-xs flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" />
                        {trialDaysRemaining}d left
                      </Badge>
                    )}
                  </div>
                )}

                {/* Success message */}
                {keySuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-automationgreen/10 border border-automationgreen/30">
                    <Check className="h-4 w-4 text-automationgreen" />
                    <p className="text-sm text-automationgreen">{keySuccess}</p>
                  </div>
                )}

                {/* BYOAPI Section */}
                <div>
                  <p className="text-sm text-silver mb-3">
                    Bring your own API keys for direct provider access with lower latency.
                  </p>

                  {keysLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-mist" />
                      <span className="text-sm text-mist ml-2">Loading keys...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* AI Providers */}
                      <p className="text-xs text-mist uppercase tracking-wider font-medium">AI Providers</p>
                      <div className="space-y-3">
                      {BYOAPI_PROVIDERS.filter(p => p.category === "ai").map((provider) => {
                        const keyInfo = getKeyForProvider(provider.id);
                        const isAdding = addingKeyFor === provider.id;
                        const isDeleting = deletingKey === provider.id;

                        return (
                          <div key={provider.id} className="rounded-lg bg-onyx border border-gunmetal overflow-hidden">
                            {/* Provider row */}
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-3">
                                <div className={cn("h-8 w-8 rounded flex items-center justify-center text-sm font-bold", provider.color)}>
                                  {provider.icon}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-platinum">{provider.name}</p>
                                  {keyInfo ? (
                                    <p className="text-xs text-automationgreen flex items-center gap-1">
                                      <Check className="h-3 w-3" />
                                      Connected
                                      <span className="text-mist ml-1">...{keyInfo.key_hint}</span>
                                    </p>
                                  ) : (
                                    <p className="text-xs text-mist">Not Set</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {keyInfo ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setAddingKeyFor(provider.id);
                                        setKeyInput("");
                                        setKeyError(null);
                                      }}
                                      className="border-gunmetal text-silver hover:text-platinum text-xs h-8 px-3"
                                    >
                                      <Edit3 className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteKey(provider.id)}
                                      disabled={isDeleting}
                                      className="border-gunmetal text-red-400 hover:text-red-300 hover:border-red-400/50 text-xs h-8 px-3"
                                    >
                                      {isDeleting ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setAddingKeyFor(provider.id);
                                      setKeyInput("");
                                      setKeyError(null);
                                    }}
                                    className="bg-neonblue hover:bg-electricblue text-white text-xs h-8 px-3"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Key
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Inline key input */}
                            {isAdding && (
                              <div className="border-t border-gunmetal p-3 space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    type="password"
                                    value={keyInput}
                                    onChange={(e) => {
                                      setKeyInput(e.target.value);
                                      setKeyError(null);
                                    }}
                                    placeholder={`Enter your ${provider.name} API key...`}
                                    className="bg-graphite border-gunmetal text-platinum flex-1 text-sm"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveKey(provider.id)}
                                    disabled={keyValidating || !keyInput.trim()}
                                    className="bg-automationgreen hover:bg-automationgreen/80 text-black text-xs h-9 px-4 shrink-0"
                                  >
                                    {keyValidating ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      <Shield className="h-3 w-3 mr-1" />
                                    )}
                                    Validate & Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setAddingKeyFor(null);
                                      setKeyInput("");
                                      setKeyError(null);
                                    }}
                                    className="border-gunmetal text-silver hover:text-platinum h-9 px-2 shrink-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                {keyError && (
                                  <p className="text-xs text-red-400 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {keyError}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      </div>

                      {/* Web Search Providers */}
                      <p className="text-xs text-mist uppercase tracking-wider font-medium pt-2">Web Search</p>
                      <div className="space-y-3">
                      {BYOAPI_PROVIDERS.filter(p => p.category === "search").map((provider) => {
                        const keyInfo = getKeyForProvider(provider.id);
                        const isAdding = addingKeyFor === provider.id;
                        const isDeleting = deletingKey === provider.id;

                        return (
                          <div key={provider.id} className="rounded-lg bg-onyx border border-gunmetal overflow-hidden">
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-3">
                                <div className={cn("h-8 w-8 rounded flex items-center justify-center text-sm font-bold", provider.color)}>
                                  {provider.icon}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-platinum">{provider.name}</p>
                                  {keyInfo ? (
                                    <p className="text-xs text-automationgreen flex items-center gap-1">
                                      <Check className="h-3 w-3" />
                                      Connected
                                      <span className="text-mist ml-1">...{keyInfo.key_hint}</span>
                                    </p>
                                  ) : (
                                    <p className="text-xs text-mist">Not Set</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {keyInfo ? (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => { setAddingKeyFor(provider.id); setKeyInput(""); setKeyError(null); }} className="border-gunmetal text-silver hover:text-platinum text-xs h-8 px-3">
                                      <Edit3 className="h-3 w-3 mr-1" />Edit
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleDeleteKey(provider.id)} disabled={isDeleting} className="border-gunmetal text-red-400 hover:text-red-300 hover:border-red-400/50 text-xs h-8 px-3">
                                      {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                    </Button>
                                  </>
                                ) : (
                                  <Button size="sm" onClick={() => { setAddingKeyFor(provider.id); setKeyInput(""); setKeyError(null); }} className="bg-neonblue hover:bg-electricblue text-white text-xs h-8 px-3">
                                    <Plus className="h-3 w-3 mr-1" />Add Key
                                  </Button>
                                )}
                              </div>
                            </div>
                            {isAdding && (
                              <div className="border-t border-gunmetal p-3 space-y-2">
                                <div className="flex gap-2">
                                  <Input type="password" value={keyInput} onChange={(e) => { setKeyInput(e.target.value); setKeyError(null); }} placeholder={`Enter your ${provider.name} API key...`} className="bg-graphite border-gunmetal text-platinum flex-1 text-sm" autoFocus />
                                  <Button size="sm" onClick={() => handleSaveKey(provider.id)} disabled={keyValidating || !keyInput.trim()} className="bg-automationgreen hover:bg-automationgreen/80 text-black text-xs h-9 px-4 shrink-0">
                                    {keyValidating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                                    Validate & Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => { setAddingKeyFor(null); setKeyInput(""); setKeyError(null); }} className="border-gunmetal text-silver hover:text-platinum h-9 px-2 shrink-0">
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                {keyError && <p className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{keyError}</p>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      </div>

                      {/* Voice Providers */}
                      <p className="text-xs text-mist uppercase tracking-wider font-medium pt-2">Voice & Audio</p>
                      <div className="space-y-3">
                      {BYOAPI_PROVIDERS.filter(p => p.category === "voice").map((provider) => {
                        const keyInfo = getKeyForProvider(provider.id);
                        const isAdding = addingKeyFor === provider.id;
                        const isDeleting = deletingKey === provider.id;

                        return (
                          <div key={provider.id} className="rounded-lg bg-onyx border border-gunmetal overflow-hidden">
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-3">
                                <div className={cn("h-8 w-8 rounded flex items-center justify-center text-sm font-bold", provider.color)}>
                                  {provider.icon}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-platinum">{provider.name}</p>
                                  {keyInfo ? (
                                    <p className="text-xs text-automationgreen flex items-center gap-1">
                                      <Check className="h-3 w-3" />
                                      Connected
                                      <span className="text-mist ml-1">...{keyInfo.key_hint}</span>
                                    </p>
                                  ) : (
                                    <p className="text-xs text-mist">Not Set</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {keyInfo ? (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => { setAddingKeyFor(provider.id); setKeyInput(""); setKeyError(null); }} className="border-gunmetal text-silver hover:text-platinum text-xs h-8 px-3">
                                      <Edit3 className="h-3 w-3 mr-1" />Edit
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleDeleteKey(provider.id)} disabled={isDeleting} className="border-gunmetal text-red-400 hover:text-red-300 hover:border-red-400/50 text-xs h-8 px-3">
                                      {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                    </Button>
                                  </>
                                ) : (
                                  <Button size="sm" onClick={() => { setAddingKeyFor(provider.id); setKeyInput(""); setKeyError(null); }} className="bg-neonblue hover:bg-electricblue text-white text-xs h-8 px-3">
                                    <Plus className="h-3 w-3 mr-1" />Add Key
                                  </Button>
                                )}
                              </div>
                            </div>
                            {isAdding && (
                              <div className="border-t border-gunmetal p-3 space-y-2">
                                <div className="flex gap-2">
                                  <Input type="password" value={keyInput} onChange={(e) => { setKeyInput(e.target.value); setKeyError(null); }} placeholder={`Enter your ${provider.name} API key...`} className="bg-graphite border-gunmetal text-platinum flex-1 text-sm" autoFocus />
                                  <Button size="sm" onClick={() => handleSaveKey(provider.id)} disabled={keyValidating || !keyInput.trim()} className="bg-automationgreen hover:bg-automationgreen/80 text-black text-xs h-9 px-4 shrink-0">
                                    {keyValidating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                                    Validate & Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => { setAddingKeyFor(null); setKeyInput(""); setKeyError(null); }} className="border-gunmetal text-silver hover:text-platinum h-9 px-2 shrink-0">
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                {keyError && <p className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{keyError}</p>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Platform Managed Section */}
                <div>
                  <p className="text-xs text-mist uppercase tracking-wider font-medium mb-3">
                    Platform Managed
                  </p>
                  <div className="space-y-2">
                    {PLATFORM_SERVICES.map((service) => (
                      <div
                        key={service.name}
                        className="flex items-center justify-between p-3 bg-onyx rounded-lg border border-gunmetal"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-automationgreen/20 flex items-center justify-center">
                            <Check className="h-4 w-4 text-automationgreen" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-platinum">{service.name}</p>
                            <p className="text-xs text-mist">{service.description}</p>
                          </div>
                        </div>
                        <Badge className="bg-automationgreen/20 text-automationgreen text-xs">
                          Platform Managed
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ============================================= */}
            {/* Usage Dashboard */}
            {/* ============================================= */}
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-neonblue" />
                  Usage Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {usageLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-mist" />
                    <span className="text-sm text-mist ml-2">Loading usage data...</span>
                  </div>
                ) : usageData ? (
                  <>
                    <p className="text-sm text-silver">
                      Track your resource usage across all modules.
                    </p>

                    <div className="space-y-4">
                      {Object.entries(usageData.modules).map(([key, module]) => {
                        const isUnlimited = module.limit === -1;
                        const percent = isUnlimited ? 0 : getUsagePercent(module.used, module.limit);
                        const barColor = getUsageBarColor(percent);

                        return (
                          <div key={key} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-platinum">
                                {module.label}
                              </span>
                              <span className="text-xs text-mist">
                                {module.used} / {isUnlimited ? "Unlimited" : module.limit}
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-onyx overflow-hidden">
                              {isUnlimited ? (
                                <div className="h-full w-full bg-automationgreen/30 rounded-full" />
                              ) : (
                                <div
                                  className={cn("h-full rounded-full transition-all", barColor)}
                                  style={{ width: `${percent}%` }}
                                />
                              )}
                            </div>
                            {!isUnlimited && percent >= 90 && (
                              <p className="text-xs text-red-400 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Approaching limit
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {currentPlan === "free" && (
                      <div className="pt-2">
                        <Link href="/pricing">
                          <Button className="w-full bg-neonblue hover:bg-electricblue text-white gap-2">
                            <Crown className="h-4 w-4" />
                            Upgrade for Higher Limits
                          </Button>
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-mist text-center py-4">
                    Unable to load usage data.
                  </p>
                )}
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

            {/* Subscription */}
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center gap-2">
                  <Crown className="h-5 w-5 text-warningamber" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-silver">Current Plan</span>
                  <Badge className={cn(
                    "text-xs",
                    currentPlan !== "free" ? "bg-neonblue/20 text-neonblue" :
                    "bg-steel/20 text-silver"
                  )}>
                    {getSubscriptionLabel()}
                  </Badge>
                </div>

                {/* Trial countdown */}
                {currentPlan === "free" && trialDaysRemaining !== null && trialDaysRemaining > 0 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-warningamber/10 border border-warningamber/20">
                    <Clock className="h-4 w-4 text-warningamber shrink-0" />
                    <span className="text-xs text-warningamber">
                      Trial: {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""} remaining
                    </span>
                  </div>
                )}

                {currentPlan === "free" ? (
                  <Link href="/pricing">
                    <Button className="w-full bg-neonblue hover:bg-electricblue text-white gap-2">
                      <Crown className="h-4 w-4" />
                      Upgrade Plan
                    </Button>
                  </Link>
                ) : (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={loadingPortal}
                    variant="outline"
                    className="w-full border-gunmetal text-silver hover:text-platinum gap-2"
                  >
                    {loadingPortal ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    Manage Billing
                    <ExternalLink className="h-3 w-3" />
                  </Button>
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
