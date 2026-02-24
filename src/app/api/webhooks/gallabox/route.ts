/**
 * Gallabox WhatsApp Webhook
 *
 * Receives incoming WhatsApp messages from Gallabox BSP.
 * Logs to activities, triggers outreach/reply.received event.
 */

import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Gallabox sends different event types
    const eventType = payload.event || payload.type;

    if (eventType === "message" || eventType === "message.received") {
      const { handleIncomingWhatsApp } = await import("@/lib/channels/whatsapp");
      await handleIncomingWhatsApp({
        from: payload.from || payload.sender?.phone || "",
        body: payload.message?.text || payload.text || "",
        messageId: payload.messageId || payload.id || "",
        timestamp: payload.timestamp || new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Webhook] Gallabox error:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Gallabox webhook verification
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  if (challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("OK", { status: 200 });
}
