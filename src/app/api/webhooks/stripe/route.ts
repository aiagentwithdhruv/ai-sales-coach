/**
 * Stripe Webhook Handler
 *
 * Handles payment events: invoice.paid, invoice.payment_failed, etc.
 */

import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const { handleStripeWebhook } = await import("@/lib/closing/invoicing");
    await handleStripeWebhook({
      type: payload.type,
      data: { object: payload.data?.object || {} },
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Webhook] Stripe error:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
