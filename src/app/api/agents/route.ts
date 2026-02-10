import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { getAgents, createAgent } from "@/lib/crm/agents";

const jsonHeaders = { "Content-Type": "application/json" };

// GET /api/agents — List all agents
export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }
  const agents = await getAgents(auth.userId);
  return new Response(JSON.stringify({ agents }), { headers: jsonHeaders });
}

// POST /api/agents — Create a new agent
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }

  const body = await req.json();
  if (!body.name) {
    return new Response(JSON.stringify({ error: "name is required" }), { status: 400, headers: jsonHeaders });
  }

  const agent = await createAgent(auth.userId, body);
  if (!agent) {
    return new Response(JSON.stringify({ error: "Failed to create agent" }), { status: 500, headers: jsonHeaders });
  }

  return new Response(JSON.stringify(agent), { status: 201, headers: jsonHeaders });
}
