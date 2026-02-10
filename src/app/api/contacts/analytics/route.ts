import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { getPipelineAnalytics } from "@/lib/crm/analytics";

const jsonHeaders = { "Content-Type": "application/json" };

// GET /api/contacts/analytics — Get full pipeline analytics
export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const analytics = await getPipelineAnalytics(auth.userId);

  return new Response(JSON.stringify(analytics), { headers: jsonHeaders });
}
