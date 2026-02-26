"use client";

/**
 * Voice Onboarding Flow
 *
 * "Tell me about your business" — conversational voice-first setup.
 * Uses Web Speech API (via VoiceInput) to collect ICP data
 * through natural conversation instead of form fields.
 *
 * Flow:
 *   1. "What does your company sell?"
 *   2. "Who's your ideal customer?"
 *   3. "What's your website?"
 *   4. AI summarizes + confirms
 *   5. Save to user_metadata
 */

import { useState, useCallback } from "react";
import { VoiceInput } from "@/components/ui/voice-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  Mic,
  ArrowRight,
  Check,
  Sparkles,
  Loader2,
  Edit3,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceOnboardingProps {
  onComplete: (data: ICPData) => void;
}

interface ICPData {
  product_description: string;
  target_customer: string;
  website_url: string;
  industry: string;
}

type Step = "intro" | "product" | "customer" | "website" | "confirm" | "saving";

const PROMPTS: Record<string, { question: string; hint: string }> = {
  product: {
    question: "What does your company sell or do?",
    hint: "E.g., 'We sell project management software for remote teams'",
  },
  customer: {
    question: "Who is your ideal customer?",
    hint: "E.g., 'Tech startups with 10-50 employees in the US'",
  },
  website: {
    question: "What's your company website?",
    hint: "E.g., 'quotahit.com'",
  },
};

