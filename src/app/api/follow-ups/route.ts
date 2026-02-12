import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import {
  getSequences,
  createSequence,
  getPendingMessages,
  getMessageHistory,
  sendDueMessages,
} from "@/lib/crm/follow-ups";

const json = { "Content-Type": "application/json" };

// GET /api/follow-ups?type=sequences|messages|pending
export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
  }

  const type = req.nextUrl.searchParams.get("type") || "sequences";

  if (type === "sequences") {
    const sequences = await getSequences(auth.userId);
    return new Response(JSON.stringify({ sequences }), { status: 200, headers: json });
  }

  if (type === "pending") {
    const messages = await getPendingMessages(auth.userId);
    return new Response(JSON.stringify({ messages }), { status: 200, headers: json });
  }

  if (type === "messages") {
    const contactId = req.nextUrl.searchParams.get("contactId") || undefined;
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");
    const messages = await getMessageHistory(auth.userId, { contactId, limit });
    return new Response(JSON.stringify({ messages }), { status: 200, headers: json });
  }

  return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400, headers: json });
}

// POST /api/follow-ups — Create sequence or trigger send
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
  }

  const body = await req.json();
  const action = body.action || "create";

  if (action === "create") {
    const { name, trigger, steps } = body;
    if (!name || !trigger || !steps) {
      return new Response(JSON.stringify({ error: "name, trigger, and steps are required" }), { status: 400, headers: json });
    }
    const sequence = await createSequence(auth.userId, { name, trigger, steps });
    if (!sequence) {
      return new Response(JSON.stringify({ error: "Failed to create sequence" }), { status: 500, headers: json });
    }
    return new Response(JSON.stringify({ sequence }), { status: 201, headers: json });
  }

  if (action === "send_due") {
    // Trigger sending all due messages (can be called by cron)
    const result = await sendDueMessages();
    return new Response(JSON.stringify(result), { status: 200, headers: json });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: json });
}
