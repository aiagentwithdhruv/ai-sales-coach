import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import {
  getPhoneNumber,
  assignNumberToAgent,
  toggleNumberActive,
  releaseNumber,
} from "@/lib/crm/phone-numbers";

const json = { "Content-Type": "application/json" };

// GET /api/phone-numbers/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
  }

  const number = await getPhoneNumber(auth.userId, id);
  if (!number) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: json });
  }
  return new Response(JSON.stringify({ number }), { status: 200, headers: json });
}

// PUT /api/phone-numbers/[id] — Update (assign agent, toggle active)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
  }

  const body = await req.json();

  // Assign to agent
  if ("assigned_agent_id" in body) {
    const number = await assignNumberToAgent(auth.userId, id, body.assigned_agent_id);
    if (!number) {
      return new Response(JSON.stringify({ error: "Failed to update" }), { status: 500, headers: json });
    }
    return new Response(JSON.stringify({ number }), { status: 200, headers: json });
  }

  // Toggle active
  if ("is_active" in body) {
    const number = await toggleNumberActive(auth.userId, id, body.is_active);
    if (!number) {
      return new Response(JSON.stringify({ error: "Failed to update" }), { status: 500, headers: json });
    }
    return new Response(JSON.stringify({ number }), { status: 200, headers: json });
  }

  return new Response(JSON.stringify({ error: "No valid update fields" }), { status: 400, headers: json });
}

// DELETE /api/phone-numbers/[id] — Release number
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
  }

  const success = await releaseNumber(auth.userId, id);
  if (!success) {
    return new Response(JSON.stringify({ error: "Failed to release number" }), { status: 500, headers: json });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200, headers: json });
}
