"use client";

import { useState, useEffect } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseClient } from "@/lib/supabase/client";
import { CheckCircle2, Circle, Rocket } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  href: string;
  check: () => Promise<boolean>;
}

export function SetupChecklist() {
  const [items, setItems] = useState<{ id: string; done: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const checkAll = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const meta = user.user_metadata || {};

      // Check ICP configured
      const hasICP = !!(meta.product_description || meta.target_customer);

      // Check contacts exist
      const { count: contactCount } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true });

      // Check API keys configured
      const { count: keyCount } = await supabase
        .from("user_api_keys")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Check channels
      const hasChannels = (meta.preferred_channels as string[])?.length > 0;

      setItems([
        { id: "icp", done: hasICP },
        { id: "contacts", done: (contactCount || 0) > 0 },
        { id: "keys", done: (keyCount || 0) > 0 },
        { id: "channels", done: hasChannels },
        { id: "campaign", done: false }, // TODO: check campaigns table
      ]);
      setLoading(false);
    };

    checkAll();
  }, [supabase]);

  const CHECKLIST: ChecklistItem[] = [
    {
      id: "icp",
      label: "Tell your Lead Finder who to target",
      description: "Define your ideal customer profile",
      href: "/settings",
      check: async () => false,
    },
    {
      id: "contacts",
      label: "Give your team their first leads",
      description: "Import contacts or let Scout AI discover them",
      href: "/dashboard/crm",
      check: async () => false,
    },
    {
      id: "keys",
      label: "Power up your AI team",
      description: "Add your OpenAI, Anthropic, or OpenRouter key",
      href: "/settings",
      check: async () => false,
    },
    {
      id: "channels",
      label: "Choose how your team reaches out",
      description: "Email, phone, WhatsApp, or multi-channel",
      href: "/settings",
      check: async () => false,
    },
    {
      id: "campaign",
      label: "Send your AI Caller on its first campaign",
      description: "Watch your AI book meetings while you sleep",
      href: "/dashboard/ai-calling",
      check: async () => false,
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const total = CHECKLIST.length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  if (loading) return null;
  if (percent === 100) return null; // Hide when fully set up

  return (
    <div className="card-metallic rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-platinum flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-neonblue" />
            Your AI Sales Team is {percent}% Ready
          </span>
          <span className="text-sm font-normal text-mist">
            {doneCount}/{total} complete
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="w-full h-2 bg-gunmetal rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neonblue to-automationgreen rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="space-y-2">
          {CHECKLIST.map((item) => {
            const status = items.find((i) => i.id === item.id);
            const isDone = status?.done || false;

            return (
              <Link key={item.id} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                    isDone
                      ? "bg-automationgreen/5"
                      : "bg-onyx hover:bg-graphite cursor-pointer"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-automationgreen shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-gunmetal shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isDone ? "text-silver line-through" : "text-platinum"
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs text-mist">{item.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </div>
  );
}
