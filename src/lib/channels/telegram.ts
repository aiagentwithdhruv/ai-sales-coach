/**
 * Telegram Channel Integration
 *
 * Send/receive messages via Telegram Bot API.
 * Used for:
 *   - Hot lead alerts to sales team
 *   - Daily pipeline summaries
 *   - Real-time notifications
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ─────────────────────────────────────────────────────────────────

interface TelegramSendResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string; username?: string };
    chat: { id: number; type: string };
    text?: string;
    date: number;
  };
}

// ─── Config ────────────────────────────────────────────────────────────────

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ─── Core Functions ────────────────────────────────────────────────────────

/**
 * Send a text message via Telegram Bot API.
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: { parseMode?: "HTML" | "Markdown" | "MarkdownV2"; disablePreview?: boolean }
): Promise<TelegramSendResult> {
  if (!BOT_TOKEN) {
    return { success: false, error: "TELEGRAM_BOT_TOKEN not configured" };
  }

  try {
    const res = await fetch(`${API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parseMode || "HTML",
        disable_web_page_preview: options?.disablePreview ?? true,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      return { success: false, error: data.description || "Telegram API error" };
    }

    return { success: true, messageId: data.result.message_id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a hot lead alert to the user's Telegram.
 */
export async function sendHotLeadAlert(
  userId: string,
  lead: {
    name: string;
    company: string;
    score: number;
    reason: string;
    email?: string;
    phone?: string;
  }
): Promise<TelegramSendResult> {
  const chatId = await getUserTelegramChatId(userId);
  if (!chatId) {
    return { success: false, error: "User has no Telegram chat ID linked" };
  }

  const scoreEmoji = lead.score >= 80 ? "🔥" : lead.score >= 60 ? "⭐" : "📌";

  const message = `${scoreEmoji} <b>Hot Lead Alert</b>

<b>${lead.name}</b> at ${lead.company}
Score: <b>${lead.score}/100</b>

${lead.reason}

${lead.email ? `📧 ${lead.email}` : ""}
${lead.phone ? `📞 ${lead.phone}` : ""}

<a href="${process.env.NEXT_PUBLIC_APP_URL || "https://quotahit.com"}/dashboard/crm">View in CRM →</a>`;

  const result = await sendTelegramMessage(chatId, message.trim());

  // Log activity
  if (result.success) {
    await logTelegramActivity(userId, "hot_lead_alert", {
      leadName: lead.name,
      score: lead.score,
    });
  }

  return result;
}

/**
 * Send a daily pipeline summary to the user's Telegram.
 */
export async function sendDailySummary(
  userId: string,
  summary: {
    newLeads: number;
    callsMade: number;
    followupsSent: number;
    meetingsBooked: number;
    dealsWon: number;
    pipelineValue: number;
    topLead?: { name: string; company: string; score: number };
  }
): Promise<TelegramSendResult> {
  const chatId = await getUserTelegramChatId(userId);
  if (!chatId) {
    return { success: false, error: "User has no Telegram chat ID linked" };
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  let message = `📊 <b>Daily Sales Summary — ${today}</b>

🔍 New leads found: <b>${summary.newLeads}</b>
📞 AI calls made: <b>${summary.callsMade}</b>
✉️ Follow-ups sent: <b>${summary.followupsSent}</b>
📅 Meetings booked: <b>${summary.meetingsBooked}</b>
🤝 Deals won: <b>${summary.dealsWon}</b>
💰 Pipeline value: <b>$${summary.pipelineValue.toLocaleString()}</b>`;

  if (summary.topLead) {
    message += `\n\n🏆 <b>Top Lead:</b> ${summary.topLead.name} at ${summary.topLead.company} (Score: ${summary.topLead.score})`;
  }

  message += `\n\n<a href="${process.env.NEXT_PUBLIC_APP_URL || "https://quotahit.com"}/dashboard">Open Dashboard →</a>`;

  return sendTelegramMessage(chatId, message);
}

// ─── User Linking ──────────────────────────────────────────────────────────

/**
 * Get the Telegram chat ID for a user from their metadata.
 */
async function getUserTelegramChatId(userId: string): Promise<string | null> {
  const supabase = getAdmin();
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  return user?.user_metadata?.telegram_chat_id || null;
}

/**
 * Link a Telegram chat ID to a user account.
 * Called when a user sends /start to the bot with their linking code.
 */
export async function linkTelegramAccount(
  userId: string,
  chatId: number,
  username?: string
): Promise<boolean> {
  const supabase = getAdmin();

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      telegram_chat_id: String(chatId),
      telegram_username: username || null,
    },
  });

  if (error) {
    console.error("[Telegram] Link error:", error);
    return false;
  }

  return true;
}

