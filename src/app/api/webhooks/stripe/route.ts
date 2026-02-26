/**
 * Stripe Webhook Handler
 *
 * Handles payment events: invoice.paid, invoice.payment_failed, etc.
 * Verifies webhook signature using STRIPE_WEBHOOK_SECRET.
 */

import { NextRequest } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const json = { "Content-Type": "application/json" };

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // Verify signature if webhook secret is configured
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;

    if (webhookSecret && signature) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error("[Stripe Webhook] Signature verification failed:", err);
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 400, headers: json }
        );
      }
    } else if (!webhookSecret) {
      // Fallback: no webhook secret configured (dev mode)
      console.warn("[Stripe Webhook] No STRIPE_WEBHOOK_SECRET set — skipping signature verification");
      event = JSON.parse(body);
    } else {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: json }
      );
    }

    const { handleStripeWebhook } = await import("@/lib/closing/invoicing");
    await handleStripeWebhook({
      type: event.type,
      data: { object: (event.data as any)?.object || {} },
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: json,
    });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: json }
    );
  }
}
