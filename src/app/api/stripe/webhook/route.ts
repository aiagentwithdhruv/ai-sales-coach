/**
 * Stripe Webhook Handler
 *
 * Receives and verifies Stripe webhook events for subscription lifecycle management.
 * Updates user_subscriptions table on checkout, subscription changes, and cancellations.
 */

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Stripe webhook: STRIPE_SECRET_KEY not configured");
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Stripe webhook: STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 500 });
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`Stripe webhook signature verification failed: ${message}`);
      return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
    }

    const supabase = getAdmin();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType || "bundle";
        const modulesStr = session.metadata?.modules || "";
        const interval = session.metadata?.interval || "monthly";

        console.log(
          `[Stripe] Checkout completed: userId=${userId}, planType=${planType}, ` +
          `modules=${modulesStr}, customerId=${session.customer}, subscriptionId=${session.subscription}`
        );

        if (userId) {
          const modules = modulesStr ? modulesStr.split(",") : ["coaching", "crm", "calling", "followups", "analytics"];

          await supabase
            .from("user_subscriptions")
            .upsert(
              {
                user_id: userId,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
                plan_type: planType === "bundle" ? "bundle" : "module",
                modules,
                billing_interval: interval,
                status: "active",
                current_period_start: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );

          console.log(`[Stripe] User ${userId} subscription activated: ${planType} [${modules.join(",")}]`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(
          `[Stripe] Subscription updated: id=${subscription.id}, status=${subscription.status}, ` +
          `cancelAtPeriodEnd=${subscription.cancel_at_period_end}`
        );

        const { data: sub } = await supabase
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (sub) {
          const statusMap: Record<string, string> = {
            active: "active",
            past_due: "past_due",
            canceled: "cancelled",
            unpaid: "past_due",
            incomplete: "active",
            incomplete_expired: "expired",
            trialing: "trial",
          };

          await supabase
            .from("user_subscriptions")
            .update({
              status: statusMap[subscription.status] || subscription.status,
              current_period_start: (subscription as any).current_period_start
                ? new Date((subscription as any).current_period_start * 1000).toISOString()
                : undefined,
              current_period_end: (subscription as any).current_period_end
                ? new Date((subscription as any).current_period_end * 1000).toISOString()
                : undefined,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", sub.user_id);

          console.log(`[Stripe] User ${sub.user_id} subscription status → ${subscription.status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(
          `[Stripe] Subscription cancelled: id=${subscription.id}, ` +
          `cancelledAt=${subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : "N/A"}`
        );

        const { data: sub } = await supabase
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (sub) {
          await supabase
            .from("user_subscriptions")
            .update({
              status: "cancelled",
              plan_type: "free",
              modules: [],
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", sub.user_id);

          console.log(`[Stripe] User ${sub.user_id} downgraded to free plan`);
        }
        break;
      }

      default: {
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe Webhook Error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
