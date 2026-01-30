"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { getSupabaseClient } from "@/lib/supabase/client";

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

  const supabase = getSupabaseClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser({
          name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
          email: authUser.email || "",
          avatar: authUser.user_metadata?.avatar_url,
          role: "sales_rep", // Default role, can be fetched from DB if needed
        });
      }
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          avatar: session.user.user_metadata?.avatar_url,
          role: "sales_rep",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
