"use client";

import { useState, useRef } from "react";
import {
  Bug,
  Lightbulb,
  MessageSquare,
  Wrench,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { StarRating } from "./StarRating";
import { ScreenshotCapture } from "./ScreenshotCapture";

type Category = "bug" | "feature_request" | "feedback" | "improvement";

const CATEGORIES: {
  id: Category;
  label: string;
  icon: typeof Bug;
  color: string;
  bgColor: string;
}[] = [
  { id: "bug", label: "Bug", icon: Bug, color: "text-errorred", bgColor: "bg-errorred/15 border-errorred/30" },
  { id: "feature_request", label: "Feature", icon: Lightbulb, color: "text-warningamber", bgColor: "bg-warningamber/15 border-warningamber/30" },
  { id: "feedback", label: "Feedback", icon: MessageSquare, color: "text-neonblue", bgColor: "bg-neonblue/15 border-neonblue/30" },
  { id: "improvement", label: "Improve", icon: Wrench, color: "text-automationgreen", bgColor: "bg-automationgreen/15 border-automationgreen/30" },
];

const FIELD_LABELS: Record<
  Category,
  { primary: string; secondary: string; tertiary?: string }
> = {
  bug: {
    primary: "What happened?",
    secondary: "What did you expect?",
    tertiary: "Steps to reproduce",
  },
  feature_request: {
    primary: "What feature do you want?",
    secondary: "Why would this help you?",
  },
  feedback: {
    primary: "What do you love?",
    secondary: "What don't you love?",
    tertiary: "What should we improve?",
  },
  improvement: {
    primary: "What should we improve?",
    secondary: "How would you change it?",
  },
};

interface FeedbackFormProps {
  userEmail?: string;
  userName?: string;
  widgetRef?: React.RefObject<HTMLDivElement | null>;
  onSuccess?: () => void;
}

export function FeedbackForm({
  userEmail,
  userName,
  widgetRef,
  onSuccess,
}: FeedbackFormProps) {
  const [category, setCategory] = useState<Category | null>(null);
  const [rating, setRating] = useState(0);
  const [primaryText, setPrimaryText] = useState("");
  const [secondaryText, setSecondaryText] = useState("");
  const [tertiaryText, setTertiaryText] = useState("");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | undefined>();
  const [email, setEmail] = useState(userEmail || "");
  const [name, setName] = useState(userName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const formRef = useRef<HTMLDivElement>(null);

  const labels = category ? FIELD_LABELS[category] : null;

  const canSubmit =
    category && rating > 0 && primaryText.trim().length >= 3 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          rating,
          primaryText: primaryText.trim(),
          secondaryText: secondaryText.trim() || undefined,
          tertiaryText: tertiaryText.trim() || undefined,
          screenshotDataUrl,
          email: email.trim() || undefined,
          name: name.trim() || undefined,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 2500);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="h-12 w-12 rounded-full bg-automationgreen/20 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-automationgreen" />
        </div>
        <p className="text-sm font-medium text-platinum">
          Thanks for your feedback!
        </p>
        <p className="text-xs text-mist text-center">
          We&apos;ll review it and get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <div ref={formRef} className="space-y-4 p-3 overflow-y-auto" style={{ maxHeight: "calc(100% - 4px)" }}>
      {/* Category selector */}
      <div>
        <label className="text-[11px] text-mist uppercase tracking-wider mb-1.5 block">
          Category
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const selected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                  selected
                    ? `${cat.bgColor} ${cat.color}`
                    : "border-gunmetal text-mist hover:text-silver hover:border-silver/30"
                }`}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="text-[11px] text-mist uppercase tracking-wider mb-1.5 block">
          Rate your experience
        </label>
        <StarRating value={rating} onChange={setRating} />
      </div>

      {/* Dynamic text fields (shown only after category is selected) */}
      {labels && (
        <>
          <div>
            <label className="text-[11px] text-mist uppercase tracking-wider mb-1 block">
              {labels.primary} <span className="text-errorred">*</span>
            </label>
            <textarea
              value={primaryText}
              onChange={(e) => setPrimaryText(e.target.value)}
              placeholder="Tell us more..."
              rows={3}
              className="w-full bg-graphite border border-gunmetal rounded-lg px-3 py-2 text-sm text-platinum placeholder:text-mist/50 outline-none focus:border-neonblue/40 resize-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] text-mist uppercase tracking-wider mb-1 block">
              {labels.secondary}
            </label>
            <textarea
              value={secondaryText}
              onChange={(e) => setSecondaryText(e.target.value)}
              placeholder="Optional..."
              rows={2}
              className="w-full bg-graphite border border-gunmetal rounded-lg px-3 py-2 text-sm text-platinum placeholder:text-mist/50 outline-none focus:border-neonblue/40 resize-none transition-colors"
            />
          </div>

          {labels.tertiary && (
            <div>
              <label className="text-[11px] text-mist uppercase tracking-wider mb-1 block">
                {labels.tertiary}
              </label>
              <textarea
                value={tertiaryText}
                onChange={(e) => setTertiaryText(e.target.value)}
                placeholder="Optional..."
                rows={2}
                className="w-full bg-graphite border border-gunmetal rounded-lg px-3 py-2 text-sm text-platinum placeholder:text-mist/50 outline-none focus:border-neonblue/40 resize-none transition-colors"
              />
            </div>
          )}
        </>
      )}

      {/* Screenshot */}
      {category && (
        <div>
          <label className="text-[11px] text-mist uppercase tracking-wider mb-1.5 block">
            Screenshot
          </label>
          <ScreenshotCapture
            value={screenshotDataUrl}
            onChange={setScreenshotDataUrl}
            widgetRef={widgetRef}
            showBugPrompt={category === "bug"}
          />
        </div>
      )}

      {/* Contact info */}
      {category && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-mist uppercase tracking-wider mb-1 block">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
              className="w-full bg-graphite border border-gunmetal rounded-lg px-3 py-1.5 text-sm text-platinum placeholder:text-mist/50 outline-none focus:border-neonblue/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] text-mist uppercase tracking-wider mb-1 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Optional"
              className="w-full bg-graphite border border-gunmetal rounded-lg px-3 py-1.5 text-sm text-platinum placeholder:text-mist/50 outline-none focus:border-neonblue/40 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-3 py-2 rounded-lg bg-errorred/10 border border-errorred/20 text-xs text-errorred">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neonblue hover:bg-electricblue text-white text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit Feedback
          </>
        )}
      </button>
    </div>
  );
}
