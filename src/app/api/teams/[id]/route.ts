import { NextRequest } from "next/server";
import {
  authenticateUser,
  getTeam,
  deleteTeam,
  getTeamMembers,
  getTeamStats,
  isTeamMember,
} from "@/lib/crm/teams";

const jsonHeaders = { "Content-Type": "application/json" };

// GET /api/teams/:id — Get team details + members + stats
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }
  const { id } = await params;

  const member = await isTeamMember(id, auth.userId);
  if (!member) {
    return new Response(JSON.stringify({ error: "Not a team member" }), { status: 403, headers: jsonHeaders });
  }

  const [team, members, stats] = await Promise.all([
    getTeam(id),
    getTeamMembers(id),
    getTeamStats(id),
  ]);

  if (!team) {
    return new Response(JSON.stringify({ error: "Team not found" }), { status: 404, headers: jsonHeaders });
  }

  return new Response(JSON.stringify({ team, members, stats }), { headers: jsonHeaders });
}

// DELETE /api/teams/:id — Delete team (owner only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }
  const { id } = await params;
  const success = await deleteTeam(id, auth.userId);
  return new Response(JSON.stringify({ success }), { headers: jsonHeaders });
}