/**
 * Handle incoming Telegram webhook update.
 */
export async function handleTelegramUpdate(
  update: TelegramUpdate
): Promise<{ handled: boolean; response?: string }> {
  const message = update.message;
  if (!message?.text) {
    return { handled: false };
  }

  const chatId = message.chat.id;
  const text = message.text.trim();

  // Handle /start command with linking code
  if (text.startsWith("/start")) {
    const parts = text.split(" ");
    const linkingCode = parts[1];

    if (linkingCode) {
      // Look up the linking code
      const supabase = getAdmin();
      const { data } = await supabase
        .from("telegram_linking_codes")
        .select("user_id")
        .eq("code", linkingCode)
        .eq("used", false)
        .single();

      if (data) {
        const linked = await linkTelegramAccount(
          data.user_id,
          chatId,
          message.from.username
        );

        if (linked) {
          // Mark code as used
          await supabase
            .from("telegram_linking_codes")
            .update({ used: true })
            .eq("code", linkingCode);

          await sendTelegramMessage(
            chatId,
            "✅ <b>Account linked!</b>\n\nYou'll now receive:\n• Hot lead alerts\n• Daily pipeline summaries\n• Campaign notifications\n\nType /help for commands."
          );
          return { handled: true, response: "linked" };
        }
      }

      await sendTelegramMessage(
        chatId,
        "❌ Invalid or expired linking code. Please generate a new one from QuotaHit settings."
      );
      return { handled: true, response: "invalid_code" };
    }

    await sendTelegramMessage(
      chatId,
      "👋 <b>Welcome to QuotaHit!</b>\n\nTo link your account, go to QuotaHit Settings → Integrations → Telegram and click 'Connect'."
    );
    return { handled: true, response: "welcome" };
  }

  // Handle /help command
  if (text === "/help") {
    await sendTelegramMessage(
      chatId,
      `<b>QuotaHit Bot Commands</b>

/start — Link your account
/summary — Get today's sales summary
/pipeline — View pipeline status
/help — Show this help

You'll automatically receive:
• 🔥 Hot lead alerts (score 70+)
• 📊 Daily summaries (8am your time)
• 🎯 Campaign results`
    );
    return { handled: true, response: "help" };
  }

  // Handle /summary command
  if (text === "/summary") {
    // Find the user linked to this chat
    const supabase = getAdmin();
    const { data: users } = await supabase.auth.admin.listUsers();
    const linkedUser = users?.users?.find(
      (u) => u.user_metadata?.telegram_chat_id === String(chatId)
    );

    if (!linkedUser) {
      await sendTelegramMessage(
        chatId,
        "⚠️ No account linked. Use /start with your linking code."
      );
      return { handled: true, response: "not_linked" };
    }

    // Generate and send summary
    const summaryData = await generateUserSummary(linkedUser.id);
    await sendDailySummary(linkedUser.id, summaryData);
    return { handled: true, response: "summary_sent" };
  }

  return { handled: false };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

async function generateUserSummary(userId: string) {
  const supabase = getAdmin();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Get today's stats
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

  return {
    newLeads: contacts.count || 0,
    callsMade: calls.count || 0,
    followupsSent: followups.count || 0,
    meetingsBooked: 0,
    dealsWon: 0,
    pipelineValue: 0,
  };
}

async function logTelegramActivity(
  userId: string,
  type: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const supabase = getAdmin();
  await supabase.from("activity_log").insert({
    user_id: userId,
    activity_type: `telegram_${type}`,
    metadata,
    created_at: new Date().toISOString(),
  });
}

/**
 * Generate a one-time linking code for Telegram account connection.
 */
export async function generateLinkingCode(userId: string): Promise<string> {
  const supabase = getAdmin();
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();

  await supabase.from("telegram_linking_codes").insert({
    user_id: userId,
    code,
    used: false,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min
  });

  return code;
}
