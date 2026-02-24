import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { inngest } from "@/inngest/client";

const jsonHeaders = { "Content-Type": "application/json" };

/**
 * POST /api/leads/score — Manually trigger lead scoring for a contact
 * Body: { contactId: string }
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const { contactId } = await req.json();
  if (!contactId) {
    return new Response(
      JSON.stringify({ error: "contactId is required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  await inngest.send({
    name: "contact/created",
    data: {
      contactId,
      userId: auth.userId,
      source: "manual_rescore",
    },
  });

  return new Response(
    JSON.stringify({ success: true, message: "Scoring triggered" }),
    { headers: jsonHeaders }
  );
}
