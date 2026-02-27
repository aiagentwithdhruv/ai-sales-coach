"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Bell, Sparkles, ChevronDown, LogOut, Settings, User, Keyboard, Menu, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { User as SupabaseUser, Session, AuthChangeEvent } from "@supabase/supabase-js";

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: "sales_rep" | "manager" | "admin";
  };
  onMobileMenuToggle?: () => void;
  sidebarExpanded?: boolean;
  onSidebarToggle?: () => void;
}

// Admin emails — keep in sync with api/admin/impersonate/route.ts
const ADMIN_EMAILS = [
  "aiwithdhruv@gmail.com",
  "dhruv@aiwithdruv.com",
  "admin@aiwithdruv.com",
  "dhruvtomar7008@gmail.com",
];

export function Header({ user, onMobileMenuToggle, sidebarExpanded = true, onSidebarToggle }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [profileName, setProfileName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("profile_name") || "";
    }
    return "";
  });
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>();
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [planValidUntil, setPlanValidUntil] = useState<string | null>(null);
  const router = useRouter();
  const supabase = getSupabaseClient();

  // Get user from Supabase — session first (instant), then getUser for fresh data
  useEffect(() => {
    const loadUser = async () => {
      // 1. Session (instant, from cookie — no network call)
      const { data: { session } } = await supabase.auth.getSession();
      const sessionUser = session?.user;
      if (sessionUser) {
        setSupabaseUser(sessionUser);
        setProfileName(sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User");
        setProfileEmail(sessionUser.email || "");
        setProfileAvatar(sessionUser.user_metadata?.avatar_url);
      }

      // 2. getUser (network call — may be slow, updates with fresh data)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setSupabaseUser(user);
          setProfileName(user.user_metadata?.full_name || user.email?.split("@")[0] || "User");
          setProfileEmail(user.email || "");
          setProfileAvatar(user.user_metadata?.avatar_url);

          // Fetch plan validity
          try {
            const { data: subscription } = await supabase
              .from("user_subscriptions")
              .select("current_period_end")
              .eq("user_id", user.id)
              .maybeSingle();

            if (subscription?.current_period_end) {
              setPlanValidUntil(subscription.current_period_end);
            }
          } catch {
            // Plan not found or error, no worries
          }
        }
      } catch {
        // Network call failed — session data is already loaded above
      }
    };

    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const user = session?.user;
      setSupabaseUser(user || null);
      if (user) {
        setProfileName(user.user_metadata?.full_name || user.email?.split("@")[0] || "User");
        setProfileEmail(user.email || "");
        setProfileAvatar(user.user_metadata?.avatar_url);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);


  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isAdmin = ADMIN_EMAILS.includes(profileEmail);

  const defaultUser = {
    name: profileName,
    email: profileEmail,
    avatar: profileAvatar,
    role: isAdmin ? "admin" as const : "sales_rep" as const,
  };

  const currentUser = user?.role === "admin" ? user : (isAdmin ? { ...defaultUser, role: "admin" as const } : (user || defaultUser));

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>;
      case "manager":
        return <Badge className="bg-warningamber/20 text-warningamber">Manager</Badge>;
      default:
        return <Badge variant="secondary">Member</Badge>;
    }
  };

  return (
    <header className={`fixed top-0 left-0 ${sidebarExpanded ? "md:left-[220px]" : "md:left-[72px]"} right-0 z-30 h-16 bg-graphite/90 backdrop-blur-md border-b border-gunmetal/60 transition-[left] duration-200`}>
      <div className="flex h-full items-center justify-between px-3 md:px-6">
        {/* Mobile hamburger + Search Bar */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          {/* Mobile hamburger */}
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-silver hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative hidden sm:block flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
            <Input
              type="text"
              placeholder="Search leads, calls, deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue focus:ring-neonblue/20"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* AI Coach Button */}
          <Link href="/dashboard/coach">
            <Button className="bg-neonblue hover:bg-electricblue text-white gap-2 glow-blue">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </Button>
          </Link>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-silver hover:text-platinum hover:bg-white/5"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-errorred rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 bg-graphite border-gunmetal"
            >
              <DropdownMenuLabel className="text-platinum">
                Notifications
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gunmetal" />
              <DropdownMenuItem className="text-silver hover:text-platinum hover:bg-onyx focus:bg-onyx focus:text-platinum">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">New call analysis ready</span>
                  <span className="text-xs text-mist">
                    Your call with Acme Corp has been analyzed
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-silver hover:text-platinum hover:bg-onyx focus:bg-onyx focus:text-platinum">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">New lead qualified — Score: 87</span>
                  <span className="text-xs text-mist">AI found a high-potential prospect</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-silver hover:text-platinum hover:bg-onyx focus:bg-onyx focus:text-platinum">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Deal update: TechStart</span>
                  <span className="text-xs text-mist">
                    Moved to negotiation stage
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-silver hover:text-platinum hover:bg-white/5"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback className="bg-neonblue text-white text-sm">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm font-medium text-platinum">
                  {currentUser.name}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-graphite border-gunmetal"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-platinum">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-mist">{currentUser.email}</p>
                  <div className="pt-1 flex items-center gap-2">
                    {getRoleBadge(currentUser.role)}
                  </div>
                  {planValidUntil && (
                    <p className="text-xs text-automationgreen pt-1">
                      Plan valid till {new Date(planValidUntil).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gunmetal" />
              <Link href="/settings">
                <DropdownMenuItem className="text-silver hover:text-platinum hover:bg-onyx focus:bg-onyx focus:text-platinum cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/analytics">
                <DropdownMenuItem className="text-silver hover:text-platinum hover:bg-onyx focus:bg-onyx focus:text-platinum cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  My Performance
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem className="text-silver hover:text-platinum hover:bg-onyx focus:bg-onyx focus:text-platinum cursor-pointer">
                <Keyboard className="h-4 w-4 mr-2" />
                Keyboard Shortcuts
              </DropdownMenuItem>
              {currentUser.role === "admin" && (
                <>
                  <DropdownMenuSeparator className="bg-gunmetal" />
                  <Link href="/admin">
                    <DropdownMenuItem className="text-warningamber hover:text-warningamber hover:bg-warningamber/10 focus:bg-warningamber/10 focus:text-warningamber cursor-pointer">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  </Link>
                </>
              )}
              <DropdownMenuSeparator className="bg-gunmetal" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-errorred hover:text-errorred hover:bg-errorred/10 focus:bg-errorred/10 focus:text-errorred cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
