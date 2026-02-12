import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import {
  getSequence,
  updateSequence,
  deleteSequence,
  cancelMessage,
} from "@/lib/crm/follow-ups";

const json = { "Content-Type": "application/json" };

// GET /api/follow-ups/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
  }

  const sequence = await getSequence(auth.userId, id);
  if (!sequence) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: json });
  }
  return new Response(JSON.stringify({ sequence }), { status: 200, headers: json });
}

// PUT /api/follow-ups/[id] — Update sequence or cancel message
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

  // Cancel a message
  if (body.action === "cancel_message") {
    const success = await cancelMessage(auth.userId, id);
    return new Response(JSON.stringify({ success }), { status: 200, headers: json });
  }

  // Update sequence
  const sequence = await updateSequence(auth.userId, id, body);
  if (!sequence) {
    return new Response(JSON.stringify({ error: "Failed to update" }), { status: 500, headers: json });
  }
  return new Response(JSON.stringify({ sequence }), { status: 200, headers: json });
}

// DELETE /api/follow-ups/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
  }

  const success = await deleteSequence(auth.userId, id);
  if (!success) {
    return new Response(JSON.stringify({ error: "Failed to delete" }), { status: 500, headers: json });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200, headers: json });
}
