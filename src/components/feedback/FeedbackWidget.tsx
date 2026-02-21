"use client";

import { useState, useRef, useCallback } from "react";
import { MessageSquarePlus, X, ClipboardList, Vote } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { FeedbackForm } from "./FeedbackForm";
import { SuggestionVote } from "./SuggestionVote";

type Tab = "report" | "vote";

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("report");
  const panelRef = useRef<HTMLDivElement>(null);

  let userEmail: string | undefined;
  let userName: string | undefined;

  try {
    const { user } = useAuth();
    userEmail = user?.email || undefined;
    userName = user?.user_metadata?.full_name || undefined;
  } catch {
    // Not inside AuthProvider or not logged in — that's fine
  }

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSuccess = useCallback(() => {
    setTimeout(() => {
      setIsOpen(false);
      setActiveTab("report");
    }, 2500);
  }, []);

  return (
    <>
      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-20 left-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[70vh] rounded-2xl bg-graphite border border-gunmetal shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
          style={{ animation: "feedbackFadeInUp 0.25s ease-out" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-onyx border-b border-gunmetal">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-warningamber to-orange-500 flex items-center justify-center">
                <MessageSquarePlus className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-platinum leading-tight">
                  Feedback & Ideas
                </p>
                <p className="text-[10px] text-warningamber leading-tight">
                  Help us make QuotaHit better
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className="p-1.5 rounded-lg hover:bg-gunmetal text-silver hover:text-platinum transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gunmetal bg-onyx/50">
            <button
              onClick={() => setActiveTab("report")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                activeTab === "report"
                  ? "text-neonblue border-b-2 border-neonblue"
                  : "text-mist hover:text-silver"
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Report
            </button>
            <button
              onClick={() => setActiveTab("vote")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                activeTab === "vote"
                  ? "text-neonblue border-b-2 border-neonblue"
                  : "text-mist hover:text-silver"
              }`}
            >
              <Vote className="h-3.5 w-3.5" />
              Vote
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "report" ? (
              <FeedbackForm
                userEmail={userEmail}
                userName={userName}
                widgetRef={panelRef}
                onSuccess={handleSuccess}
              />
            ) : (
              <SuggestionVote />
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 bg-onyx/50 border-t border-gunmetal">
            <p className="text-[10px] text-mist text-center">
              Your feedback shapes QuotaHit
            </p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={handleToggle}
        className="fixed bottom-5 left-5 z-50 group"
        aria-label={isOpen ? "Close feedback" : "Give feedback"}
      >
        <style>{`
          @keyframes feedbackFadeInUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes feedback-border-spin {
            from { --fb-angle: 0deg; }
            to { --fb-angle: 360deg; }
          }
          @property --fb-angle {
            syntax: '<angle>';
            initial-value: 0deg;
            inherits: false;
          }
          .feedback-btn-glow {
            animation: feedback-border-spin 3s linear infinite;
            background: conic-gradient(
              from var(--fb-angle),
              transparent 0%,
              rgba(255,176,32,0.6) 15%,
              transparent 35%,
              transparent 65%,
              rgba(255,140,0,0.6) 85%,
              transparent 100%
            );
          }
        `}</style>

        {/* Spinning border glow */}
        {!isOpen && (
          <div className="feedback-btn-glow absolute -inset-[1.5px] rounded-2xl" />
        )}

        {/* Button body */}
        <div
          className="relative flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-white/[0.08] transition-all group-hover:scale-[1.03]"
          style={{
            background: isOpen ? "#1e1e24" : "#111114",
            boxShadow: isOpen ? "none" : "0 0 20px rgba(255,176,32,0.12)",
          }}
        >
          {isOpen ? (
            <>
              <X className="h-4.5 w-4.5 text-silver" />
              <span className="text-sm font-medium text-silver">Close</span>
            </>
          ) : (
            <>
              <MessageSquarePlus className="h-5 w-5 text-warningamber" />
              <span className="text-sm font-medium text-platinum whitespace-nowrap">
                Feedback
              </span>
            </>
          )}
        </div>
      </button>
    </>
  );
}
