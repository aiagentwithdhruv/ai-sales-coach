/**
 * Stripe Checkout Session API Route
 *
 * Creates a Stripe Checkout session for module-based subscription billing.
 * Supports: individual modules, bundle, and legacy pro/team plans.
 */

import { NextResponse } from "next/server";
import { stripe, MODULE_PRICES, PLANS } from "@/lib/stripe";
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
    const { modules, planId, interval = "monthly" } = body as {
      modules?: string[];  // New: array of module slugs
      planId?: string;     // Legacy: 'pro' or 'team'
      interval?: string;
    };

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // ─── Module-based checkout (new system) ─────────────────────────────
    if (modules && modules.length > 0) {
      const lineItems: { price: string; quantity: number }[] = [];
      const validModules: string[] = [];

      // Check if "bundle" is selected
      if (modules.includes("bundle")) {
        const bundlePrice = MODULE_PRICES.bundle.priceId;
        if (!bundlePrice) {
          return NextResponse.json(
            { error: "Bundle price not configured. Set STRIPE_BUNDLE_PRICE_ID." },
            { status: 500 }
          );
        }
        lineItems.push({ price: bundlePrice, quantity: 1 });
        validModules.push("coaching", "crm", "calling", "followups", "analytics");
      } else {
        // Individual modules
        for (const mod of modules) {
          const moduleConfig = MODULE_PRICES[mod as keyof typeof MODULE_PRICES];
          if (!moduleConfig || mod === "bundle") continue;
          if (!moduleConfig.priceId) {
            return NextResponse.json(
              { error: `Price not configured for ${moduleConfig.name}. Set STRIPE_${mod.toUpperCase()}_PRICE_ID.` },
              { status: 500 }
            );
          }
          lineItems.push({ price: moduleConfig.priceId, quantity: 1 });
          validModules.push(mod);
        }
      }

      if (lineItems.length === 0) {
        return NextResponse.json({ error: "No valid modules selected." }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: user.email,
        line_items: lineItems,
        metadata: {
          userId: user.id,
          planType: modules.includes("bundle") ? "bundle" : "module",
          modules: validModules.join(","),
          interval,
        },
        success_url: `${origin}/dashboard?checkout=success`,
        cancel_url: `${origin}/pricing?checkout=cancel`,
      });

      return NextResponse.json({ url: session.url });
    }

    // ─── Legacy plan-based checkout ─────────────────────────────────────
    if (planId) {
      if (planId === "free") {
        return NextResponse.json({ error: "Free plan does not require checkout." }, { status: 400 });
      }

      if (!(planId in PLANS)) {
        return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
      }

      const plan = PLANS[planId as keyof typeof PLANS];
      if (!plan.priceId) {
        return NextResponse.json(
          { error: `Price not configured for ${plan.name} plan.` },
          { status: 500 }
        );
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: user.email,
        line_items: [{ price: plan.priceId, quantity: 1 }],
        metadata: {
          userId: user.id,
          planId,
          planType: "legacy",
        },
        success_url: `${origin}/dashboard?checkout=success`,
        cancel_url: `${origin}/pricing?checkout=cancel`,
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: "Provide 'modules' array or 'planId'." }, { status: 400 });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
