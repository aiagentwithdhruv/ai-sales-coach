"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

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

  const supabase = getSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
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
        setAuthChecked(true);
      } catch {
        if (mounted) {
          router.push("/login");
        }
      }
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: { user: { user_metadata?: Record<string, string>; email?: string } } | null) => {
      if (!mounted) return;
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          avatar: session.user.user_metadata?.avatar_url,
          role: "sales_rep",
        });
        if (!authChecked) setAuthChecked(true);
      } else if (authChecked) {
        // Only redirect on sign-out (not on initial load)
        router.push("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth, router, authChecked]);

  // Show loading while checking auth
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
