/**
 * Stripe Checkout Session API Route
 *
 * Creates a Stripe Checkout session for subscription billing.
 * Requires authenticated user via Supabase auth token.
 */

import { NextResponse } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Admin client for verifying auth tokens
const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(req: Request) {
  try {
    // Check Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables." },
        { status: 500 }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = getSupabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired token. Please sign in again." },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { planId, yearly } = body as {
      planId: string;
      yearly?: boolean;
    };

    // Validate plan
    if (!planId || !(planId in PLANS)) {
      return NextResponse.json(
        { error: "Invalid plan. Choose 'pro' or 'team'." },
        { status: 400 }
      );
    }

    if (planId === "free") {
      return NextResponse.json(
        { error: "Free plan does not require checkout." },
        { status: 400 }
      );
    }

    // At this point planId is "pro" or "team"
    const validPlanId = planId as "pro" | "team";

    const plan = PLANS[validPlanId];
    if (!plan.priceId) {
      return NextResponse.json(
        {
          error: `Price not configured for ${plan.name} plan. Set STRIPE_${validPlanId.toUpperCase()}_PRICE_ID in environment variables.`,
        },
        { status: 500 }
      );
    }

    // Build the origin URL
    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        planId: validPlanId,
        yearly: yearly ? "true" : "false",
      },
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
