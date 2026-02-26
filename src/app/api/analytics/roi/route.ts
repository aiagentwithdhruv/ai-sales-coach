/**
 * ROI Analytics API
 *
 * GET /api/analytics/roi?period=month|quarter|year
 *
 * Returns commission report + ROI metrics for the current user.
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateCommissionReport, calculateROIMetrics } from "@/lib/analytics/commission-engine";

export const runtime = "nodejs";

const json = { "Content-Type": "application/json" };

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: json,
      });
    }

    const supabase = getAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (error || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: json,
      });
    }

    // Determine period
    const periodParam = req.nextUrl.searchParams.get("period") || "month";
    const now = new Date();
    let start: Date;

    switch (periodParam) {
      case "quarter":
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case "month":
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const period = {
      start: start.toISOString(),
      end: now.toISOString(),
    };

    const [commission, roi] = await Promise.all([
      generateCommissionReport(user.id, period),
      calculateROIMetrics(user.id, period),
    ]);

    return new Response(
      JSON.stringify({ commission, roi, period: periodParam }),
      { headers: json }
    );
  } catch (error) {
    console.error("[ROI Analytics] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to calculate ROI",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: json }
    );
  }
}
