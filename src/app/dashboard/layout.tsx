"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, RefreshCw, WifiOff } from "lucide-react";

// Error boundary to catch client-side crashes
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
          <div className="max-w-md text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-errorred/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6 text-errorred" />
            </div>
            <h2 className="text-lg font-semibold text-platinum">Something went wrong</h2>
            <p className="text-sm text-silver">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neonblue hover:bg-electricblue text-white text-sm font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar?: string;
    role: "sales_rep" | "manager" | "admin";
  } | undefined>(undefined);
  const [authChecked, setAuthChecked] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const supabase = getSupabaseClient();
  const router = useRouter();
  const authCheckedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Timeout: if auth check takes > 8s, show retry UI instead of infinite spinner
    const timeout = setTimeout(() => {
      if (mounted && !authCheckedRef.current) {
        setTimedOut(true);
      }
    }, 8000);

    const checkAuth = async () => {
      try {
        // Step 1: Try getSession first (reads local storage — instant)
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          // We have a cached session — show dashboard immediately
          setUser({
            name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
            email: session.user.email || "",
            avatar: session.user.user_metadata?.avatar_url,
            role: "sales_rep",
          });
          authCheckedRef.current = true;
          setAuthChecked(true);

          // Step 2: Verify with server in background (refresh token if needed)
          supabase.auth.getUser().catch(() => {
            // If server validation fails, session expired — redirect to login
            if (mounted) router.push("/login");
          });
          return;
        }

        // No cached session — try server check
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        if (!mounted) return;

        if (error || !authUser) {
          router.push("/login");
          return;
        }

        setUser({
          name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
          email: authUser.email || "",
          avatar: authUser.user_metadata?.avatar_url,
          role: "sales_rep",
        });
        authCheckedRef.current = true;
        setAuthChecked(true);
      } catch {
        if (mounted) {
          router.push("/login");
        }
      }
    };

    checkAuth();

    // Listen for auth changes (sign-in from another tab, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: { user: { user_metadata?: Record<string, string>; email?: string } } | null) => {
      if (!mounted) return;
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          avatar: session.user.user_metadata?.avatar_url,
          role: "sales_rep",
        });
        if (!authCheckedRef.current) {
          authCheckedRef.current = true;
          setAuthChecked(true);
        }
      } else if (authCheckedRef.current) {
        // Signed out
        router.push("/login");
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [supabase.auth, router]);

  // Timed out — show retry UI
  if (timedOut && !authChecked) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-warningamber/10 flex items-center justify-center mx-auto">
            <WifiOff className="h-6 w-6 text-warningamber" />
          </div>
          <h2 className="text-lg font-semibold text-platinum">Taking longer than expected</h2>
          <p className="text-sm text-silver">
            Could not connect to the server. Check your internet connection and try again.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neonblue hover:bg-electricblue text-white text-sm font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
            <button
              onClick={() => router.push("/login")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-steel hover:bg-gunmetal text-silver text-sm font-medium transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking auth (max 8 seconds)
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-neonblue" />
          <p className="text-sm text-silver">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary>
      <DashboardLayout user={user}>{children}</DashboardLayout>
    </DashboardErrorBoundary>
  );
}
