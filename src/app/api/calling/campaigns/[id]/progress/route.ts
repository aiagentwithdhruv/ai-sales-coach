import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { getCampaignProgress } from "@/lib/calling/campaign-executor";

const jsonHeaders = { "Content-Type": "application/json" };

/**
 * GET /api/calling/campaigns/[id]/progress
 * Returns real-time progress of a campaign execution.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;

  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const progress = await getCampaignProgress(campaignId);

  if (!progress) {
    return new Response(JSON.stringify({ error: "Campaign not found" }), {
      status: 404,
      headers: jsonHeaders,
    });
  }

  return new Response(JSON.stringify(progress), {
    status: 200,
    headers: jsonHeaders,
  });
}
