/**
 * Item 9: WhatsApp Integration
 *
 * Send/receive WhatsApp messages via Gallabox BSP API.
 * Keys from Onsite project. Falls back to Meta Cloud API if configured.
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ─────────────────────────────────────────────────────────────────

interface ContactForWhatsApp {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  enrichment_data?: Record<string, unknown>;
}

interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: "gallabox" | "meta";
}

// ─── Config ────────────────────────────────────────────────────────────────

const GALLABOX_CONFIG = {
  apiBase: "https://server.gallabox.com/devapi/v1",
  channelId: process.env.GALLABOX_CHANNEL_ID || "642ead91fe1098cbbd157509",
  phoneNumber: process.env.GALLABOX_PHONE || "+918448009366",
};

// ─── Send Functions ────────────────────────────────────────────────────────

export async function sendWhatsApp(
  contact: ContactForWhatsApp,
  userId: string,
  templateOrMessage: string
): Promise<WhatsAppSendResult> {
  if (!contact.phone) {
    return { success: false, error: "No phone number", provider: "gallabox" };
  }

  // Auto-select provider: Gallabox keys → Gallabox; Meta keys → Meta direct
  const gallaboxKey = process.env.GALLABOX_API_KEY;
  const metaToken = process.env.META_WHATSAPP_TOKEN;

  if (gallaboxKey) {
    return sendViaGallabox(contact, userId, templateOrMessage);
  } else if (metaToken) {
    return sendViaMeta(contact, userId, templateOrMessage);
  }

  return { success: false, error: "No WhatsApp provider configured", provider: "gallabox" };
}

async function sendViaGallabox(
  contact: ContactForWhatsApp,
  userId: string,
  message: string
): Promise<WhatsAppSendResult> {
  const apiKey = process.env.GALLABOX_API_KEY!;

  // Generate personalized message if it's a template name
  let body = message;
  if (!message.includes(" ") || message.length < 20) {
    // Looks like a template name, generate the message
    const { generateWhatsAppMessage } = await import("@/lib/outreach/templates");
    const template = await generateWhatsAppMessage(contact, "casual", message as "intro");
    body = template.body;
  }

  try {
    const res = await fetch(`${GALLABOX_CONFIG.apiBase}/channels/${GALLABOX_CONFIG.channelId}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelId: GALLABOX_CONFIG.channelId,
        recipient: {
          phone: normalizePhone(contact.phone!),
          name: [contact.first_name, contact.last_name].filter(Boolean).join(" "),
        },
        message: {
          type: "text",
          text: body,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Gallabox error (${res.status}): ${text}`, provider: "gallabox" };
    }

    const data = await res.json();

    // Log to activities
    await logWhatsAppActivity(userId, contact.id, "sent", body, data.id);

    return { success: true, messageId: data.id, provider: "gallabox" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gallabox send failed",
      provider: "gallabox",
    };
  }
}

async function sendViaMeta(
  contact: ContactForWhatsApp,
  userId: string,
  message: string
): Promise<WhatsAppSendResult> {
  const token = process.env.META_WHATSAPP_TOKEN!;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID!;

  // Generate personalized message if it's a template name
  let body = message;
  if (!message.includes(" ") || message.length < 20) {
    const { generateWhatsAppMessage } = await import("@/lib/outreach/templates");
    const template = await generateWhatsAppMessage(contact, "casual", message as "intro");
    body = template.body;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalizePhone(contact.phone!),
          type: "text",
          text: { body },
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Meta API error (${res.status}): ${text}`, provider: "meta" };
    }

    const data = await res.json();
    const messageId = data.messages?.[0]?.id;

    await logWhatsAppActivity(userId, contact.id, "sent", body, messageId);

    return { success: true, messageId, provider: "meta" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Meta API send failed",
      provider: "meta",
    };
  }
}

// ─── Send Template Message (Pre-Approved) ──────────────────────────────────

export async function sendTemplateMessage(
  phone: string,
  templateName: string,
  variables: Record<string, string>
): Promise<WhatsAppSendResult> {
  const gallaboxKey = process.env.GALLABOX_API_KEY;
  if (!gallaboxKey) {
    return { success: false, error: "Gallabox not configured", provider: "gallabox" };
  }

  try {
    const res = await fetch(`${GALLABOX_CONFIG.apiBase}/channels/${GALLABOX_CONFIG.channelId}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": gallaboxKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelId: GALLABOX_CONFIG.channelId,
        recipient: { phone: normalizePhone(phone) },
        message: {
          type: "template",
          template: {
            name: templateName,
            language: { code: "en" },
            components: Object.entries(variables).map(([, value]) => ({
              type: "body",
              parameters: [{ type: "text", text: value }],
            })),
          },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Template send failed: ${text}`, provider: "gallabox" };
    }

    const data = await res.json();
    return { success: true, messageId: data.id, provider: "gallabox" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Template send failed",
      provider: "gallabox",
    };
  }
}

// ─── Incoming Webhook Handler ──────────────────────────────────────────────

export async function handleIncomingWhatsApp(payload: {
  from: string;
  body: string;
  messageId: string;
  timestamp: string;
}): Promise<void> {
  const supabase = getAdmin();

  // Find contact by phone number
  const phone = normalizePhone(payload.from);
  const { data: contact } = await supabase
    .from("contacts")
    .select("id, user_id")
    .or(`phone.eq.${phone},phone.eq.+${phone}`)
    .single();

  if (!contact) return; // Unknown sender

  // Log incoming message
  await supabase.from("activities").insert({
    user_id: contact.user_id,
    contact_id: contact.id,
    activity_type: "whatsapp_received",
    details: {
      from: payload.from,
      body: payload.body,
      message_id: payload.messageId,
    },
  });

  // Trigger reply handling in sequencer
  const { handleReply } = await import("@/lib/outreach/sequencer");
  await handleReply(contact.id, contact.user_id, "whatsapp", "positive");
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, "").replace(/^00/, "+");
}

async function logWhatsAppActivity(
  userId: string,
  contactId: string,
  direction: "sent" | "received",
  body: string,
  messageId?: string
): Promise<void> {
  const supabase = getAdmin();
  await supabase.from("activities").insert({
    user_id: userId,
    contact_id: contactId,
    activity_type: `whatsapp_${direction}`,
    details: { body: body.substring(0, 500), message_id: messageId },
  });
}
