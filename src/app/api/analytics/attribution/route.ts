/**
 * Deal Attribution API
 *
 * GET /api/analytics/attribution — Get agent performance summary
 * POST /api/analytics/attribution — Record a touchpoint
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getAgentPerformance,
  recordTouchpoint,
  calculateAttribution,
} from "@/lib/analytics/deal-attribution";

export const runtime = "nodejs";

const json = { "Content-Type": "application/json" };

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function authenticateUser(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const supabase = getAdmin();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (error || !user) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await authenticateUser(req.headers.get("authorization"));
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: json,
    });
  }

  try {
    const contactId = req.nextUrl.searchParams.get("contactId");

    if (contactId) {
      // Single deal attribution
      const attribution = await calculateAttribution(contactId, user.id);
      return new Response(JSON.stringify(attribution), { headers: json });
    }

    // Aggregate agent performance
    const periodParam = req.nextUrl.searchParams.get("period");
    let period: { start: string; end: string } | undefined;

    if (periodParam) {
      const now = new Date();
      const start = new Date(now);
      switch (periodParam) {
        case "month":
          start.setMonth(start.getMonth() - 1);
          break;
        case "quarter":
          start.setMonth(start.getMonth() - 3);
          break;
        case "year":
          start.setFullYear(start.getFullYear() - 1);
          break;
      }
      period = { start: start.toISOString(), end: now.toISOString() };
    }

    const performance = await getAgentPerformance(user.id, period);
    return new Response(JSON.stringify(performance), { headers: json });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to get attribution data",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: json }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await authenticateUser(req.headers.get("authorization"));

  // Also allow internal service calls
  const internalSecret = req.headers.get("x-internal-secret");
  const isInternal = internalSecret === process.env.CRON_SECRET;

  if (!user && !isInternal) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: json,
    });
  }

  try {
    const body = await req.json();
    const { contact_id, agent_type, action, metadata, user_id } = body;

    if (!contact_id || !agent_type || !action) {
      return new Response(
        JSON.stringify({
          error: "contact_id, agent_type, and action are required",
        }),
        { status: 400, headers: json }
      );
    }

    await recordTouchpoint({
      contact_id,
      user_id: user?.id || user_id,
      agent_type,
      action,
      metadata,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: json }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to record touchpoint",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: json }
    );
  }
}
