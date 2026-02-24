import { NextRequest } from "next/server";
import { authenticateUser, getContact } from "@/lib/crm/contacts";
import { inngest } from "@/inngest/client";

const jsonHeaders = { "Content-Type": "application/json" };

/**
 * POST /api/leads/route — Manually trigger lead routing for a contact
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

  // Check contact exists and has qualification data
  const contact = await getContact(auth.userId, contactId);
  if (!contact) {
    return new Response(
      JSON.stringify({ error: "Contact not found" }),
      { status: 404, headers: jsonHeaders }
    );
  }

  const customFields = (contact.custom_fields || {}) as Record<string, unknown>;
  const qualStatus = customFields.qualification_status as string | undefined;

  if (qualStatus !== "qualified") {
    return new Response(
      JSON.stringify({
        error: "Contact must be qualified before routing",
        qualification_status: qualStatus || "none",
      }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const bant = (customFields.qualification_bant || {}) as Record<string, number>;

  await inngest.send({
    name: "lead/qualified",
    data: {
      contactId,
      userId: auth.userId,
      outcome: "qualified",
      bant: {
        budget: bant.budget || 50,
        authority: bant.authority || 50,
        need: bant.need || 50,
        timeline: bant.timeline || 50,
        competition: bant.competition || 50,
      },
      notes: (customFields.qualification_notes as string) || "Manual routing trigger",
    },
  });

  return new Response(
    JSON.stringify({ success: true, message: "Routing triggered" }),
    { headers: jsonHeaders }
  );
}
