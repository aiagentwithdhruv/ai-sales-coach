import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { getAgent, updateAgent, deleteAgent } from "@/lib/crm/agents";

const jsonHeaders = { "Content-Type": "application/json" };

// GET /api/agents/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }
  const { id } = await params;
  const agent = await getAgent(auth.userId, id);
  if (!agent) {
    return new Response(JSON.stringify({ error: "Agent not found" }), { status: 404, headers: jsonHeaders });
  }
  return new Response(JSON.stringify(agent), { headers: jsonHeaders });
}

// PUT /api/agents/:id
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
  const agent = await updateAgent(auth.userId, id, body);
  if (!agent) {
    return new Response(JSON.stringify({ error: "Update failed" }), { status: 404, headers: jsonHeaders });
  }
  return new Response(JSON.stringify(agent), { headers: jsonHeaders });
}

// DELETE /api/agents/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }
  const { id } = await params;
  const success = await deleteAgent(auth.userId, id);
  return new Response(JSON.stringify({ success }), { headers: jsonHeaders });
}
