import { createClient } from "@supabase/supabase-js";
import type { Activity, ActivityType, DealStage } from "@/types/crm";
import { STAGE_CONFIG } from "@/types/crm";

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/**
 * Get activities for a contact (timeline)
 */
export async function getActivities(
  contactId: string,
  options: { page?: number; limit?: number; type?: ActivityType } = {}
): Promise<{ activities: Activity[]; total: number }> {
  const supabase = getSupabaseAdmin();
  const { page = 1, limit = 20, type } = options;

  let query = supabase
    .from("activities")
    .select("*", { count: "exact" })
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error("[CRM] getActivities error:", error);
    return { activities: [], total: 0 };
  }

  return { activities: (data || []) as Activity[], total: count || 0 };
}

/**
 * Log a new activity
 */
export async function logActivity(
  userId: string,
  contactId: string,
  type: ActivityType,
  title: string,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<Activity | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("activities")
    .insert({
      user_id: userId,
      contact_id: contactId,
      type,
      title,
      description: description || null,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error("[CRM] logActivity error:", error);
    return null;
  }

  return data as Activity;
}

/**
 * Log a stage change activity
 */
export async function logStageChange(
  userId: string,
  contactId: string,
  fromStage: string,
  toStage: DealStage
): Promise<Activity | null> {
  const fromLabel = STAGE_CONFIG[fromStage as DealStage]?.label || fromStage;
  const toLabel = STAGE_CONFIG[toStage]?.label || toStage;

  return logActivity(
    userId,
    contactId,
    "stage_change",
    `Stage changed: ${fromLabel} → ${toLabel}`,
    undefined,
    { from: fromStage, to: toStage }
  );
}

/**
 * Get recent activities across all contacts (for dashboard)
 */
export async function getRecentActivities(
  userId: string,
  limit: number = 10
): Promise<Activity[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[CRM] getRecentActivities error:", error);
    return [];
  }

  return (data || []) as Activity[];
}

/**
 * Get activity count for a contact (for lead scoring)
 */
export async function getActivityCount(
  contactId: string
): Promise<number> {
  const supabase = getSupabaseAdmin();

  const { count, error } = await supabase
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("contact_id", contactId);

  if (error) return 0;
  return count || 0;
}
