/**
 * Visitor Memory System
 *
 * Manages long-term visitor knowledge across sessions.
 * Stores in Supabase for persistence.
 */

import { createAdminClient } from "@/lib/supabase/server";

export interface VisitorMemory {
  visitor_id: string;
  name?: string;
  email?: string;
  company?: string;
  team_size?: string;
  industry?: string;
  current_tools?: string[];
  total_visits: number;
  total_conversations: number;
  modules_interested?: string[];
  all_objections?: string[];
  best_discount_offered?: number;
  conversion_status: string;
  summary?: string;
  first_seen_at: string;
  last_seen_at: string;
}

export async function getVisitorMemory(visitorId: string): Promise<VisitorMemory | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("agent_visitor_memory")
    .select("*")
    .eq("visitor_id", visitorId)
    .single();

  return data;
}

export async function upsertVisitorMemory(
  visitorId: string,
  updates: Partial<VisitorMemory>
): Promise<void> {
  const supabase = createAdminClient();

  const existing = await getVisitorMemory(visitorId);

  if (existing) {
    // Merge arrays (don't replace)
    const mergedModules = Array.from(new Set([
      ...(existing.modules_interested || []),
      ...(updates.modules_interested || []),
    ]));
    const mergedObjections = Array.from(new Set([
      ...(existing.all_objections || []),
      ...(updates.all_objections || []),
    ]));
    const mergedTools = Array.from(new Set([
      ...(existing.current_tools || []),
      ...(updates.current_tools || []),
    ]));

    await supabase
      .from("agent_visitor_memory")
      .update({
        ...updates,
        modules_interested: mergedModules,
        all_objections: mergedObjections,
        current_tools: mergedTools,
        total_visits: (existing.total_visits || 0) + 1,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("visitor_id", visitorId);
  } else {
    await supabase.from("agent_visitor_memory").insert({
      visitor_id: visitorId,
      ...updates,
      total_visits: 1,
      total_conversations: 0,
      conversion_status: "prospect",
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    });
  }
}

export async function buildVisitorContextString(visitorId: string): Promise<string | undefined> {
  const memory = await getVisitorMemory(visitorId);
  if (!memory) return undefined;

  const parts: string[] = [];

  if (memory.total_visits > 1) {
    parts.push(`Returning visitor (visit #${memory.total_visits}).`);
  }
  if (memory.name) parts.push(`Name: ${memory.name}.`);
  if (memory.company) parts.push(`Company: ${memory.company}.`);
  if (memory.team_size) parts.push(`Team size: ${memory.team_size}.`);
  if (memory.industry) parts.push(`Industry: ${memory.industry}.`);
  if (memory.current_tools?.length) {
    parts.push(`Currently uses: ${memory.current_tools.join(", ")}.`);
  }
  if (memory.modules_interested?.length) {
    parts.push(`Previously interested in: ${memory.modules_interested.join(", ")}.`);
  }
  if (memory.all_objections?.length) {
    parts.push(`Past objections: ${memory.all_objections.join(", ")}.`);
  }
  if (memory.best_discount_offered) {
    parts.push(`Best discount offered before: ${memory.best_discount_offered}%.`);
  }
  if (memory.summary) {
    parts.push(`Summary: ${memory.summary}`);
  }

  return parts.length > 0 ? parts.join(" ") : undefined;
}
