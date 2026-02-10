import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { getCampaigns, createCampaign } from "@/lib/crm/calling";

const jsonHeaders = { "Content-Type": "application/json" };

// GET /api/calling/campaigns
export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }
  const campaigns = await getCampaigns(auth.userId);
  return new Response(JSON.stringify({ campaigns }), { headers: jsonHeaders });
}

// POST /api/calling/campaigns
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }
  const body = await req.json();
  if (!body.name || !body.type) {
    return new Response(JSON.stringify({ error: "name and type required" }), { status: 400, headers: jsonHeaders });
  }
  const campaign = await createCampaign(auth.userId, body);
  if (!campaign) {
    return new Response(JSON.stringify({ error: "Failed to create campaign" }), { status: 500, headers: jsonHeaders });
  }
  return new Response(JSON.stringify(campaign), { status: 201, headers: jsonHeaders });
}
