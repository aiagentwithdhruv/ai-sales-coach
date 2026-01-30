"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { AuthChangeEvent } from "@supabase/supabase-js";

interface CreditsState {
  credits: number;
  totalUsed: number;
  isLoading: boolean;
  error: string | null;
}

export function useCredits() {
  const [state, setState] = useState<CreditsState>({
    credits: 0,
    totalUsed: 0,
    isLoading: true,
    error: null,
  });

  const supabase = getSupabaseClient();

  const fetchCredits = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setState({
          credits: 0,
          totalUsed: 0,
          isLoading: false,
          error: "Not authenticated",
        });
        return;
      }

      const response = await fetch("/api/credits", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch credits");
      }

      const data = await response.json();
      setState({
        credits: data.credits,
        totalUsed: data.total_used,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, [supabase.auth]);

  // Fetch credits on mount
  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Listen for auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === "SIGNED_IN") {
        fetchCredits();
      } else if (event === "SIGNED_OUT") {
        setState({
          credits: 0,
          totalUsed: 0,
          isLoading: false,
          error: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, fetchCredits]);

  const hasCredits = state.credits > 0;

  return {
    ...state,
    hasCredits,
    refetch: fetchCredits,
  };
}

/**
 * Helper to get auth token for API calls
 */
export async function getAuthToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}
