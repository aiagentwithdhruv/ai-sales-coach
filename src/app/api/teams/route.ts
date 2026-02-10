import { NextRequest } from "next/server";
import { authenticateUser, createTeam, getUserTeams } from "@/lib/crm/teams";

const jsonHeaders = { "Content-Type": "application/json" };

// GET /api/teams — List user's teams
export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }
  const teams = await getUserTeams(auth.userId);
  return new Response(JSON.stringify({ teams }), { headers: jsonHeaders });
}

// POST /api/teams — Create a team
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }
  const body = await req.json();
  if (!body.name) {
    return new Response(JSON.stringify({ error: "Team name required" }), { status: 400, headers: jsonHeaders });
  }
  const team = await createTeam(auth.userId, body);
  if (!team) {
    return new Response(JSON.stringify({ error: "Failed to create team" }), { status: 500, headers: jsonHeaders });
  }
  return new Response(JSON.stringify(team), { status: 201, headers: jsonHeaders });
}
