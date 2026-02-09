/**
 * Stripe Webhook Handler
 *
 * Receives and verifies Stripe webhook events for subscription lifecycle management.
 * Handles checkout completion, subscription updates, and cancellations.
 */

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Check Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Stripe webhook: STRIPE_SECRET_KEY not configured");
      return NextResponse.json(
        { error: "Stripe is not configured." },
        { status: 500 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Stripe webhook: STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret is not configured." },
        { status: 500 }
      );
    }

    // Read raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`Stripe webhook signature verification failed: ${message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${message}` },
        { status: 400 }
      );
    }

    // Handle events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        console.log(
          `[Stripe] Checkout completed: userId=${userId}, planId=${planId}, ` +
            `customerId=${session.customer}, subscriptionId=${session.subscription}, ` +
            `email=${session.customer_email}`
        );

        // TODO: Update user's plan in database
        // await updateUserPlan(userId, planId, session.subscription, session.customer);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(
          `[Stripe] Subscription updated: subscriptionId=${subscription.id}, ` +
            `status=${subscription.status}, customerId=${subscription.customer}, ` +
            `cancelAtPeriodEnd=${subscription.cancel_at_period_end}`
        );

        // TODO: Update subscription status in database
        // await updateSubscriptionStatus(subscription.id, subscription.status);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(
          `[Stripe] Subscription cancelled: subscriptionId=${subscription.id}, ` +
            `customerId=${subscription.customer}, ` +
            `cancelledAt=${subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : "N/A"}`
        );

        // TODO: Downgrade user to free plan in database
        // await downgradeToFree(subscription.customer);
        break;
      }

      default: {
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe Webhook Error:", error);
    return NextResponse.json(
      {
        error: "Webhook handler failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
