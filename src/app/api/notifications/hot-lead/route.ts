/**
 * Hot Lead Alert
 *
 * POST /api/notifications/hot-lead
 *
 * Sends an alert when a lead scores above threshold.
 * Dispatches via Telegram and/or WhatsApp based on user prefs.
 *
 * Called by:
 *   - Inngest scoring function when score >= 70
 *   - Manual trigger from CRM
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendHotLeadAlert } from "@/lib/channels/telegram";

export const runtime = "nodejs";

const json = { "Content-Type": "application/json" };

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const internalSecret = req.headers.get("x-internal-secret");

    let userId: string;

    // Auth: internal service call or user token
    if (internalSecret === process.env.CRON_SECRET) {
      const body = await req.json();
      userId = body.userId;
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId required" }), {
          status: 400,
          headers: json,
        });
      }

      return await processHotLeadAlert(userId, body);
    }

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: json,
      });
    }

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

    const body = await req.json();
    return await processHotLeadAlert(user.id, body);
  } catch (error) {
    console.error("[Hot Lead Alert] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send alert",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: json }
    );
  }
}

async function processHotLeadAlert(
  userId: string,
  body: {
    contactId?: string;
    name?: string;
    company?: string;
    score?: number;
    reason?: string;
    email?: string;
    phone?: string;
  }
) {
  const supabase = getAdmin();
  let leadData = {
    name: body.name || "Unknown",
    company: body.company || "Unknown",
    score: body.score || 0,
    reason: body.reason || "High ICP match",
    email: body.email,
    phone: body.phone,
  };

  // If contactId provided, fetch from DB
  if (body.contactId) {
    const { data: contact } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", body.contactId)
      .single();

    if (contact) {
      leadData = {
        name: `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || "Unknown",
        company: contact.company || "Unknown",
        score: contact.lead_score || body.score || 0,
        reason: body.reason || "High ICP match score",
        email: contact.email,
        phone: contact.phone,
      };
    }
  }

  const results: Record<string, { success: boolean; error?: string }> = {};

  // Get user preferences
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  const meta = user?.user_metadata || {};

  // Send via Telegram
  if (meta.telegram_chat_id) {
    const telegramResult = await sendHotLeadAlert(userId, leadData);
    results.telegram = {
      success: telegramResult.success,
      error: telegramResult.error,
    };
  }

  // Send via WhatsApp
  if (meta.whatsapp_number) {
    try {
      const { sendWhatsApp } = await import("@/lib/channels/whatsapp");
      const scoreEmoji = leadData.score >= 80 ? "🔥" : leadData.score >= 60 ? "⭐" : "📌";

      const message = `${scoreEmoji} *Hot Lead Alert*\n\n*${leadData.name}* at ${leadData.company}\nScore: *${leadData.score}/100*\n\n${leadData.reason}\n\n→ View in CRM: ${process.env.NEXT_PUBLIC_APP_URL || "https://quotahit.com"}/dashboard/crm`;

      const whatsappResult = await sendWhatsApp(
        { id: userId, first_name: "Team", phone: meta.whatsapp_number as string },
        userId,
        message
      );
      results.whatsapp = {
        success: whatsappResult.success,
        error: whatsappResult.error,
      };
    } catch (error) {
      results.whatsapp = {
        success: false,
        error: error instanceof Error ? error.message : "WhatsApp failed",
      };
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      lead: leadData,
      notifications: results,
    }),
    { headers: json }
  );
}
