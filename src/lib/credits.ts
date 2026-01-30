import { createClient } from "@supabase/supabase-js";

// Create admin client with service role
const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export interface CreditCheckResult {
  hasCredits: boolean;
  credits: number;
  error?: string;
  userId?: string;
}

export interface CreditDeductResult {
  success: boolean;
  credits: number;
  total_used: number;
  error?: string;
}

/**
 * Check if user has sufficient credits
 */
export async function checkCredits(
  authHeader: string | null,
  requiredCredits: number = 1
): Promise<CreditCheckResult> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { hasCredits: false, credits: 0, error: "Unauthorized" };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseAdmin = getSupabaseAdmin();

  // Verify user
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return { hasCredits: false, credits: 0, error: "Invalid token" };
  }

  // Get credits
  const { data: credits, error: creditsError } = await supabaseAdmin
    .from("user_credits")
    .select("credits")
    .eq("user_id", user.id)
    .single();

  if (creditsError) {
    // Create record if doesn't exist
    if (creditsError.code === "PGRST116") {
      await supabaseAdmin
        .from("user_credits")
        .insert({ user_id: user.id, credits: 5, total_used: 0 });
      return { hasCredits: 5 >= requiredCredits, credits: 5, userId: user.id };
    }
    return { hasCredits: false, credits: 0, error: "Database error" };
  }

  return {
    hasCredits: credits.credits >= requiredCredits,
    credits: credits.credits,
    userId: user.id,
  };
}

/**
 * Deduct credits from user's balance
 */
export async function deductCredits(
  userId: string,
  amount: number = 1
): Promise<CreditDeductResult> {
  const supabaseAdmin = getSupabaseAdmin();

  // Get current credits
  const { data: current, error: fetchError } = await supabaseAdmin
    .from("user_credits")
    .select("credits, total_used")
    .eq("user_id", userId)
    .single();

  if (fetchError || !current) {
    return { success: false, credits: 0, total_used: 0, error: "Not found" };
  }

  if (current.credits < amount) {
    return {
      success: false,
      credits: current.credits,
      total_used: current.total_used,
      error: "Insufficient credits",
    };
  }

  // Deduct
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("user_credits")
    .update({
      credits: current.credits - amount,
      total_used: current.total_used + amount,
    })
    .eq("user_id", userId)
    .select("credits, total_used")
    .single();

  if (updateError || !updated) {
    return {
      success: false,
      credits: current.credits,
      total_used: current.total_used,
      error: "Update failed",
    };
  }

  return {
    success: true,
    credits: updated.credits,
    total_used: updated.total_used,
  };
}

/**
 * Get user credits
 */
export async function getUserCredits(
  userId: string
): Promise<{ credits: number; total_used: number } | null> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("user_credits")
    .select("credits, total_used")
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data;
}
