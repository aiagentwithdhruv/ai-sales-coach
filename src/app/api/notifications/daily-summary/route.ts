/**
 * Daily Sales Summary — Cron Trigger
 *
 * POST /api/notifications/daily-summary
 *
 * Generates and sends daily pipeline summaries via:
 *   - WhatsApp (Gallabox) — if user has WhatsApp linked
 *   - Telegram — if user has Telegram linked
 *
 * Intended to be triggered by:
 *   - Vercel Cron (vercel.json) at 8am user time
 *   - Manual trigger from dashboard
 *   - Inngest scheduled function
 *
 * Auth: Requires CRON_SECRET header or valid user Bearer token.
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendDailySummary as sendTelegramSummary } from "@/lib/channels/telegram";

export const runtime = "nodejs";
export const maxDuration = 60;

const json = { "Content-Type": "application/json" };

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

interface UserSummaryData {
  newLeads: number;
  callsMade: number;
  followupsSent: number;
  meetingsBooked: number;
  dealsWon: number;
  pipelineValue: number;
  topLead?: { name: string; company: string; score: number };
}

export async function POST(req: NextRequest) {
  try {
    // Auth: either CRON_SECRET or Bearer token
    const cronSecret = req.headers.get("x-cron-secret");
    const authHeader = req.headers.get("authorization");
    let targetUserId: string | null = null;

    if (cronSecret === process.env.CRON_SECRET) {
      // Cron job — process all users with notifications enabled
      targetUserId = null; // means "all users"
    } else if (authHeader?.startsWith("Bearer ")) {
      // Manual trigger — process just this user
      const supabase = getAdmin();
      const { data: { user }, error } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      if (error || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: json,
        });
      }
      targetUserId = user.id;
    } else {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: json,
      });
    }

    const supabase = getAdmin();
    const results: Array<{ userId: string; channels: string[]; errors: string[] }> = [];

    // Get users to notify
    let usersToNotify: Array<{ id: string; user_metadata: Record<string, unknown> }> = [];

    if (targetUserId) {
      const { data: { user } } = await supabase.auth.admin.getUserById(targetUserId);
      if (user) {
        usersToNotify = [{ id: user.id, user_metadata: user.user_metadata || {} }];
      }
    } else {
      // Get all users with active subscriptions
      const { data: subs } = await supabase
        .from("user_subscriptions")
        .select("user_id")
        .eq("status", "active");

      if (subs) {
        for (const sub of subs) {
          const { data: { user } } = await supabase.auth.admin.getUserById(sub.user_id);
          if (user) {
            usersToNotify.push({ id: user.id, user_metadata: user.user_metadata || {} });
          }
        }
      }
    }

    for (const user of usersToNotify) {
      const summary = await generateSummary(user.id);
      const channelsUsed: string[] = [];
      const errors: string[] = [];

      // Send via Telegram if linked
      if (user.user_metadata.telegram_chat_id) {
        const telegramResult = await sendTelegramSummary(user.id, summary);
        if (telegramResult.success) {
          channelsUsed.push("telegram");
        } else {
          errors.push(`telegram: ${telegramResult.error}`);
        }
      }

      // Send via WhatsApp if linked
      if (user.user_metadata.whatsapp_number) {
        const whatsappResult = await sendWhatsAppSummary(user.id, user.user_metadata, summary);
        if (whatsappResult.success) {
          channelsUsed.push("whatsapp");
        } else {
          errors.push(`whatsapp: ${whatsappResult.error}`);
        }
      }

      results.push({ userId: user.id, channels: channelsUsed, errors });
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { headers: json }
    );
  } catch (error) {
    console.error("[Daily Summary] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send daily summaries",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: json }
    );
  }
}

async function generateSummary(userId: string): Promise<UserSummaryData> {
  const supabase = getAdmin();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [contacts, calls, followups] = await Promise.all([
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", todayISO),
    supabase
      .from("call_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", todayISO),
    supabase
      .from("message_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_type", "sent")
      .gte("created_at", todayISO),
  ]);

  // Get top lead
  const { data: topLeadData } = await supabase
    .from("contacts")
    .select("first_name, last_name, company, lead_score")
    .eq("user_id", userId)
    .gte("created_at", todayISO)
    .order("lead_score", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    newLeads: contacts.count || 0,
    callsMade: calls.count || 0,
    followupsSent: followups.count || 0,
    meetingsBooked: 0,
    dealsWon: 0,
    pipelineValue: 0,
    topLead: topLeadData
      ? {
          name: `${topLeadData.first_name || ""} ${topLeadData.last_name || ""}`.trim(),
          company: topLeadData.company || "Unknown",
          score: topLeadData.lead_score || 0,
        }
      : undefined,
  };
}

async function sendWhatsAppSummary(
  userId: string,
  userMeta: Record<string, unknown>,
  summary: UserSummaryData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { sendWhatsApp } = await import("@/lib/channels/whatsapp");

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    const message = `📊 *Daily Sales Summary — ${today}*

🔍 New leads: *${summary.newLeads}*
📞 AI calls: *${summary.callsMade}*
✉️ Follow-ups: *${summary.followupsSent}*
📅 Meetings: *${summary.meetingsBooked}*
🤝 Deals won: *${summary.dealsWon}*
💰 Pipeline: *$${summary.pipelineValue.toLocaleString()}*${summary.topLead ? `\n\n🏆 Top Lead: ${summary.topLead.name} at ${summary.topLead.company} (Score: ${summary.topLead.score})` : ""}

→ Open Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || "https://quotahit.com"}/dashboard`;

    const contact = {
      id: userId,
      first_name: (userMeta.full_name as string)?.split(" ")[0] || "there",
      phone: userMeta.whatsapp_number as string,
    };

    const result = await sendWhatsApp(contact, userId, message);
    return { success: result.success, error: result.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "WhatsApp send failed",
    };
  }
}
