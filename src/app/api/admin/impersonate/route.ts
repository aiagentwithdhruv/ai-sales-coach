/**
 * Admin Impersonation API
 *
 * Allows admin (aiwithdhruv@gmail.com) to access any user's account.
 * Creates a magic link for the target user, logged in admin_audit_log.
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const json = { "Content-Type": "application/json" };

const ADMIN_EMAILS = [
  "aiwithdhruv@gmail.com",
  "dhruv@aiwithdruv.com",
  "admin@aiwithdruv.com",
  "dhruvtomar7008@gmail.com",
];

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function verifyAdmin(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    return { isAdmin: false, error: "Unauthorized", email: "" };
  }

  const supabase = getAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

  if (error || !user || !ADMIN_EMAILS.includes(user.email || "")) {
    return { isAdmin: false, error: "Not authorized as admin", email: "" };
  }

  return { isAdmin: true, email: user.email || "", error: "" };
}

// POST /api/admin/impersonate — Generate magic link for target user
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req.headers.get("authorization"));
  if (!admin.isAdmin) {
    return new Response(JSON.stringify({ error: admin.error }), { status: 403, headers: json });
  }

  const body = await req.json();
  const { email } = body;

  if (!email) {
    return new Response(JSON.stringify({ error: "email is required" }), { status: 400, headers: json });
  }

  const supabase = getAdmin();

  // Find target user
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    return new Response(JSON.stringify({ error: "Failed to list users" }), { status: 500, headers: json });
  }

  const targetUser = users.users.find((u) => u.email === email);
  if (!targetUser) {
    return new Response(JSON.stringify({ error: `User ${email} not found` }), { status: 404, headers: json });
  }

  // Generate magic link for the target user
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${origin}/dashboard?impersonated=true`,
    },
  });

  if (linkError || !linkData) {
    return new Response(
      JSON.stringify({ error: linkError?.message || "Failed to generate access link" }),
      { status: 500, headers: json }
    );
  }

  // Log the impersonation action
  await supabase.from("admin_audit_log").insert({
    admin_email: admin.email,
    action: "impersonate",
    target_user_id: targetUser.id,
    target_email: email,
    details: { timestamp: new Date().toISOString() },
  });

  return new Response(
    JSON.stringify({
      success: true,
      link: linkData.properties?.action_link || null,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.user_metadata?.full_name || email.split("@")[0],
        created_at: targetUser.created_at,
      },
    }),
    { status: 200, headers: json }
  );
}

// GET /api/admin/impersonate — Get all users (for admin search)
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req.headers.get("authorization"));
  if (!admin.isAdmin) {
    return new Response(JSON.stringify({ error: admin.error }), { status: 403, headers: json });
  }

  const supabase = getAdmin();

  // Get all users
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    return new Response(JSON.stringify({ error: "Failed to list users" }), { status: 500, headers: json });
  }

  // Get subscriptions and usage for all users
  const { data: subscriptions } = await supabase.from("user_subscriptions").select("*");
  const { data: usage } = await supabase.from("user_usage").select("*").eq("month", new Date().toISOString().slice(0, 7));
  const { data: auditLog } = await supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(50);

  const subMap = new Map((subscriptions || []).map((s) => [s.user_id, s]));
  const usageMap = new Map((usage || []).map((u) => [u.user_id, u]));

  const userList = users.users.map((u) => {
    const sub = subMap.get(u.id);
    const usg = usageMap.get(u.id);
    return {
      id: u.id,
      email: u.email,
      name: u.user_metadata?.full_name || u.email?.split("@")[0] || "Unknown",
      created_at: u.created_at,
      plan: sub?.plan_type || "free",
      status: sub?.status || "free",
      ai_calls_this_month: usg?.ai_calls_made || 0,
    };
  });

  return new Response(
    JSON.stringify({ users: userList, audit_log: auditLog || [] }),
    { status: 200, headers: json }
  );
}
