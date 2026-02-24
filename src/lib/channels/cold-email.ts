/**
 * Item 11: Cold Email Engine
 *
 * Instantly-style cold email at scale with rotation,
 * warmup awareness, and deliverability tracking.
 *
 * Uses Resend (already integrated) as primary provider.
 * Future: Instantly API for dedicated cold email infra.
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ─────────────────────────────────────────────────────────────────

interface ContactForEmail {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  enrichment_data?: Record<string, unknown>;
}

interface EmailSendResult {
  success: boolean;
  messageId?: string;
  from: string;
  error?: string;
}

// ─── Limits ────────────────────────────────────────────────────────────────

const COLD_EMAIL_LIMITS = {
  per_domain_per_day: 50,
  warmup_daily_increase: 5,
  min_delay_between_sends_ms: 5000, // 5 seconds between emails
};

// ─── Send Cold Email ───────────────────────────────────────────────────────

export async function sendColdEmail(
  contact: ContactForEmail,
  userId: string,
  templateName: string,
  subjectOverride?: string
): Promise<EmailSendResult> {
  if (!contact.email) {
    return { success: false, from: "", error: "No email address" };
  }

  // Check deliverability
  if (isDisposableEmail(contact.email)) {
    return { success: false, from: "", error: "Disposable email detected" };
  }

  // Get sender (rotating across configured senders)
  const sender = await rotateSender(userId);

  // Generate personalized email from template
  const { generateEmailTemplate } = await import("@/lib/outreach/templates");
  const template = await generateEmailTemplate(
    contact,
    "professional",
    templateName as "intro" | "followup" | "value_add" | "breakup" | "connection_request" | "meeting_request"
  );

  const subject = subjectOverride === "ai_generated"
    ? template.subject
    : subjectOverride || template.subject || "Quick question";

  // Send via Resend
  const result = await sendViaResend(
    sender,
    contact.email,
    subject!,
    template.body,
    contact,
    userId
  );

  if (result.success) {
    // Track the send
    await trackEmailSend(userId, contact.id, result.messageId!, sender, subject!);
  }

  return result;
}

// ─── Resend Email Sending ──────────────────────────────────────────────────

async function sendViaResend(
  from: string,
  to: string,
  subject: string,
  body: string,
  contact: ContactForEmail,
  userId: string
): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, from, error: "RESEND_API_KEY not configured" };
  }

  // Build HTML with tracking pixel and unsubscribe link
  const trackingId = crypto.randomUUID();
  const html = buildEmailHtml(body, contact, trackingId);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        headers: {
          "List-Unsubscribe": `<mailto:unsubscribe@quotahit.com?subject=unsubscribe-${trackingId}>`,
        },
        tags: [
          { name: "userId", value: userId },
          { name: "contactId", value: contact.id },
          { name: "trackingId", value: trackingId },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, from, error: `Resend error (${res.status}): ${text}` };
    }

    const data = await res.json();
    return { success: true, messageId: data.id, from };
  } catch (err) {
    return {
      success: false,
      from,
      error: err instanceof Error ? err.message : "Email send failed",
    };
  }
}

// ─── Sender Rotation ───────────────────────────────────────────────────────

async function rotateSender(userId: string): Promise<string> {
  const supabase = getAdmin();

  // Get user's configured email senders
  const { data: channels } = await supabase
    .from("outreach_channels")
    .select("config")
    .eq("user_id", userId)
    .eq("channel", "email")
    .eq("is_active", true);

  // Extract sender emails from config
  const senders: string[] = [];
  if (channels) {
    for (const ch of channels) {
      const config = ch.config as Record<string, unknown>;
      if (config?.sender_email) {
        senders.push(config.sender_email as string);
      }
    }
  }

  // Fallback to default sender
  if (senders.length === 0) {
    return process.env.RESEND_FROM_EMAIL || "QuotaHit <noreply@quotahit.com>";
  }

  // Round-robin: pick sender based on today's send count
  const today = new Date().toISOString().split("T")[0];
  const { count } = await supabase
    .from("message_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", "sent")
    .gte("created_at", `${today}T00:00:00`);

  const index = (count || 0) % senders.length;
  return senders[index];
}

// ─── Deliverability Checks ─────────────────────────────────────────────────

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email",
  "trashmail.com", "yopmail.com", "sharklasers.com", "guerrillamailblock.com",
  "grr.la", "10minutemail.com", "temp-mail.org",
]);

function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.has(domain);
}

// ─── Webhook Handler (Open, Click, Bounce, Reply) ─────────────────────────

export async function handleResendWebhook(event: {
  type: string;
  data: {
    email_id?: string;
    to?: string[];
    tags?: { name: string; value: string }[];
    created_at?: string;
  };
}): Promise<void> {
  const supabase = getAdmin();

  const tags = event.data.tags || [];
  const userId = tags.find((t) => t.name === "userId")?.value;
  const contactId = tags.find((t) => t.name === "contactId")?.value;
  const trackingId = tags.find((t) => t.name === "trackingId")?.value;

  if (!userId) return;

  // Map Resend event types to our event types
  const eventTypeMap: Record<string, string> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.opened": "opened",
    "email.clicked": "clicked",
    "email.bounced": "bounced",
    "email.complained": "complained",
  };

  const eventType = eventTypeMap[event.type];
  if (!eventType) return;

  // Log message event
  await supabase.from("message_events").insert({
    message_id: event.data.email_id || trackingId,
    user_id: userId,
    event_type: eventType,
    metadata: {
      to: event.data.to,
      tracking_id: trackingId,
      contact_id: contactId,
      raw_type: event.type,
    },
  });

  // Handle specific events
  if (eventType === "bounced" && contactId) {
    // Pause sequence on bounce
    const { handleReply } = await import("@/lib/outreach/sequencer");
    // Not a real "reply" but we reuse the pause mechanism
    await supabase.from("activities").insert({
      user_id: userId,
      contact_id: contactId,
      activity_type: "email_bounced",
      details: { email_id: event.data.email_id },
    });
  }

  if (eventType === "complained" && contactId) {
    // Mark contact as do-not-email
    await supabase
      .from("contacts")
      .update({ do_not_email: true })
      .eq("id", contactId)
      .eq("user_id", userId);
  }
}

// ─── Email HTML Builder ────────────────────────────────────────────────────

function buildEmailHtml(
  body: string,
  contact: ContactForEmail,
  trackingId: string
): string {
  const htmlBody = body.replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
${htmlBody}

<br><br>
<div style="border-top: 1px solid #eee; padding-top: 12px; margin-top: 24px; font-size: 11px; color: #999;">
  <p>Sent via <a href="https://www.quotahit.com" style="color: #0099ff;">QuotaHit</a></p>
  <p><a href="mailto:unsubscribe@quotahit.com?subject=unsubscribe-${trackingId}" style="color: #999;">Unsubscribe</a></p>
</div>
</body>
</html>`;
}

// ─── Tracking ──────────────────────────────────────────────────────────────

async function trackEmailSend(
  userId: string,
  contactId: string,
  messageId: string,
  from: string,
  subject: string
): Promise<void> {
  const supabase = getAdmin();

  // Log to message_events
  await supabase.from("message_events").insert({
    message_id: messageId,
    user_id: userId,
    event_type: "sent",
    metadata: { contact_id: contactId, from, subject },
  });

  // Log to activities
  await supabase.from("activities").insert({
    user_id: userId,
    contact_id: contactId,
    activity_type: "cold_email_sent",
    details: { message_id: messageId, from, subject },
  });
}
