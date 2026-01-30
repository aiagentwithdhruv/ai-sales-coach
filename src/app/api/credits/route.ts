import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Create admin client with service role for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
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

    // Get user credits
    const { data: credits, error: creditsError } = await supabaseAdmin
      .from("user_credits")
      .select("credits, total_used, created_at")
      .eq("user_id", user.id)
      .single();

    if (creditsError) {
      // If no credits record exists, create one with default 5 credits
      if (creditsError.code === "PGRST116") {
        const { data: newCredits, error: insertError } = await supabaseAdmin
          .from("user_credits")
          .insert({ user_id: user.id, credits: 5, total_used: 0 })
          .select("credits, total_used, created_at")
          .single();

        if (insertError) {
          console.error("Error creating credits:", insertError);
          return NextResponse.json(
            { error: "Failed to initialize credits" },
            { status: 500 }
          );
        }

        return NextResponse.json(newCredits);
      }

      console.error("Error fetching credits:", creditsError);
      return NextResponse.json(
        { error: "Failed to fetch credits" },
        { status: 500 }
      );
    }

    return NextResponse.json(credits);
  } catch (error) {
    console.error("Credits API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
