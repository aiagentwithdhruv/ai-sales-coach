import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { getUsageSummary } from "@/lib/usage";

const json = { "Content-Type": "application/json" };

// GET /api/usage — Get current month's usage summary
export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
  }

  const summary = await getUsageSummary(auth.userId);
  return new Response(JSON.stringify(summary), { status: 200, headers: json });
}
