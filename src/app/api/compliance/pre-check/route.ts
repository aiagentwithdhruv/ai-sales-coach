import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { preCallCheck } from "@/lib/compliance";

const jsonHeaders = { "Content-Type": "application/json" };

// ---------------------------------------------------------------------------
// POST /api/compliance/pre-check
// Run pre-call compliance check for a contact
// Body: { contactId }
// Returns: { allowed, disclosureRequired, disclosureText, blockReasons }
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const body = await req.json();
  const { contactId } = body as { contactId?: string };

  if (!contactId) {
    return new Response(
      JSON.stringify({ error: "contactId is required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const result = await preCallCheck(auth.userId, contactId);

  return new Response(JSON.stringify(result), { headers: jsonHeaders });
}
