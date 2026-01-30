import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Create admin client with service role for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify the user's token
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Parse amount to deduct (default 1)
    const body = await request.json().catch(() => ({}));
    const amount = body.amount || 1;

    // Get current credits
    const { data: currentCredits, error: fetchError } = await supabaseAdmin
      .from("user_credits")
      .select("credits, total_used")
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      // If no credits record exists, create one with default 5 credits
      if (fetchError.code === "PGRST116") {
        const { data: newCredits, error: insertError } = await supabaseAdmin
          .from("user_credits")
          .insert({ user_id: user.id, credits: 5, total_used: 0 })
          .select("credits, total_used")
          .single();

        if (insertError) {
          return NextResponse.json(
            { error: "Failed to initialize credits" },
            { status: 500 }
          );
        }

        // Now deduct from new record
        if (newCredits.credits < amount) {
          return NextResponse.json(
            {
              error: "Insufficient credits",
              credits: newCredits.credits,
              required: amount,
            },
            { status: 402 }
          );
        }
      } else {
        console.error("Error fetching credits:", fetchError);
        return NextResponse.json(
          { error: "Failed to fetch credits" },
          { status: 500 }
        );
      }
    }

    // Check if user has enough credits
    if (currentCredits && currentCredits.credits < amount) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          credits: currentCredits.credits,
          required: amount,
        },
        { status: 402 }
      );
    }

    // Deduct credits
    const { data: updatedCredits, error: updateError } = await supabaseAdmin
      .from("user_credits")
      .update({
        credits: (currentCredits?.credits || 5) - amount,
        total_used: (currentCredits?.total_used || 0) + amount,
      })
      .eq("user_id", user.id)
      .select("credits, total_used")
      .single();

    if (updateError) {
      console.error("Error updating credits:", updateError);
      return NextResponse.json(
        { error: "Failed to deduct credits" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      credits: updatedCredits.credits,
      total_used: updatedCredits.total_used,
      deducted: amount,
    });
  } catch (error) {
    console.error("Credits deduct API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
