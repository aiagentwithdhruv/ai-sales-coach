"use client";

import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Shows a sticky banner when admin is impersonating a user account.
 * Detects impersonation via ?impersonated=true query param set during magic link redirect.
 */
export function ImpersonationBanner() {
  const [impersonating, setImpersonating] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    // Check if this is an impersonation session
    const params = new URLSearchParams(window.location.search);
    if (params.get("impersonated") === "true") {
      sessionStorage.setItem("impersonation_active", "true");
      // Clean URL
      params.delete("impersonated");
      const newUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
      window.history.replaceState({}, "", newUrl);
    }

    if (sessionStorage.getItem("impersonation_active") === "true") {
      setImpersonating(true);
      const supabase = getSupabaseClient();
      supabase.auth.getSession().then(({ data: { session } }: any) => {
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        }
      });
    }
  }, []);

  const handleExit = async () => {
    sessionStorage.removeItem("impersonation_active");
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = "/admin";
  };

  if (!impersonating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-warningamber text-black px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium shadow-lg">
      <Eye className="h-4 w-4" />
      <span>Admin View — You are viewing as <strong>{userEmail}</strong></span>
      <button
        onClick={handleExit}
        className="ml-2 px-3 py-1 bg-black/20 hover:bg-black/30 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
      >
        <X className="h-3 w-3" />
        Exit
      </button>
    </div>
  );
}
