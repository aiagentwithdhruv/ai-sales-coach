/**
 * Weekly Email Digest
 *
 * POST /api/notifications/weekly-digest
 *
 * Compiles a weekly summary of sales activity and sends
 * a beautifully formatted HTML email via Resend.
 *
 * Triggered by Vercel Cron every Monday at 9am,
 * or manually from dashboard.
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const json = { "Content-Type": "application/json" };

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

interface WeeklyStats {
  newLeads: number;
  callsMade: number;
  followupsSent: number;
  meetingsBooked: number;
  dealsWon: number;
  pipelineValue: number;
  topLeads: Array<{ name: string; company: string; score: number }>;
  weekOverWeek: {
    leads: number; // percentage change
    calls: number;
    followups: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Auth: CRON_SECRET or Bearer token
    const cronSecret = req.headers.get("x-cron-secret");
    const authHeader = req.headers.get("authorization");
    let targetUserId: string | null = null;

    if (cronSecret === process.env.CRON_SECRET) {
      targetUserId = null;
    } else if (authHeader?.startsWith("Bearer ")) {
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
    const results: Array<{ userId: string; sent: boolean; error?: string }> = [];

    // Get users
    let usersToNotify: Array<{
      id: string;
      email: string;
      user_metadata: Record<string, unknown>;
    }> = [];

    if (targetUserId) {
      const { data: { user } } = await supabase.auth.admin.getUserById(targetUserId);
      if (user?.email) {
        usersToNotify = [{
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata || {},
        }];
      }
    } else {
      const { data: subs } = await supabase
        .from("user_subscriptions")
        .select("user_id")
        .eq("status", "active");

      if (subs) {
        for (const sub of subs) {
          const { data: { user } } = await supabase.auth.admin.getUserById(sub.user_id);
          if (user?.email) {
            usersToNotify.push({
              id: user.id,
              email: user.email,
              user_metadata: user.user_metadata || {},
            });
          }
        }
      }
    }

    for (const user of usersToNotify) {
      const stats = await generateWeeklyStats(user.id);
      const firstName =
        (user.user_metadata.full_name as string)?.split(" ")[0] ||
        user.email.split("@")[0];
      const html = buildDigestEmail(firstName, stats);

      try {
        const sent = await sendViaResend(user.email, html);
        results.push({ userId: user.id, sent });
      } catch (error) {
        results.push({
          userId: user.id,
          sent: false,
          error: error instanceof Error ? error.message : "Send failed",
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: json }
    );
  } catch (error) {
    console.error("[Weekly Digest] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send weekly digests",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: json }
    );
  }
}

async function generateWeeklyStats(userId: string): Promise<WeeklyStats> {
  const supabase = getAdmin();

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartISO = weekStart.toISOString();

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekISO = prevWeekStart.toISOString();

  // This week's stats
  const [contacts, calls, followups, prevContacts, prevCalls, prevFollowups] =
    await Promise.all([
      supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", weekStartISO),
      supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", weekStartISO),
      supabase
        .from("message_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("event_type", "sent")
        .gte("created_at", weekStartISO),
      // Previous week for comparison
      supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", prevWeekISO)
        .lt("created_at", weekStartISO),
      supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", prevWeekISO)
        .lt("created_at", weekStartISO),
      supabase
        .from("message_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("event_type", "sent")
        .gte("created_at", prevWeekISO)
        .lt("created_at", weekStartISO),
    ]);

  const thisLeads = contacts.count || 0;
  const thisCalls = calls.count || 0;
  const thisFollowups = followups.count || 0;
  const prevLeadsCount = prevContacts.count || 0;
  const prevCallsCount = prevCalls.count || 0;
  const prevFollowupsCount = prevFollowups.count || 0;

  const pctChange = (curr: number, prev: number) =>
    prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

  // Top leads this week
  const { data: topLeadData } = await supabase
    .from("contacts")
    .select("first_name, last_name, company, lead_score")
    .eq("user_id", userId)
    .gte("created_at", weekStartISO)
    .order("lead_score", { ascending: false })
    .limit(5);

  return {
    newLeads: thisLeads,
    callsMade: thisCalls,
    followupsSent: thisFollowups,
    meetingsBooked: 0,
    dealsWon: 0,
    pipelineValue: 0,
    topLeads: (topLeadData || []).map((l) => ({
      name: `${l.first_name || ""} ${l.last_name || ""}`.trim() || "Unknown",
      company: l.company || "Unknown",
      score: l.lead_score || 0,
    })),
    weekOverWeek: {
      leads: pctChange(thisLeads, prevLeadsCount),
      calls: pctChange(thisCalls, prevCallsCount),
      followups: pctChange(thisFollowups, prevFollowupsCount),
    },
  };
}

async function sendViaResend(to: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const fromEmail = process.env.RESEND_FROM_EMAIL || "team@quotahit.com";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `QuotaHit <${fromEmail}>`,
      to: [to],
      subject: `Your Weekly Sales Report — QuotaHit`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }

  return true;
}

function buildDigestEmail(firstName: string, stats: WeeklyStats): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://quotahit.com";

  const changeIndicator = (pct: number) => {
    if (pct > 0) return `<span style="color: #00FF88;">+${pct}%</span>`;
    if (pct < 0) return `<span style="color: #FF4444;">${pct}%</span>`;
    return `<span style="color: #888;">—</span>`;
  };

  const topLeadsHtml = stats.topLeads.length > 0
    ? stats.topLeads
        .map(
          (l) =>
            `<tr><td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#e0e0e0;">${l.name}</td><td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#888;">${l.company}</td><td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;text-align:right;"><span style="background:#00b3ff20;color:#00b3ff;padding:2px 8px;border-radius:12px;font-size:13px;">${l.score}</span></td></tr>`
        )
        .join("")
    : `<tr><td colspan="3" style="padding:16px;text-align:center;color:#666;">No leads this week. Your AI Lead Finder is ready — <a href="${appUrl}/dashboard/crm" style="color:#00b3ff;">discover leads now</a>.</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">

<!-- Header -->
<div style="text-align:center;padding:32px 0 24px;">
  <div style="display:inline-block;background:linear-gradient(135deg,#00b3ff,#0066ff);width:48px;height:48px;border-radius:12px;line-height:48px;font-size:24px;">✨</div>
  <h1 style="color:#ffffff;font-size:24px;margin:16px 0 4px;">Weekly Sales Report</h1>
  <p style="color:#888;font-size:14px;margin:0;">Hey ${firstName}, here's what your AI sales team accomplished this week.</p>
</div>

<!-- Stats Grid -->
<div style="background:#111;border:1px solid #222;border-radius:16px;padding:24px;margin-bottom:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <td style="padding:12px;text-align:center;width:33%;">
        <div style="font-size:32px;font-weight:700;color:#00b3ff;">${stats.newLeads}</div>
        <div style="font-size:12px;color:#888;margin-top:4px;">New Leads ${changeIndicator(stats.weekOverWeek.leads)}</div>
      </td>
      <td style="padding:12px;text-align:center;width:33%;border-left:1px solid #222;border-right:1px solid #222;">
        <div style="font-size:32px;font-weight:700;color:#00ff88;">${stats.callsMade}</div>
        <div style="font-size:12px;color:#888;margin-top:4px;">AI Calls ${changeIndicator(stats.weekOverWeek.calls)}</div>
      </td>
      <td style="padding:12px;text-align:center;width:33%;">
        <div style="font-size:32px;font-weight:700;color:#ffb300;">${stats.followupsSent}</div>
        <div style="font-size:12px;color:#888;margin-top:4px;">Follow-ups ${changeIndicator(stats.weekOverWeek.followups)}</div>
      </td>
    </tr>
  </table>
</div>

<!-- Top Leads -->
<div style="background:#111;border:1px solid #222;border-radius:16px;padding:24px;margin-bottom:24px;">
  <h2 style="color:#fff;font-size:16px;margin:0 0 16px;">Top Leads This Week</h2>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <thead>
      <tr>
        <th style="padding:8px 12px;text-align:left;font-size:12px;color:#666;border-bottom:1px solid #2a2a2a;">Name</th>
        <th style="padding:8px 12px;text-align:left;font-size:12px;color:#666;border-bottom:1px solid #2a2a2a;">Company</th>
        <th style="padding:8px 12px;text-align:right;font-size:12px;color:#666;border-bottom:1px solid #2a2a2a;">Score</th>
      </tr>
    </thead>
    <tbody>${topLeadsHtml}</tbody>
  </table>
</div>

<!-- CTA -->
<div style="text-align:center;padding:24px 0;">
  <a href="${appUrl}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#00b3ff,#0066ff);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:14px;">Open Dashboard →</a>
</div>

<!-- Footer -->
<div style="text-align:center;padding:24px 0;border-top:1px solid #1a1a1a;">
  <p style="color:#555;font-size:12px;margin:0;">
    QuotaHit — Your Autonomous AI Sales Department<br>
    <a href="${appUrl}/settings" style="color:#555;">Manage notification preferences</a>
  </p>
</div>

</div>
</body>
</html>`;
}
