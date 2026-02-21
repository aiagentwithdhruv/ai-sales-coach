"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowBigUp, Sparkles } from "lucide-react";
import { SUGGESTIONS, type Suggestion } from "@/lib/suggestions";

const STORAGE_KEY = "qh_votes";

function getVotedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveVotedIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

interface VoteCounts {
  [id: string]: number;
}

export function SuggestionVote() {
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [counts, setCounts] = useState<VoteCounts>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Load voted IDs from localStorage
  useEffect(() => {
    setVotedIds(getVotedIds());
  }, []);

  const handleVote = useCallback(
    async (suggestion: Suggestion) => {
      if (votedIds.includes(suggestion.id) || loadingId) return;

      setLoadingId(suggestion.id);

      try {
        const res = await fetch("/api/feedback/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            suggestionId: suggestion.id,
            suggestionTitle: suggestion.title,
            action: "upvote",
          }),
        });

        const data = await res.json();

        if (data.success) {
          const newVotedIds = [...votedIds, suggestion.id];
          setVotedIds(newVotedIds);
          saveVotedIds(newVotedIds);
          setCounts((prev) => ({
            ...prev,
            [suggestion.id]: (prev[suggestion.id] || 0) + 1,
          }));
        }
      } catch {
        // Vote failed silently
      } finally {
        setLoadingId(null);
      }
    },
    [votedIds, loadingId]
  );

  // Sort by vote count (most voted first)
  const sorted = [...SUGGESTIONS].sort((a, b) => {
    return (counts[b.id] || 0) - (counts[a.id] || 0);
  });

  return (
    <div className="p-3 overflow-y-auto space-y-2" style={{ maxHeight: "calc(100% - 4px)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-warningamber" />
        <p className="text-xs text-silver">
          Vote for features you want most. We build what you need.
        </p>
      </div>

      {sorted.map((suggestion) => {
        const voted = votedIds.includes(suggestion.id);
        const count = counts[suggestion.id] || 0;
        const isLoading = loadingId === suggestion.id;

        return (
          <div
            key={suggestion.id}
            className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all ${
              voted
                ? "border-neonblue/20 bg-neonblue/5"
                : "border-gunmetal bg-graphite hover:border-gunmetal/80"
            }`}
          >
            {/* Vote button */}
            <button
              type="button"
              onClick={() => handleVote(suggestion)}
              disabled={voted || isLoading}
              className={`flex flex-col items-center min-w-[36px] py-1 rounded-lg transition-all ${
                voted
                  ? "text-neonblue"
                  : "text-mist hover:text-neonblue hover:bg-neonblue/10"
              } disabled:cursor-default`}
            >
              <ArrowBigUp
                className={`h-5 w-5 ${voted ? "fill-neonblue" : ""} ${
                  isLoading ? "animate-bounce" : ""
                }`}
              />
              <span className="text-[10px] font-medium">
                {count > 0 ? count : ""}
              </span>
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-platinum leading-tight">
                {suggestion.title}
              </p>
              <p className="text-xs text-mist mt-0.5 leading-snug">
                {suggestion.description}
              </p>
            </div>

            {/* Category badge */}
            <span
              className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                suggestion.category === "feature"
                  ? "bg-warningamber/10 text-warningamber"
                  : "bg-automationgreen/10 text-automationgreen"
              }`}
            >
              {suggestion.category === "feature" ? "New" : "Improve"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
