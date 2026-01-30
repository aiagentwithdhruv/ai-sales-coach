import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Admin emails that can manage credits
const ADMIN_EMAILS = [
  "aiwithdhruv@gmail.com",
  "dhruv@aiwithdruv.com",
  "admin@aiwithdruv.com",
  "dhruvtomar7008@gmail.com",
];

// Set to true to allow any authenticated user (for testing)
const ALLOW_ANY_AUTHENTICATED = true;

// Create admin client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify admin access
async function verifyAdmin(authHeader: string | null): Promise<{ isAdmin: boolean; email?: string; error?: string }> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { isAdmin: false, error: "Unauthorized" };
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return { isAdmin: false, error: "Invalid token" };
  }

  // Allow any authenticated user if flag is set, otherwise check admin list
  if (!ALLOW_ANY_AUTHENTICATED && !ADMIN_EMAILS.includes(user.email || "")) {
    return { isAdmin: false, error: "Not authorized as admin" };
  }

  return { isAdmin: true, email: user.email };
}

// GET - List all users with credits
export async function GET(request: Request) {
  const adminCheck = await verifyAdmin(request.headers.get("authorization"));
  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: adminCheck.error }, { status: 403 });
  }

  // Get all users with their credits
  const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

  if (usersError) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  // Get credits for all users
  const { data: credits, error: creditsError } = await supabaseAdmin
    .from("user_credits")
    .select("*");

  if (creditsError) {
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
  }

  // Merge users with credits
  const creditsMap = new Map(credits?.map(c => [c.user_id, c]) || []);

  const usersWithCredits = users.users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Unknown",
    created_at: user.created_at,
    credits: creditsMap.get(user.id)?.credits ?? 0,
    total_used: creditsMap.get(user.id)?.total_used ?? 0,
  }));

  return NextResponse.json({ users: usersWithCredits });
}

// POST - Add credits to a user by email
export async function POST(request: Request) {
  const adminCheck = await verifyAdmin(request.headers.get("authorization"));
  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: adminCheck.error }, { status: 403 });
  }

  const body = await request.json();
  const { email, credits } = body;

  if (!email || typeof credits !== "number") {
    return NextResponse.json({ error: "Email and credits are required" }, { status: 400 });
  }

  // Find user by email
  const { data: users, error: findError } = await supabaseAdmin.auth.admin.listUsers();

  if (findError) {
    return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
  }

  const user = users.users.find(u => u.email === email);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if credits record exists
  const { data: existing } = await supabaseAdmin
    .from("user_credits")
    .select("credits")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Update existing credits
    const { error: updateError } = await supabaseAdmin
      .from("user_credits")
      .update({ credits: existing.credits + credits })
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update credits" }, { status: 500 });
    }
  } else {
    // Create new credits record
    const { error: insertError } = await supabaseAdmin
      .from("user_credits")
      .insert({ user_id: user.id, credits, total_used: 0 });

    if (insertError) {
      return NextResponse.json({ error: "Failed to create credits" }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    message: `Added ${credits} credits to ${email}`,
    newTotal: (existing?.credits || 0) + credits
  });
}

// PUT - Set exact credits for a user
export async function PUT(request: Request) {
  const adminCheck = await verifyAdmin(request.headers.get("authorization"));
  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: adminCheck.error }, { status: 403 });
  }

  const body = await request.json();
  const { email, credits } = body;

  if (!email || typeof credits !== "number") {
    return NextResponse.json({ error: "Email and credits are required" }, { status: 400 });
  }

  // Find user by email
  const { data: users, error: findError } = await supabaseAdmin.auth.admin.listUsers();

  if (findError) {
    return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
  }

  const user = users.users.find(u => u.email === email);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Upsert credits
  const { error: upsertError } = await supabaseAdmin
    .from("user_credits")
    .upsert({
      user_id: user.id,
      credits,
      total_used: 0
    }, {
      onConflict: "user_id"
    });

  if (upsertError) {
    return NextResponse.json({ error: "Failed to set credits" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Set ${email} credits to ${credits}`
  });
}
