import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { getCampaign, updateCampaign, deleteCampaign } from "@/lib/crm/calling";

const jsonHeaders = { "Content-Type": "application/json" };

// GET /api/calling/campaigns/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }
  const { id } = await params;
  const campaign = await getCampaign(auth.userId, id);
  if (!campaign) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: jsonHeaders });
  }
  return new Response(JSON.stringify(campaign), { headers: jsonHeaders });
}

// PUT /api/calling/campaigns/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }
  const { id } = await params;
  const body = await req.json();
  const campaign = await updateCampaign(auth.userId, id, body);
  if (!campaign) {
    return new Response(JSON.stringify({ error: "Update failed" }), { status: 404, headers: jsonHeaders });
  }
  return new Response(JSON.stringify(campaign), { headers: jsonHeaders });
}

// DELETE /api/calling/campaigns/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }
  const { id } = await params;
  const success = await deleteCampaign(auth.userId, id);
  return new Response(JSON.stringify({ success }), { headers: jsonHeaders });
}
