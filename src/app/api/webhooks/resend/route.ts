/**
 * Resend Email Webhook
 *
 * Handles email delivery events: sent, delivered, opened, clicked, bounced, complained.
 * Updates message_events table and triggers outreach actions.
 */

import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Resend sends events with a type field
    const { handleResendWebhook } = await import("@/lib/channels/cold-email");
    await handleResendWebhook({
      type: payload.type,
      data: {
        email_id: payload.data?.email_id,
        to: payload.data?.to,
        tags: payload.data?.tags,
        created_at: payload.data?.created_at || payload.created_at,
      },
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Webhook] Resend error:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
