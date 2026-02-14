/**
 * Admin: Activate/Update User Plan
 *
 * ADMIN ONLY: Allows admins to activate or update a user's subscription.
 * Creates/updates user_subscriptions record.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

const ADMIN_EMAILS = [
  "aiwithdhruv@gmail.com",
  "dhruv@aiwithdruv.com",
  "admin@aiwithdruv.com",
  "dhruvtomar7008@gmail.com",
];

export async function POST(req: NextRequest) {
  try {
    // Authenticate as admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(user.email || "")) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { user_id, plan_type, modules, valid_until } = body;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Default: bundle plan, valid for 6 months
    const planType = plan_type || "bundle";
    const periodEnd = valid_until || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
    const defaultModules = [
      "coaching",
      "crm",
      "calling",
      "followups",
      "analytics",
    ];

    // Upsert subscription
    const { data, error } = await supabase
      .from("user_subscriptions")
      .upsert(
        {
          user_id,
          plan_type: planType,
          status: "active",
          modules: modules || defaultModules,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd,
          trial_ends_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Plan activated for user ${user_id}`,
        subscription: data,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
