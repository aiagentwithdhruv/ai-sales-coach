import { createClient } from "@supabase/supabase-js";
import type {
  Contact,
  DealStage,
  PipelineAnalytics,
  ConversionFunnel,
  DealVelocity,
  WinLossAnalysis,
  DealForecast,
} from "@/types/crm";
import { STAGE_CONFIG, ACTIVE_STAGES } from "@/types/crm";

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/**
 * Get full pipeline analytics
 */
export async function getPipelineAnalytics(
  userId: string
): Promise<PipelineAnalytics> {
  const [funnel, velocity, winLoss, monthlyTrend, stalledDeals] =
    await Promise.all([
      getConversionFunnel(userId),
      getDealVelocity(userId),
      getWinLossAnalysis(userId),
      getMonthlyTrend(userId),
      getStalledDeals(userId),
    ]);

  return { funnel, velocity, winLoss, monthlyTrend, stalledDeals };
}

/**
 * Conversion funnel — how many contacts at each stage + conversion rates
 */
async function getConversionFunnel(
  userId: string
): Promise<ConversionFunnel[]> {
  const supabase = getSupabaseAdmin();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("deal_stage, deal_value")
    .eq("user_id", userId);

  if (!contacts) return [];

  // Count contacts per stage
  const stageCounts: Record<string, { count: number; value: number }> = {};
  for (const stage of [...ACTIVE_STAGES, "won" as DealStage, "lost" as DealStage]) {
    stageCounts[stage] = { count: 0, value: 0 };
  }

  for (const c of contacts) {
    const stage = c.deal_stage as string;
    if (stageCounts[stage]) {
      stageCounts[stage].count++;
      stageCounts[stage].value += Number(c.deal_value) || 0;
    }
  }

  // Also count contacts that PASSED through each stage (from history)
  const { data: history } = await supabase
    .from("deal_stage_history")
    .select("to_stage")
    .eq("user_id", userId);

  const passedThrough: Record<string, number> = {};
  for (const stage of [...ACTIVE_STAGES, "won" as DealStage, "lost" as DealStage]) {
    passedThrough[stage] = stageCounts[stage].count; // at minimum, current count
  }
  if (history) {
    for (const h of history) {
      if (passedThrough[h.to_stage] !== undefined) {
        passedThrough[h.to_stage]++;
      }
    }
  }

  const orderedStages: DealStage[] = [
    "new", "contacted", "qualified", "proposal", "negotiation", "won",
  ];

  return orderedStages.map((stage, i) => {
    const next = orderedStages[i + 1];
    const current = passedThrough[stage] || 0;
    const nextCount = next ? passedThrough[next] || 0 : 0;
    const conversionRate = current > 0 ? Math.round((nextCount / current) * 100) : 0;

    return {
      stage,
      label: STAGE_CONFIG[stage].label,
      count: stageCounts[stage]?.count || 0,
      value: stageCounts[stage]?.value || 0,
      conversionRate,
    };
  });
}

/**
 * Deal velocity — avg time spent in each stage
 */
async function getDealVelocity(userId: string): Promise<DealVelocity[]> {
  const supabase = getSupabaseAdmin();

  const { data: history } = await supabase
    .from("deal_stage_history")
    .select("*")
    .eq("user_id", userId)
    .order("changed_at", { ascending: true });

  if (!history || history.length === 0) {
    return ACTIVE_STAGES.map((stage) => ({
      stage,
      label: STAGE_CONFIG[stage].label,
      avgDaysInStage: 0,
      dealsCount: 0,
    }));
  }

  // Group by contact, calculate time in each stage
  const contactStages: Record<string, { stage: string; enteredAt: string }[]> = {};
  for (const h of history) {
    if (!contactStages[h.contact_id]) contactStages[h.contact_id] = [];
    contactStages[h.contact_id].push({
      stage: h.to_stage,
      enteredAt: h.changed_at,
    });
  }

  const stageDurations: Record<string, number[]> = {};
  for (const stage of ACTIVE_STAGES) {
    stageDurations[stage] = [];
  }

  for (const transitions of Object.values(contactStages)) {
    for (let i = 0; i < transitions.length - 1; i++) {
      const stage = transitions[i].stage;
      const entered = new Date(transitions[i].enteredAt).getTime();
      const exited = new Date(transitions[i + 1].enteredAt).getTime();
      const days = (exited - entered) / (1000 * 60 * 60 * 24);
      if (stageDurations[stage]) {
        stageDurations[stage].push(days);
      }
    }
  }

  return ACTIVE_STAGES.map((stage) => {
    const durations = stageDurations[stage];
    const avg =
      durations.length > 0
        ? Math.round(
            (durations.reduce((a, b) => a + b, 0) / durations.length) * 10
          ) / 10
        : 0;

    return {
      stage,
      label: STAGE_CONFIG[stage].label,
      avgDaysInStage: avg,
      dealsCount: durations.length,
    };
  });
}

