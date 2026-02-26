/**
 * Stripe Checkout Session API Route — Tier-Based
 *
 * Creates a Stripe Checkout session for tier subscriptions.
 * Accepts: { tier: "starter"|"growth"|"enterprise", interval: "monthly"|"quarterly"|"yearly" }
 */

import { NextResponse } from "next/server";
import { stripe, getTierPriceId, getTierPriceEnvVar } from "@/lib/stripe";
import { TIERS, TRIAL_DURATION_DAYS, type TierSlug, type BillingInterval } from "@/lib/pricing";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables." },
        { status: 500 }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    const body = await req.json();
    const { tier, interval = "monthly" } = body as {
      tier: string;
      interval?: string;
    };

    // Validate tier
    if (!tier || !TIERS[tier as TierSlug]) {
      return NextResponse.json(
        { error: `Invalid tier "${tier}". Must be one of: starter, growth, enterprise.` },
        { status: 400 }
      );
    }

    const tierSlug = tier as TierSlug;
    const billingInterval = (["monthly", "quarterly", "yearly"].includes(interval) ? interval : "monthly") as BillingInterval;

    // Enterprise → contact sales (no self-serve checkout)
    if (tierSlug === "enterprise") {
      return NextResponse.json(
        { error: "Enterprise plans require a consultation. Book a demo at quotahit.com." },
        { status: 400 }
      );
    }

    // Get Stripe price ID
    const priceId = getTierPriceId(tierSlug, billingInterval);
    if (!priceId) {
      const envVar = getTierPriceEnvVar(tierSlug, billingInterval);
      return NextResponse.json(
        { error: `Price not configured for ${TIERS[tierSlug].name} (${billingInterval}). Set ${envVar}.` },
        { status: 500 }
      );
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: TRIAL_DURATION_DAYS,
        metadata: {
          userId: user.id,
          tier: tierSlug,
          interval: billingInterval,
        },
      },
      metadata: {
        userId: user.id,
        tier: tierSlug,
        interval: billingInterval,
      },
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
