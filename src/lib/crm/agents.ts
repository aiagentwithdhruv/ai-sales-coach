import { createClient } from "@supabase/supabase-js";
import type { AIAgent, AgentCreateInput } from "@/types/teams";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ---------- CRUD ----------

export async function getAgents(userId: string): Promise<AIAgent[]> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getAgent(userId: string, id: string): Promise<AIAgent | null> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  return data;
}

export async function createAgent(userId: string, input: AgentCreateInput): Promise<AIAgent | null> {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from("ai_agents")
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description || null,
      voice_provider: input.voice_provider || "openai",
      voice_id: input.voice_id || "alloy",
      language: input.language || "en",
      system_prompt: input.system_prompt || "You are a professional sales representative.",
      greeting: input.greeting || "Hi, this is {{agent_name}}. How are you today?",
      model: input.model || "gpt-4o-mini",
      temperature: input.temperature ?? 0.7,
      objective: input.objective || null,
      template_id: input.template_id || null,
      knowledge_base: input.knowledge_base || [],
      tools_enabled: input.tools_enabled || ["transfer_call", "book_meeting", "send_sms"],
      objection_responses: input.objection_responses || {},
      max_call_duration_seconds: input.max_call_duration_seconds || 300,
      silence_timeout_seconds: input.silence_timeout_seconds || 10,
      interrupt_sensitivity: input.interrupt_sensitivity || "medium",
      end_call_phrases: input.end_call_phrases || ["goodbye", "not interested", "stop calling"],
    })
    .select()
    .single();
  return error ? null : data;
}

export async function updateAgent(
  userId: string,
  id: string,
  updates: Partial<AgentCreateInput>
): Promise<AIAgent | null> {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from("ai_agents")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  return error ? null : data;
}

export async function deleteAgent(userId: string, id: string): Promise<boolean> {
  const supabase = getAdmin();
  const { error } = await supabase
    .from("ai_agents")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}

// ---------- Helpers ----------

export async function getActiveAgent(userId: string, agentId: string): Promise<AIAgent | null> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("id", agentId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();
  return data;
}

export async function incrementAgentCalls(agentId: string, score: number): Promise<void> {
  const supabase = getAdmin();
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("total_calls, avg_score")
    .eq("id", agentId)
    .single();

  if (!agent) return;

  const newTotal = agent.total_calls + 1;
  const newAvg = ((agent.avg_score * agent.total_calls) + score) / newTotal;

  await supabase
    .from("ai_agents")
    .update({
      total_calls: newTotal,
      avg_score: Math.round(newAvg * 100) / 100,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId);
}