/**
 * Win/Loss analysis
 */
async function getWinLossAnalysis(userId: string): Promise<WinLossAnalysis> {
  const supabase = getSupabaseAdmin();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("deal_stage, deal_value, created_at, updated_at")
    .eq("user_id", userId)
    .in("deal_stage", ["won", "lost"]);

  const result: WinLossAnalysis = {
    totalWon: 0,
    totalLost: 0,
    winRate: 0,
    avgWonDealValue: 0,
    avgLostDealValue: 0,
    avgDaysToWin: 0,
    avgDaysToLose: 0,
  };

  if (!contacts || contacts.length === 0) return result;

  let wonValues = 0;
  let lostValues = 0;
  let wonDays = 0;
  let lostDays = 0;

  for (const c of contacts) {
    const days = Math.max(
      1,
      (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const value = Number(c.deal_value) || 0;

    if (c.deal_stage === "won") {
      result.totalWon++;
      wonValues += value;
      wonDays += days;
    } else {
      result.totalLost++;
      lostValues += value;
      lostDays += days;
    }
  }

  const total = result.totalWon + result.totalLost;
  result.winRate = total > 0 ? Math.round((result.totalWon / total) * 100) : 0;
  result.avgWonDealValue =
    result.totalWon > 0 ? Math.round(wonValues / result.totalWon) : 0;
  result.avgLostDealValue =
    result.totalLost > 0 ? Math.round(lostValues / result.totalLost) : 0;
  result.avgDaysToWin =
    result.totalWon > 0 ? Math.round(wonDays / result.totalWon) : 0;
  result.avgDaysToLose =
    result.totalLost > 0 ? Math.round(lostDays / result.totalLost) : 0;

  return result;
}

/**
 * Monthly trend — won/lost/new deals per month
 */
async function getMonthlyTrend(userId: string) {
  const supabase = getSupabaseAdmin();

  // Get stage history for won/lost transitions
  const { data: history } = await supabase
    .from("deal_stage_history")
    .select("to_stage, deal_value, changed_at")
    .eq("user_id", userId)
    .in("to_stage", ["won", "lost"])
    .order("changed_at", { ascending: true });

  // Get all contacts for creation dates
  const { data: contacts } = await supabase
    .from("contacts")
    .select("created_at, deal_stage, deal_value")
    .eq("user_id", userId);

  const months: Record<
    string,
    { won: number; lost: number; wonValue: number; lostValue: number; newDeals: number }
  > = {};

  // Last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] = { won: 0, lost: 0, wonValue: 0, lostValue: 0, newDeals: 0 };
  }

  if (history) {
    for (const h of history) {
      const key = h.changed_at.slice(0, 7);
      if (months[key]) {
        const value = Number(h.deal_value) || 0;
        if (h.to_stage === "won") {
          months[key].won++;
          months[key].wonValue += value;
        } else {
          months[key].lost++;
          months[key].lostValue += value;
        }
      }
    }
  }

  if (contacts) {
    for (const c of contacts) {
      const key = c.created_at.slice(0, 7);
      if (months[key]) {
        months[key].newDeals++;
      }
    }
  }

  return Object.entries(months).map(([month, data]) => ({
    month,
    ...data,
  }));
}

/**
 * Get stalled deals — contacts with no recent activity
 */
export async function getStalledDeals(
  userId: string,
  staleDays = 7
): Promise<(Contact & { daysSinceActivity: number })[]> {
  const supabase = getSupabaseAdmin();

  // Get active contacts (not won/lost)
  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .not("deal_stage", "in", '("won","lost")')
    .order("last_contacted_at", { ascending: true, nullsFirst: true });

  if (!contacts) return [];

  const now = Date.now();
  const staleThreshold = staleDays * 24 * 60 * 60 * 1000;

  return (contacts as Contact[])
    .map((c) => {
      const lastActivity = c.last_contacted_at
        ? new Date(c.last_contacted_at).getTime()
        : new Date(c.created_at).getTime();
      const daysSinceActivity = Math.floor(
        (now - lastActivity) / (1000 * 60 * 60 * 24)
      );
      return { ...c, daysSinceActivity };
    })
    .filter((c) => {
      const lastActivity = c.last_contacted_at
        ? new Date(c.last_contacted_at).getTime()
        : new Date(c.created_at).getTime();
      return now - lastActivity > staleThreshold;
    })
    .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);
}

