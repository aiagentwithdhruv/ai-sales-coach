/**
 * Item 14: Feedback Loop Pipeline
 *
 * Outcomes feed back into scoring + agent improvement.
 * The system learns from every deal won/lost and recalibrates:
 *   - Scoring weights (which signals predict closes)
 *   - Agent performance (qualification rate, conversion %)
 *   - Template effectiveness (via optimizer integration)
 *
 * Events:
 *   deal/won → record outcome → recalibrate scoring
 *   deal/lost → record outcome → analyze failure → adjust weights
 *   feedback/recalibrate → monthly AI-driven scoring rubric refresh
 */

import { inngest } from "../client";
import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Record Deal Outcome ──────────────────────────────────────────────────

export const recordDealOutcome = inngest.createFunction(
  {
    id: "record-deal-outcome",
    retries: 2,
  },
  [{ event: "deal/won" }, { event: "deal/lost" }],
  async ({ event, step }) => {
    const { contactId, userId, outcome, dealValue, lostReason } = event.data as {
      contactId: string;
      userId: string;
      outcome: "won" | "lost";
      dealValue?: number;
      lostReason?: string;
    };

    // Store outcome in feedback_outcomes table
    await step.run("store-outcome", async () => {
      const supabase = getAdmin();

      // Get the contact's journey data for learning
      const { data: contact } = await supabase
        .from("contacts")
        .select("lead_score, deal_stage, source, enrichment_data, custom_fields, created_at")
        .eq("id", contactId)
        .eq("user_id", userId)
        .single();

      // Get activities timeline
      const { data: activities } = await supabase
        .from("activities")
        .select("activity_type, created_at, details")
        .eq("contact_id", contactId)
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(50);

      // Calculate journey metrics
      const journeyDays = contact
        ? Math.floor((Date.now() - new Date(contact.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const touchpoints = (activities || []).length;
      const channels = [...new Set((activities || []).map((a) => a.activity_type))];

      await supabase.from("feedback_outcomes").insert({
        user_id: userId,
        contact_id: contactId,
        outcome,
        deal_value: dealValue || 0,
        lost_reason: lostReason || null,
        lead_score_at_close: contact?.lead_score || 0,
        source: contact?.source || "unknown",
        enrichment_snapshot: contact?.enrichment_data || {},
        journey_metrics: {
          days_in_pipeline: journeyDays,
          total_touchpoints: touchpoints,
          channels_used: channels,
          activities_count: activities?.length || 0,
        },
      });

      // Update contact stage
      await supabase
        .from("contacts")
        .update({ deal_stage: outcome === "won" ? "won" : "lost" })
        .eq("id", contactId)
        .eq("user_id", userId);

      // Log activity
      await supabase.from("activities").insert({
        user_id: userId,
        contact_id: contactId,
        activity_type: `deal_${outcome}`,
        details: {
          deal_value: dealValue,
          lost_reason: lostReason,
          journey_days: journeyDays,
          touchpoints,
        },
      });
    });

    // If we have enough outcomes, trigger recalibration
    const shouldRecalibrate = await step.run("check-recalibration", async () => {
      const supabase = getAdmin();
      const { count } = await supabase
        .from("feedback_outcomes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Recalibrate after every 20 outcomes (or monthly cron)
      return (count || 0) % 20 === 0 && (count || 0) > 0;
    });

    if (shouldRecalibrate) {
      await step.sendEvent("trigger-recalibration", {
        name: "feedback/recalibrate",
        data: { userId },
      });
    }

    return { recorded: true, outcome, shouldRecalibrate };
  }
);

// ─── Recalibrate Scoring Weights ──────────────────────────────────────────

export const recalibrateScoring = inngest.createFunction(
  {
    id: "recalibrate-scoring",
    retries: 1,
  },
  [
    { event: "feedback/recalibrate" },
    { cron: "0 3 1 * *" }, // 1st of every month at 3 AM
  ],
  async ({ step }) => {
    // Get all outcomes from last 90 days across all users
    const outcomes = await step.run("fetch-outcomes", async () => {
      const supabase = getAdmin();
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const { data } = await supabase
        .from("feedback_outcomes")
        .select("*")
        .gte("created_at", ninetyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(500);

      return data || [];
    });

    if (outcomes.length < 10) {
      return { recalibrated: false, reason: "insufficient_data", outcomeCount: outcomes.length };
    }

    // Analyze patterns: which lead scores actually predicted wins?
    const analysis = await step.run("analyze-patterns", async () => {
      const won = outcomes.filter((o) => o.outcome === "won");
      const lost = outcomes.filter((o) => o.outcome === "lost");

      // Score distribution for wins vs losses
      const avgWinScore = won.length > 0
        ? won.reduce((sum, o) => sum + (o.lead_score_at_close || 0), 0) / won.length
        : 0;
      const avgLoseScore = lost.length > 0
        ? lost.reduce((sum, o) => sum + (o.lead_score_at_close || 0), 0) / lost.length
        : 0;

      // Source effectiveness
      const sourceWins: Record<string, { won: number; lost: number }> = {};
      for (const o of outcomes) {
        const source = o.source || "unknown";
        if (!sourceWins[source]) sourceWins[source] = { won: 0, lost: 0 };
        sourceWins[source][o.outcome as "won" | "lost"]++;
      }

      // Average deal value
      const avgDealValue = won.length > 0
        ? won.reduce((sum, o) => sum + (o.deal_value || 0), 0) / won.length
        : 0;

      // Journey metrics for winners
      const avgWinJourneyDays = won.length > 0
        ? won.reduce((sum, o) => sum + (o.journey_metrics?.days_in_pipeline || 0), 0) / won.length
        : 0;

      // Win rate
      const winRate = outcomes.length > 0 ? (won.length / outcomes.length) * 100 : 0;

      // Lost reasons breakdown
      const lostReasons: Record<string, number> = {};
      for (const o of lost) {
        const reason = o.lost_reason || "unknown";
        lostReasons[reason] = (lostReasons[reason] || 0) + 1;
      }

      return {
        totalOutcomes: outcomes.length,
        winRate: Math.round(winRate * 10) / 10,
        avgWinScore: Math.round(avgWinScore),
        avgLoseScore: Math.round(avgLoseScore),
        scoreSeparation: Math.round(avgWinScore - avgLoseScore),
        sourceEffectiveness: sourceWins,
        avgDealValue: Math.round(avgDealValue),
        avgWinJourneyDays: Math.round(avgWinJourneyDays),
        topLostReasons: lostReasons,
      };
    });

    // Store recalibration results
    await step.run("store-recalibration", async () => {
      const supabase = getAdmin();
      await supabase.from("scoring_calibrations").insert({
        analysis,
        recommendations: {
          score_threshold_qualified: Math.max(30, analysis.avgLoseScore + 10),
          score_threshold_hot: Math.max(60, analysis.avgWinScore - 15),
          best_sources: Object.entries(analysis.sourceEffectiveness)
            .filter(([, v]) => v.won > v.lost)
            .map(([k]) => k),
          avg_pipeline_days: analysis.avgWinJourneyDays,
        },
        outcome_count: outcomes.length,
      });
    });

    return {
      recalibrated: true,
      analysis: {
        outcomes: analysis.totalOutcomes,
        winRate: analysis.winRate,
        scoreSeparation: analysis.scoreSeparation,
        avgDealValue: analysis.avgDealValue,
      },
    };
  }
);

// ─── Track Agent Performance ──────────────────────────────────────────────

export const trackAgentPerformance = inngest.createFunction(
  {
    id: "track-agent-performance",
    retries: 1,
  },
  { cron: "0 4 * * 0" }, // Every Sunday at 4 AM
  async ({ step }) => {
    // Compute per-agent stats for the past week
    const stats = await step.run("compute-agent-stats", async () => {
      const supabase = getAdmin();
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get call outcomes
      const { data: calls } = await supabase
        .from("ai_calls")
        .select("agent_id, outcome, score, duration, cost_breakdown, user_id")
        .gte("created_at", oneWeekAgo)
        .not("outcome", "is", null);

      // Get outreach outcomes
      const { data: outreach } = await supabase
        .from("outreach_enrollments")
        .select("user_id, status, created_at")
        .gte("created_at", oneWeekAgo);

      // Aggregate by agent
      const agentStats: Record<string, {
        totalCalls: number;
        avgScore: number;
        outcomes: Record<string, number>;
        totalCost: number;
        avgDuration: number;
      }> = {};

      for (const call of calls || []) {
        const agentId = call.agent_id || "unknown";
        if (!agentStats[agentId]) {
          agentStats[agentId] = { totalCalls: 0, avgScore: 0, outcomes: {}, totalCost: 0, avgDuration: 0 };
        }
        const s = agentStats[agentId];
        s.totalCalls++;
        s.avgScore = ((s.avgScore * (s.totalCalls - 1)) + (call.score || 50)) / s.totalCalls;
        s.outcomes[call.outcome] = (s.outcomes[call.outcome] || 0) + 1;
        s.totalCost += (call.cost_breakdown as { total?: number })?.total || 0;
        s.avgDuration = ((s.avgDuration * (s.totalCalls - 1)) + (call.duration || 0)) / s.totalCalls;
      }

      return {
        agentStats,
        totalOutreachEnrollments: (outreach || []).length,
        outreachCompleted: (outreach || []).filter((o) => o.status === "completed").length,
        outreachReplied: (outreach || []).filter((o) => o.status === "replied").length,
      };
    });

    // Store weekly snapshot
    await step.run("store-snapshot", async () => {
      const supabase = getAdmin();
      await supabase.from("agent_performance_snapshots").insert({
        period: "weekly",
        week_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        stats,
      });
    });

    return { tracked: true, agents: Object.keys(stats.agentStats).length };
  }
);
