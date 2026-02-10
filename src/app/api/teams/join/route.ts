import { NextRequest } from "next/server";
import { authenticateUser, joinTeamByCode } from "@/lib/crm/teams";

const jsonHeaders = { "Content-Type": "application/json" };

// POST /api/teams/join — Join a team by invite code
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }

  const body = await req.json();
  if (!body.invite_code || !body.display_name) {
    return new Response(
      JSON.stringify({ error: "invite_code and display_name required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const member = await joinTeamByCode(auth.userId, body.invite_code, body.display_name);
  if (!member) {
    return new Response(
      JSON.stringify({ error: "Invalid code or already a member" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  return new Response(JSON.stringify(member), { status: 201, headers: jsonHeaders });
}
