import { createClient } from "@supabase/supabase-js";
import type {
  AICallCampaign,
  AICall,
  CampaignCreateInput,
  CallDashboardStats,
} from "@/types/teams";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ---------- Campaigns ----------

export async function getCampaigns(userId: string): Promise<AICallCampaign[]> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("ai_call_campaigns")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getCampaign(userId: string, id: string): Promise<AICallCampaign | null> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("ai_call_campaigns")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  return data;
}

export async function createCampaign(userId: string, input: CampaignCreateInput): Promise<AICallCampaign | null> {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from("ai_call_campaigns")
    .insert({
      user_id: userId,
      name: input.name,
      type: input.type,
      script: input.script || null,
      objective: input.objective || null,
      voice_id: input.voice_id || "alloy",
    })
    .select()
    .single();
  return error ? null : data;
}

export async function updateCampaign(
  userId: string,
  id: string,
  updates: Partial<AICallCampaign>
): Promise<AICallCampaign | null> {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from("ai_call_campaigns")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  return error ? null : data;
}

export async function deleteCampaign(userId: string, id: string): Promise<boolean> {
  const supabase = getAdmin();
  const { error } = await supabase
    .from("ai_call_campaigns")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}

// ---------- Calls ----------

export async function getCalls(
  userId: string,
  options?: { campaignId?: string; limit?: number; offset?: number }
): Promise<{ calls: AICall[]; total: number }> {
  const supabase = getAdmin();
  let query = supabase
    .from("ai_calls")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options?.campaignId) query = query.eq("campaign_id", options.campaignId);
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) query = query.range(options.offset, options.offset + (options?.limit || 20) - 1);

  const { data, count } = await query;
  return { calls: data || [], total: count || 0 };
}

export async function getCall(userId: string, id: string): Promise<AICall | null> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("ai_calls")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  return data;
}

export async function createCall(
  userId: string,
  call: Partial<AICall> & { direction: string }
): Promise<AICall | null> {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from("ai_calls")
    .insert({ user_id: userId, ...call })
    .select()
    .single();
  return error ? null : data;
}

export async function updateCall(
  userId: string,
  id: string,
  updates: Partial<AICall>
): Promise<AICall | null> {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from("ai_calls")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  return error ? null : data;
}

// ---------- Dashboard Stats ----------

export async function getCallDashboardStats(userId: string): Promise<CallDashboardStats> {
  const supabase = getAdmin();
  const { data: calls } = await supabase
    .from("ai_calls")
    .select("status, outcome, duration_seconds")
    .eq("user_id", userId);

  if (!calls || calls.length === 0) {
    return { totalCalls: 0, connectedCalls: 0, meetingsBooked: 0, avgDuration: 0, connectRate: 0, meetingRate: 0 };
  }

  const totalCalls = calls.length;
  const connectedCalls = calls.filter((c) => c.status === "completed" || c.status === "in_progress").length;
  const meetingsBooked = calls.filter((c) => c.outcome === "meeting_booked").length;
  const avgDuration = connectedCalls > 0
    ? Math.round(calls.filter((c) => c.duration_seconds > 0).reduce((s, c) => s + c.duration_seconds, 0) / connectedCalls)
    : 0;
  const connectRate = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;
  const meetingRate = connectedCalls > 0 ? Math.round((meetingsBooked / connectedCalls) * 100) : 0;

  return { totalCalls, connectedCalls, meetingsBooked, avgDuration, connectRate, meetingRate };
}
