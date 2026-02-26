"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  Sparkles,
  ArrowRight,
  Globe,
  Mail,
  Phone,
  MessageSquare,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SetupWizardProps {
  onComplete: () => void;
}

const channels = [
  {
    id: "email",
    label: "Email",
    icon: Mail,
    description: "Automated email sequences",
    available: true,
  },
  {
    id: "phone",
    label: "Phone Calls",
    icon: Phone,
    description: "AI-powered outbound calls",
    available: true,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageSquare,
    description: "WhatsApp outreach",
    comingSoon: true,
    available: false,
  },
];

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [productDescription, setProductDescription] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["email"]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = getSupabaseClient();

  const toggleChannel = (id: string) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.updateUser({
        data: {
          product_description: productDescription || undefined,
          target_customer: targetCustomer || undefined,
          website_url: websiteUrl || undefined,
          preferred_channels: selectedChannels,
          setup_complete: true,
        },
      });
      localStorage.setItem("setup_complete", "true");
    } catch {
      // Non-critical — continue even if save fails
    }
    setIsLoading(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("setup_complete", "true");
    onComplete();
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-2 rounded-full transition-all",
              s === step ? "w-8 bg-neonblue" : s < step ? "w-2 bg-automationgreen" : "w-2 bg-gunmetal"
            )}
          />
        ))}
      </div>

      {/* Step 1: What you sell */}
      {step === 1 && (
        <Card className="glow-card bg-graphite border-gunmetal">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neonblue/10 mb-2">
                <Sparkles className="h-6 w-6 text-neonblue" />
              </div>
              <h2 className="text-2xl font-bold text-platinum">What does your company sell?</h2>
              <p className="text-sm text-silver">This helps your AI agents craft the perfect pitch.</p>
            </div>

            <div className="space-y-2">
              <Input
                type="text"
                placeholder="e.g. CRM software for mid-market companies"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="bg-onyx border-gunmetal text-platinum placeholder:text-mist/60 focus:border-neonblue text-base py-6"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between">
              <button onClick={handleSkip} className="text-sm text-mist hover:text-silver transition-colors">
                Skip setup
              </button>
              <Button onClick={() => setStep(2)} className="bg-neonblue hover:bg-electricblue text-white gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Who you sell to */}
      {step === 2 && (
        <Card className="glow-card bg-graphite border-gunmetal">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-automationgreen/10 mb-2">
                <Globe className="h-6 w-6 text-automationgreen" />
              </div>
              <h2 className="text-2xl font-bold text-platinum">Who&apos;s your ideal customer?</h2>
              <p className="text-sm text-silver">Your AI will target people matching this profile.</p>
            </div>

            <div className="space-y-4">
              <Input
                type="text"
                placeholder="e.g. VP Sales at 50-500 person SaaS companies"
                value={targetCustomer}
                onChange={(e) => setTargetCustomer(e.target.value)}
                className="bg-onyx border-gunmetal text-platinum placeholder:text-mist/60 focus:border-neonblue text-base py-6"
                autoFocus
              />
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                <Input
                  type="url"
                  placeholder="Your website (optional)"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="pl-10 bg-onyx border-gunmetal text-platinum placeholder:text-mist/60 focus:border-neonblue"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} className="text-silver hover:text-platinum">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="bg-neonblue hover:bg-electricblue text-white gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Channels */}
      {step === 3 && (
        <Card className="glow-card bg-graphite border-gunmetal">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-warningamber/10 mb-2">
                <Mail className="h-6 w-6 text-warningamber" />
              </div>
              <h2 className="text-2xl font-bold text-platinum">How do you want to reach them?</h2>
              <p className="text-sm text-silver">Select the channels your AI should use.</p>
            </div>

            <div className="space-y-3">
              {channels.map((channel) => {
                const Icon = channel.icon;
                const isSelected = selectedChannels.includes(channel.id);
                return (
                  <button
                    key={channel.id}
                    onClick={() => channel.available && toggleChannel(channel.id)}
                    disabled={!channel.available}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                      isSelected
                        ? "bg-neonblue/10 border-neonblue/40"
                        : "bg-onyx border-gunmetal hover:border-gunmetal/80",
                      !channel.available && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      isSelected ? "bg-neonblue/20" : "bg-gunmetal/50"
                    )}>
                      <Icon className={cn("h-5 w-5", isSelected ? "text-neonblue" : "text-silver")} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("font-medium", isSelected ? "text-platinum" : "text-silver")}>
                          {channel.label}
                        </p>
                        {channel.comingSoon && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-warningamber/10 text-warningamber font-medium">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-mist">{channel.description}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-neonblue flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(2)} className="text-silver hover:text-platinum">
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="bg-neonblue hover:bg-electricblue text-white gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Let&apos;s Go
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
