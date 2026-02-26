"use client";

import { useState, useEffect } from "react";
import {
  WelcomeSection,
  QuickActions,
  SetupChecklist,
  DashboardChat,
} from "@/components/features/dashboard";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getSessions } from "@/lib/session-history";
import {
  MessageSquare,
  Phone,
  Mic,
  Sparkles,
  History,
  Calendar,
  ExternalLink,
  ArrowRight,
  Swords,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SetupWizard } from "@/components/features/onboarding/SetupWizard";

export default function DashboardPage() {
  const [userName, setUserName] = useState("there");
  const [contactCount, setContactCount] = useState(0);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [wizardChecked, setWizardChecked] = useState(false);
  const [recentSessions, setRecentSessions] = useState<
    { id: string; type: string; title: string; timestamp: number }[]
  >([]);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const fullName =
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "there";
        const firstName = fullName.split(" ")[0];
        setUserName(firstName);

        // Check if setup wizard should show
        const localSetup = localStorage.getItem("setup_complete");
        const metaSetup = user.user_metadata?.setup_complete;
        if (!localSetup && !metaSetup) {
          setShowSetupWizard(true);
        }
      }
      setWizardChecked(true);
    };
    getUser();
  }, [supabase.auth]);

  // Fetch real contact count from CRM
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const { count } = await supabase
          .from("contacts")
          .select("*", { count: "exact", head: true });
        setContactCount(count || 0);
      } catch {
        // Table may not exist yet for new users
      }
    };
    fetchContacts();
  }, [supabase]);

  useEffect(() => {
    const sessions = getSessions().slice(0, 5);
    setRecentSessions(
      sessions.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        timestamp: s.timestamp,
      }))
    );
  }, []);

  const TYPE_ICONS: Record<
    string,
    { icon: typeof MessageSquare; color: string; bg: string }
  > = {
    coach: {
      icon: MessageSquare,
      color: "text-neonblue",
      bg: "bg-neonblue/10",
    },
    practice: {
      icon: Mic,
      color: "text-automationgreen",
      bg: "bg-automationgreen/10",
    },
    call: {
      icon: Phone,
      color: "text-warningamber",
      bg: "bg-warningamber/10",
    },
    tool: {
      icon: Swords,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Show setup wizard for new users
  if (wizardChecked && showSetupWizard) {
    return <SetupWizard onComplete={() => setShowSetupWizard(false)} />;
  }

  return (
    <div className="space-y-6">
      <WelcomeSection
        userName={userName}
        stats={{
          totalContacts: contactCount,
          aiCallsMade: 0,
          followupsSent: 0,
        }}
      />

      {/* Progressive Setup Checklist — hides when 100% */}
      <SetupChecklist />

      {/* AI Command Bar with inline chat */}
      <section>
        <DashboardChat />
      </section>

      {/* Your AI Sales Team */}
      <section>
        <h2 className="text-lg font-semibold text-platinum mb-4">
          Your AI Sales Team
        </h2>
        <QuickActions />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Book a Demo CTA */}
          <div
            className="glow-card relative overflow-hidden rounded-xl bg-gradient-to-r from-graphite via-onyx to-graphite border border-neonblue/30 p-6"
            style={
              {
                "--glow-color": "rgba(0, 179, 255, 0.3)",
              } as React.CSSProperties
            }
          >
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-neonblue/10 border border-neonblue/20">
                  <Calendar className="h-8 w-8 text-neonblue" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-platinum">
                    Need Help Setting Up?
                  </h3>
                  <p className="text-sm text-silver mt-1">
                    Book a free consultation — we&apos;ll configure your AI
                    sales department together.
                  </p>
                </div>
              </div>
              <a
                href="https://calendly.com/aiwithdhruv/makeaiworkforyou"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-premium px-6 py-3 rounded-xl font-semibold cursor-pointer shrink-0"
              >
                <span className="btn-premium-text relative z-10 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Book Free Demo
                  <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            </div>
          </div>

          {/* Recent AI Activity */}
          <div className="card-metallic rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-platinum flex items-center justify-between">
                Recent AI Activity
                {recentSessions.length > 0 && (
                  <Link
                    href="/dashboard/history"
                    className="text-xs text-neonblue hover:underline font-normal"
                  >
                    View All
                  </Link>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <div className="space-y-4">
                  {recentSessions.map((session) => {
                    const config = TYPE_ICONS[session.type] || TYPE_ICONS.tool;
                    const Icon = config.icon;
                    return (
                      <div key={session.id} className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg", config.bg)}>
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-platinum truncate">
                            {session.title}
                          </p>
                          <p className="text-xs text-mist">
                            {formatTime(session.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <History className="h-8 w-8 text-mist mx-auto mb-2" />
                  <p className="text-sm text-silver">No activity yet</p>
                  <p className="text-xs text-mist">
                    Your AI team&apos;s first actions will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Getting Started Cards */}
          <div className="card-metallic rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-platinum">
                Quick Launch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/crm" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-graphite hover:bg-gunmetal transition-colors group">
                  <span className="flex items-center justify-center h-7 w-7 rounded-full bg-neonblue/20 text-neonblue text-xs font-bold">
                    1
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-platinum group-hover:text-neonblue transition-colors">
                      Import or Find Leads
                    </p>
                    <p className="text-xs text-mist">
                      CSV upload or Scout AI discovery
                    </p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-mist group-hover:text-neonblue transition-colors" />
                </div>
              </Link>
              <Link href="/dashboard/ai-calling" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-graphite hover:bg-gunmetal transition-colors group">
                  <span className="flex items-center justify-center h-7 w-7 rounded-full bg-automationgreen/20 text-automationgreen text-xs font-bold">
                    2
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-platinum group-hover:text-automationgreen transition-colors">
                      Launch AI Calling
                    </p>
                    <p className="text-xs text-mist">
                      Your AI books meetings 24/7
                    </p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-mist group-hover:text-automationgreen transition-colors" />
                </div>
              </Link>
              <Link href="/dashboard/follow-ups" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-graphite hover:bg-gunmetal transition-colors group">
                  <span className="flex items-center justify-center h-7 w-7 rounded-full bg-warningamber/20 text-warningamber text-xs font-bold">
                    3
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-platinum group-hover:text-warningamber transition-colors">
                      Set Up Follow-ups
                    </p>
                    <p className="text-xs text-mist">
                      Automated email sequences
                    </p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-mist group-hover:text-warningamber transition-colors" />
                </div>
              </Link>
            </CardContent>
          </div>

          {/* AI Assistant Quick Access */}
          <div className="card-metallic rounded-xl border-l-2 border-l-neonblue">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-5 w-5 text-neonblue" />
                <h4 className="font-semibold text-platinum text-sm">
                  AI Assistant
                </h4>
              </div>
              <p className="text-xs text-silver mb-4">
                Ask anything about sales strategy, research companies, or draft
                outreach messages.
              </p>
              <Link href="/dashboard/coach">
                <Button className="w-full bg-neonblue hover:bg-electricblue text-sm gap-2">
                  <Sparkles className="h-4 w-4" />
                  Open Full Assistant
                </Button>
              </Link>
            </CardContent>
          </div>

          {/* Consultation CTA */}
          <div className="card-metallic rounded-xl border-l-2 border-l-automationgreen">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-5 w-5 text-automationgreen" />
                <h4 className="font-semibold text-platinum text-sm">
                  Get a Free Consultation
                </h4>
              </div>
              <p className="text-xs text-silver mb-4">
                See how AI can transform your sales process. 15-min call, zero
                commitment.
              </p>
              <a
                href="https://calendly.com/aiwithdhruv/makeaiworkforyou"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full bg-automationgreen/90 hover:bg-automationgreen text-black text-sm gap-2">
                  <Calendar className="h-4 w-4" />
                  Book Demo
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            </CardContent>
          </div>
        </div>
      </div>
    </div>
  );
}
