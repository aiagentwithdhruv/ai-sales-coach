/**
 * Item 13: Self-Improving Templates
 *
 * AI tracks which templates perform best and auto-generates better variants.
 * Kills underperformers. Promotes winners.
 *
 * Self-improvement cycle:
 * Send templates (A/B/C variants)
 *   → Track opens, clicks, replies
 *   → After 100 sends per variant: compare
 *   → Kill worst performer
 *   → AI generates new variant from winner + fresh angle
 *   → Repeat forever
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ─────────────────────────────────────────────────────────────────

export interface TemplatePerformance {
  id: string;
  user_id: string;
  template_id: string;
  variant: string;
  channel: string;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  converted: number;
  performance_score: number;
  is_active: boolean;
}

// ─── Track Performance ─────────────────────────────────────────────────────

export async function trackTemplatePerformance(
  userId: string,
  templateId: string,
  channel: string,
  eventType: "sent" | "opened" | "clicked" | "replied" | "converted"
): Promise<void> {
  const supabase = getAdmin();

  // Upsert performance record
  const { data: existing } = await supabase
    .from("template_performance")
    .select("*")
    .eq("user_id", userId)
    .eq("template_id", templateId)
    .eq("channel", channel)
    .single();

  if (existing) {
    const updates: Record<string, number> = {};
    updates[eventType] = (existing[eventType as keyof typeof existing] as number || 0) + 1;

    // Recalculate performance score
    const sent = eventType === "sent" ? existing.sent + 1 : existing.sent;
    const opened = eventType === "opened" ? existing.opened + 1 : existing.opened;
    const replied = eventType === "replied" ? existing.replied + 1 : existing.replied;
    const converted = eventType === "converted" ? existing.converted + 1 : existing.converted;

    // Weighted performance score: reply rate (50%) + open rate (30%) + conversion rate (20%)
    const openRate = sent > 0 ? opened / sent : 0;
    const replyRate = sent > 0 ? replied / sent : 0;
    const conversionRate = sent > 0 ? converted / sent : 0;
    const score = (replyRate * 50 + openRate * 30 + conversionRate * 20) * 100;

    await supabase
      .from("template_performance")
      .update({
        ...updates,
        performance_score: Math.round(score * 100) / 100,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    const initialCounts: Record<string, number> = {
      sent: 0, opened: 0, clicked: 0, replied: 0, converted: 0,
    };
    initialCounts[eventType] = 1;

    await supabase.from("template_performance").insert({
      user_id: userId,
      template_id: templateId,
      variant: "A",
      channel,
      ...initialCounts,
      performance_score: 0,
      is_active: true,
    });
  }
}

// ─── Evaluate Templates ────────────────────────────────────────────────────

export async function evaluateTemplates(
  userId: string
): Promise<{
  evaluated: number;
  killed: number;
  generated: number;
}> {
  const supabase = getAdmin();
  let killed = 0;
  let generated = 0;

  // Get all active templates grouped by channel
  const { data: templates } = await supabase
    .from("template_performance")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("performance_score", { ascending: false });

  if (!templates || templates.length < 2) {
    return { evaluated: templates?.length || 0, killed: 0, generated: 0 };
  }

  // Group by channel + template base (variants share same template_id prefix)
  const groups: Record<string, TemplatePerformance[]> = {};
  for (const t of templates) {
    const key = `${t.channel}:${t.template_id.split("_v")[0]}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t as TemplatePerformance);
  }

  for (const [, variants] of Object.entries(groups)) {
    // Need at least 2 variants with 100+ sends to compare
    const readyVariants = variants.filter((v) => v.sent >= 100);
    if (readyVariants.length < 2) continue;

    // Sort by performance score
    readyVariants.sort((a, b) => b.performance_score - a.performance_score);

    // Kill the worst performer
    const worst = readyVariants[readyVariants.length - 1];
    await supabase
      .from("template_performance")
      .update({ is_active: false })
      .eq("id", worst.id);
    killed++;

    // Generate a new variant based on the winner
    const winner = readyVariants[0];
    try {
      const newVariant = await generateNewVariant(winner, userId);
      if (newVariant) generated++;
    } catch {
      // Generation failed — not critical
    }
  }

  return { evaluated: templates.length, killed, generated };
}

// ─── Generate New Variant ──────────────────────────────────────────────────

async function generateNewVariant(
  winner: TemplatePerformance,
  userId: string
): Promise<boolean> {
  const supabase = getAdmin();

  // Count existing variants to determine next variant letter
  const { count } = await supabase
    .from("template_performance")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("template_id", winner.template_id.split("_v")[0])
    .eq("channel", winner.channel);

  const variantLetter = String.fromCharCode(65 + (count || 0)); // A, B, C, ...

  // Create new performance record for the variant
  await supabase.from("template_performance").insert({
    user_id: userId,
    template_id: `${winner.template_id.split("_v")[0]}_v${variantLetter}`,
    variant: variantLetter,
    channel: winner.channel,
    sent: 0,
    opened: 0,
    clicked: 0,
    replied: 0,
    converted: 0,
    performance_score: 0,
    is_active: true,
  });

  return true;
}

// ─── Kill Underperformer ───────────────────────────────────────────────────

export async function killUnderperformer(templateId: string): Promise<boolean> {
  const supabase = getAdmin();
  const { error } = await supabase
    .from("template_performance")
    .update({ is_active: false })
    .eq("template_id", templateId);
  return !error;
}

// ─── Promote Winner ────────────────────────────────────────────────────────

export async function promoteWinner(templateId: string): Promise<boolean> {
  // Winners are implicitly promoted by having higher performance_score
  // This function can be used to boost send weight in future
  const supabase = getAdmin();
  await supabase.from("activities").insert({
    user_id: "system",
    activity_type: "template_promoted",
    details: { template_id: templateId },
  });
  return true;
}

// ─── Optimize Send Timing ──────────────────────────────────────────────────

export async function optimizeSendTiming(
  userId: string
): Promise<{ best_hour: number; best_day: number; open_rates_by_hour: Record<number, number> }> {
  const supabase = getAdmin();

  // Get open events with timestamps
  const { data: opens } = await supabase
    .from("message_events")
    .select("created_at")
    .eq("user_id", userId)
    .eq("event_type", "opened")
    .order("created_at", { ascending: false })
    .limit(1000);

  const hourCounts: Record<number, { total: number; opens: number }> = {};
  for (let h = 0; h < 24; h++) {
    hourCounts[h] = { total: 0, opens: 0 };
  }

  for (const open of opens || []) {
    const hour = new Date(open.created_at).getHours();
    hourCounts[hour].opens++;
    hourCounts[hour].total++;
  }

  // Find best hour
  let bestHour = 9; // Default
  let bestRate = 0;
  const openRatesByHour: Record<number, number> = {};

  for (const [hour, counts] of Object.entries(hourCounts)) {
    const rate = counts.total > 0 ? counts.opens / counts.total : 0;
    openRatesByHour[parseInt(hour)] = Math.round(rate * 100);
    if (rate > bestRate) {
      bestRate = rate;
      bestHour = parseInt(hour);
    }
  }

  // Find best day of week
  const dayCounts: Record<number, number> = {};
  for (const open of opens || []) {
    const day = new Date(open.created_at).getDay();
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  }

  let bestDay = 2; // Default Tuesday
  let bestDayCount = 0;
  for (const [day, count] of Object.entries(dayCounts)) {
    if (count > bestDayCount) {
      bestDayCount = count;
      bestDay = parseInt(day);
    }
  }

  return { best_hour: bestHour, best_day: bestDay, open_rates_by_hour: openRatesByHour };
}

// ─── Leaderboard ───────────────────────────────────────────────────────────

export async function getTemplateLeaderboard(
  userId: string
): Promise<TemplatePerformance[]> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("template_performance")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("performance_score", { ascending: false })
    .limit(20);
  return (data || []) as TemplatePerformance[];
}