export function VoiceOnboarding({ onComplete }: VoiceOnboardingProps) {
  const [step, setStep] = useState<Step>("intro");
  const [data, setData] = useState<ICPData>({
    product_description: "",
    target_customer: "",
    website_url: "",
    industry: "",
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = getSupabaseClient();

  const handleTranscript = useCallback(
    (text: string) => {
      if (step === "product") {
        setData((d) => ({ ...d, product_description: text }));
        setTimeout(() => setStep("customer"), 500);
      } else if (step === "customer") {
        setData((d) => ({ ...d, target_customer: text }));
        setTimeout(() => setStep("website"), 500);
      } else if (step === "website") {
        // Clean up URL from voice
        const cleaned = text
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "");
        setData((d) => ({ ...d, website_url: cleaned }));
        setTimeout(() => setStep("confirm"), 500);
      }
    },
    [step]
  );

  const handleSave = async () => {
    setSaving(true);
    setStep("saving");

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          product_description: data.product_description,
          target_customer: data.target_customer,
          website_url: data.website_url,
          industry: data.industry || inferIndustry(data.product_description),
          setup_complete: true,
          onboarding_method: "voice",
        },
      });

      if (error) throw error;
      localStorage.setItem("setup_complete", "true");
      onComplete(data);
    } catch (error) {
      console.error("Save error:", error);
      setSaving(false);
      setStep("confirm");
    }
  };

  const handleTextSubmit = (field: string, value: string) => {
    setData((d) => ({ ...d, [field]: value }));
    setEditingField(null);

    if (field === "product_description" && step === "product") {
      setStep("customer");
    } else if (field === "target_customer" && step === "customer") {
      setStep("website");
    } else if (field === "website_url" && step === "website") {
      setStep("confirm");
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Intro */}
        {step === "intro" && (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
              <Mic className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-platinum">
                Tell me about your business
              </h2>
              <p className="text-silver mt-2 max-w-sm mx-auto">
                Just talk naturally — I&apos;ll set up your AI sales team based on what
                you tell me. Or type if you prefer.
              </p>
            </div>
            <Button
              onClick={() => setStep("product")}
              className="bg-neonblue hover:bg-electricblue text-white gap-2 px-8 py-3"
            >
              <Mic className="h-5 w-5" />
              Start Talking
            </Button>
            <button
              onClick={() => setStep("product")}
              className="block mx-auto text-sm text-mist hover:text-silver transition-colors"
            >
              I&apos;d rather type
            </button>
          </div>
        )}

        {/* Question Steps */}
        {(step === "product" || step === "customer" || step === "website") && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Progress dots */}
            <div className="flex justify-center gap-2">
              {["product", "customer", "website"].map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all",
                    s === step
                      ? "bg-neonblue scale-125"
                      : (["product", "customer", "website"].indexOf(step) > i)
                        ? "bg-automationgreen"
                        : "bg-gunmetal"
                  )}
                />
              ))}
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-platinum">
                {PROMPTS[step].question}
              </h2>
              <p className="text-sm text-mist mt-2">{PROMPTS[step].hint}</p>
            </div>

            {/* Voice input */}
            <div className="flex flex-col items-center gap-4">
              <VoiceInput
                mode="transcribe"
                onTranscript={handleTranscript}
                size="lg"
                placeholder="Tap to speak..."
              />
              <p className="text-xs text-mist">or type below</p>
              <TextInput
                field={step === "product" ? "product_description" : step === "customer" ? "target_customer" : "website_url"}
                placeholder={PROMPTS[step].hint.replace("E.g., '", "").replace("'", "")}
                onSubmit={handleTextSubmit}
              />
            </div>

            {/* Show current answer if voice captured */}
            {step === "product" && data.product_description && (
              <AnswerBubble text={data.product_description} />
            )}
            {step === "customer" && data.target_customer && (
              <AnswerBubble text={data.target_customer} />
            )}
            {step === "website" && data.website_url && (
              <AnswerBubble text={data.website_url} />
            )}
          </div>
        )}

        {/* Confirm */}
        {step === "confirm" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <Sparkles className="h-8 w-8 text-neonblue mx-auto mb-3" />
              <h2 className="text-xl font-bold text-platinum">
                Here&apos;s what I heard
              </h2>
              <p className="text-sm text-mist mt-1">
                Edit anything that doesn&apos;t look right
              </p>
            </div>

            <div className="space-y-3">
              <ConfirmField
                label="What you sell"
                value={data.product_description}
                editing={editingField === "product_description"}
                onEdit={() => setEditingField("product_description")}
                onSave={(v) => {
                  setData((d) => ({ ...d, product_description: v }));
                  setEditingField(null);
                }}
              />
              <ConfirmField
                label="Ideal customer"
                value={data.target_customer}
                editing={editingField === "target_customer"}
                onEdit={() => setEditingField("target_customer")}
                onSave={(v) => {
                  setData((d) => ({ ...d, target_customer: v }));
                  setEditingField(null);
                }}
              />
              <ConfirmField
                label="Website"
                value={data.website_url}
                editing={editingField === "website_url"}
                onEdit={() => setEditingField("website_url")}
                onSave={(v) => {
                  setData((d) => ({ ...d, website_url: v }));
                  setEditingField(null);
                }}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setData({
                    product_description: "",
                    target_customer: "",
                    website_url: "",
                    industry: "",
                  });
                  setStep("product");
                }}
                className="flex-1 border-gunmetal text-silver hover:text-platinum"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Start Over
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-automationgreen hover:bg-automationgreen/90 text-black font-semibold"
              >
                <Check className="h-4 w-4 mr-2" />
                Looks Good — Set Up My Team
              </Button>
            </div>
          </div>
        )}

        {/* Saving */}
        {step === "saving" && (
          <div className="text-center space-y-4 animate-in fade-in duration-300">
            <Loader2 className="h-12 w-12 text-neonblue animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-platinum">
              Setting up your AI sales team...
            </h2>
            <p className="text-sm text-mist">
              Configuring your Lead Finder, AI Caller, and Follow-up Manager
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function TextInput({
  field,
  placeholder,
  onSubmit,
}: {
  field: string;
  placeholder: string;
  onSubmit: (field: string, value: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <div className="flex gap-2 w-full">
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            onSubmit(field, value.trim());
            setValue("");
          }
        }}
        className="flex-1 bg-onyx border-gunmetal text-platinum placeholder:text-mist/50"
      />
      <Button
        size="sm"
        onClick={() => {
          if (value.trim()) {
            onSubmit(field, value.trim());
            setValue("");
          }
        }}
        disabled={!value.trim()}
        className="bg-neonblue hover:bg-electricblue text-white"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function AnswerBubble({ text }: { text: string }) {
  return (
    <div className="bg-neonblue/10 border border-neonblue/20 rounded-lg p-3 text-sm text-platinum animate-in fade-in slide-in-from-bottom-2 duration-300">
      &ldquo;{text}&rdquo;
    </div>
  );
}

function ConfirmField({
  label,
  value,
  editing,
  onEdit,
  onSave,
}: {
  label: string;
  value: string;
  editing: boolean;
  onEdit: () => void;
  onSave: (value: string) => void;
}) {
  const [editValue, setEditValue] = useState(value);

  if (editing) {
    return (
      <div className="bg-onyx rounded-lg p-4 border border-neonblue/30">
        <p className="text-xs text-mist mb-2">{label}</p>
        <div className="flex gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave(editValue);
            }}
            className="flex-1 bg-graphite border-gunmetal text-platinum"
            autoFocus
          />
          <Button
            size="sm"
            onClick={() => onSave(editValue)}
            className="bg-neonblue hover:bg-electricblue text-white"
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-onyx rounded-lg p-4 flex items-start justify-between gap-3 group">
      <div>
        <p className="text-xs text-mist">{label}</p>
        <p className="text-sm text-platinum mt-1">{value || "Not provided"}</p>
      </div>
      <button
        onClick={onEdit}
        className="text-mist hover:text-neonblue transition-colors opacity-0 group-hover:opacity-100 shrink-0"
      >
        <Edit3 className="h-4 w-4" />
      </button>
    </div>
  );
}

function inferIndustry(productDescription: string): string {
  const lower = productDescription.toLowerCase();
  if (lower.includes("saas") || lower.includes("software") || lower.includes("app"))
    return "SaaS / Technology";
  if (lower.includes("agency") || lower.includes("marketing") || lower.includes("consulting"))
    return "Agency / Services";
  if (lower.includes("ecommerce") || lower.includes("e-commerce") || lower.includes("shop") || lower.includes("store"))
    return "E-commerce";
  if (lower.includes("real estate") || lower.includes("property"))
    return "Real Estate";
  if (lower.includes("health") || lower.includes("medical") || lower.includes("clinic"))
    return "Healthcare";
  if (lower.includes("finance") || lower.includes("insurance") || lower.includes("banking"))
    return "Financial Services";
  return "General Business";
}
