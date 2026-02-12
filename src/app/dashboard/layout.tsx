"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { getSupabaseClient } from "@/lib/supabase/client";
import { AlertCircle, RefreshCw } from "lucide-react";

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

// Admin emails — keep in sync with api/admin/impersonate/route.ts
const ADMIN_EMAILS = [
  "aiwithdhruv@gmail.com",
  "dhruv@aiwithdruv.com",
  "admin@aiwithdruv.com",
  "dhruvtomar7008@gmail.com",
];

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Show dashboard immediately — never block on auth
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar?: string;
    role: "sales_rep" | "manager" | "admin";
  }>({
    name: "User",
    email: "",
    role: "sales_rep",
  });

  const supabase = getSupabaseClient();
  const router = useRouter();
  const redirectingRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // Race getSession against a 3s timeout
        // getSession can hang when refreshing expired tokens
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);

        if (!mounted) return;

        // Type-safe extraction
        const session = result && typeof result === "object" && "data" in result
          ? (result as { data: { session: { user: { user_metadata?: Record<string, string>; email?: string } } | null } }).data.session
          : null;

        if (session?.user) {
          const email = session.user.email || "";
          setUser({
            name: session.user.user_metadata?.full_name || email.split("@")[0] || "User",
            email,
            avatar: session.user.user_metadata?.avatar_url,
            role: ADMIN_EMAILS.includes(email) ? "admin" : "sales_rep",
          });
          return;
        }

        // No session or timed out — redirect to login
        if (!redirectingRef.current) {
          redirectingRef.current = true;
          router.push("/login");
        }
      } catch {
        if (mounted && !redirectingRef.current) {
          redirectingRef.current = true;
          router.push("/login");
        }
      }
    };

    checkAuth();

    // Listen for auth changes (sign-in from another tab, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user: { user_metadata?: Record<string, string>; email?: string } } | null) => {
        if (!mounted) return;
        if (session?.user) {
          const email = session.user.email || "";
          setUser({
            name: session.user.user_metadata?.full_name || email.split("@")[0] || "User",
            email,
            avatar: session.user.user_metadata?.avatar_url,
            role: ADMIN_EMAILS.includes(email) ? "admin" : "sales_rep",
          });
        } else if (!redirectingRef.current) {
          redirectingRef.current = true;
          router.push("/login");
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth, router]);

  // Always render dashboard immediately — no loading screen, no timeout screen
  return (
    <DashboardErrorBoundary>
      <DashboardLayout user={user} isAdmin={user.role === "admin"}>{children}</DashboardLayout>
    </DashboardErrorBoundary>
  );
}
