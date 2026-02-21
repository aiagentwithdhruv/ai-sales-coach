/**
 * Conversation Tracker
 *
 * Persists agent conversations to Supabase for analytics and memory.
 */

import { createAdminClient } from "@/lib/supabase/server";

export interface ConversationData {
  visitor_id: string;
  user_id?: string;
  agent_type?: string;
  page_context?: string;
  messages?: unknown[];
  modules_interested?: string[];
  objections_raised?: string[];
  discount_offered?: number;
  discount_type?: string;
  email_collected?: string;
  name_collected?: string;
  company_collected?: string;
  team_size?: string;
  current_tools?: string;
  outcome?: string;
  checkout_url?: string;
}

export async function createConversation(
  visitorId: string,
  pageContext: string = "pricing"
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("agent_conversations")
    .insert({
      visitor_id: visitorId,
      agent_type: "sales",
      page_context: pageContext,
      status: "active",
      messages: [],
      started_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[ConversationTracker] Create error:", error);
    return null;
  }

  return data.id;
}

export async function updateConversation(
  conversationId: string,
  updates: Partial<ConversationData>
): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from("agent_conversations")
    .update({
      ...updates,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);
}

export async function getActiveConversation(
  visitorId: string
): Promise<{ id: string; messages: unknown[] } | null> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("agent_conversations")
    .select("id, messages")
    .eq("visitor_id", visitorId)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  return data;
}

export async function saveMessages(
  conversationId: string,
  messages: unknown[]
): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from("agent_conversations")
    .update({
      messages,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);
}
