/**
 * Admin: Quick Activate Plan by Email
 *
 * ONE-TIME USE: Activate plan for a user by their email address.
 * This is a convenience endpoint for quick testing/activation.
 *
 * Security: Only works if request comes from authenticated admin user.
 */

import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = [
  "aiwithdhruv@gmail.com",
  "dhruv@aiwithddhruv.com",
  "admin@aiwithddhruv.com",
  "dhruvtomar7008@gmail.com",
];

export async function POST(req: Request) {
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
    const { email, valid_until } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find user by email
    const { data: userList, error: searchError } = await supabase.auth.admin.listUsers();
    const targetUser = userList?.users.find((u) => u.email === email);

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: `User with email ${email} not found` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = targetUser.id;
    const validUntil = valid_until || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

    // Upsert subscription with unlimited access
    const { data, error } = await supabase
      .from("user_subscriptions")
      .upsert(
        {
          user_id: userId,
          plan_type: "bundle",
          status: "active",
          modules: ["coaching", "crm", "calling", "followups", "analytics"],
          valid_until: validUntil,
          trial_ends_at: null,
          created_at: new Date().toISOString(),
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
        message: `✓ Plan activated for ${email}`,
        user_id: userId,
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