/**
 * Deal forecasting
 */
export async function getDealForecast(userId: string): Promise<DealForecast> {
  const supabase = getSupabaseAdmin();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .not("deal_stage", "in", '("won","lost")');

  const forecast: DealForecast = {
    expectedRevenue: 0,
    bestCase: 0,
    worstCase: 0,
    byMonth: [],
    atRisk: [],
  };

  if (!contacts) return forecast;

  const now = new Date();
  const monthlyBuckets: Record<
    string,
    { expected: number; bestCase: number; worstCase: number; deals: number }
  > = {};

  // Next 3 months
  for (let i = 0; i < 3; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyBuckets[key] = { expected: 0, bestCase: 0, worstCase: 0, deals: 0 };
  }

  for (const contact of contacts as Contact[]) {
    const value = Number(contact.deal_value) || 0;
    const prob = (contact.probability || 0) / 100;

    const expected = value * prob;
    const bestCase = value;
    const worstCase = value * Math.max(prob - 0.2, 0);

    forecast.expectedRevenue += expected;
    forecast.bestCase += bestCase;
    forecast.worstCase += worstCase;

    // Assign to month bucket based on expected_close_date or stage velocity
    const closeDate = contact.expected_close_date
      ? new Date(contact.expected_close_date)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // default: 30 days
    const monthKey = `${closeDate.getFullYear()}-${String(closeDate.getMonth() + 1).padStart(2, "0")}`;

    if (monthlyBuckets[monthKey]) {
      monthlyBuckets[monthKey].expected += expected;
      monthlyBuckets[monthKey].bestCase += bestCase;
      monthlyBuckets[monthKey].worstCase += worstCase;
      monthlyBuckets[monthKey].deals++;
    }

    // Check for at-risk deals
    const daysSinceContact = contact.last_contacted_at
      ? Math.floor(
          (now.getTime() - new Date(contact.last_contacted_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 999;

    let riskScore = 0;
    const reasons: string[] = [];

    if (daysSinceContact > 14) {
      riskScore += 40;
      reasons.push(`No contact in ${daysSinceContact} days`);
    } else if (daysSinceContact > 7) {
      riskScore += 20;
      reasons.push(`${daysSinceContact} days since last contact`);
    }

    if (contact.deal_stage === "negotiation" && daysSinceContact > 5) {
      riskScore += 30;
      reasons.push("Negotiation stalling");
    }

    if (contact.deal_stage === "proposal" && daysSinceContact > 10) {
      riskScore += 25;
      reasons.push("Proposal pending too long");
    }

    if (
      contact.next_follow_up_at &&
      new Date(contact.next_follow_up_at) < now
    ) {
      riskScore += 20;
      reasons.push("Overdue follow-up");
    }

    if (riskScore >= 30) {
      forecast.atRisk.push({
        contact,
        riskScore: Math.min(riskScore, 100),
        reason: reasons.join("; "),
      });
    }
  }

  forecast.expectedRevenue = Math.round(forecast.expectedRevenue);
  forecast.bestCase = Math.round(forecast.bestCase);
  forecast.worstCase = Math.round(forecast.worstCase);

  forecast.byMonth = Object.entries(monthlyBuckets).map(([month, data]) => ({
    month,
    expected: Math.round(data.expected),
    bestCase: Math.round(data.bestCase),
    worstCase: Math.round(data.worstCase),
    deals: data.deals,
  }));

  forecast.atRisk.sort((a, b) => b.riskScore - a.riskScore);

  return forecast;
}
