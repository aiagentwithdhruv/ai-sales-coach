"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

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
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser({
          name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
          email: authUser.email || "",
          avatar: authUser.user_metadata?.avatar_url,
          role: "sales_rep",
        });
        setAuthChecked(true);
      } else {
        // No authenticated user — redirect to login
        router.push("/login");
      }
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: { user: { user_metadata?: Record<string, string>; email?: string } } | null) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          avatar: session.user.user_metadata?.avatar_url,
          role: "sales_rep",
        });
      } else {
        // User signed out — redirect to login
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, router]);

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

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
