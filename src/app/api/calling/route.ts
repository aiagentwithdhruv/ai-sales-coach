import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { getCalls, getCallDashboardStats } from "@/lib/crm/calling";

const jsonHeaders = { "Content-Type": "application/json" };

// GET /api/calling — Get calls + dashboard stats
export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }

  const campaignId = req.nextUrl.searchParams.get("campaignId") || undefined;
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
  const statsOnly = req.nextUrl.searchParams.get("statsOnly") === "true";

  if (statsOnly) {
    const stats = await getCallDashboardStats(auth.userId);
    return new Response(JSON.stringify(stats), { headers: jsonHeaders });
  }

  const [result, stats] = await Promise.all([
    getCalls(auth.userId, { campaignId, limit }),
    getCallDashboardStats(auth.userId),
  ]);

  return new Response(JSON.stringify({ ...result, stats }), { headers: jsonHeaders });
}
