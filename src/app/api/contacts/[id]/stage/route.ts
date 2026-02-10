import { NextRequest } from "next/server";
import { authenticateUser, updateDealStage } from "@/lib/crm/contacts";
import { logStageChange } from "@/lib/crm/activities";
import { DEAL_STAGES, type DealStage } from "@/types/crm";

const jsonHeaders = { "Content-Type": "application/json" };

// PUT /api/contacts/:id/stage — Change deal stage
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const { id } = await params;
  const body = await req.json();

  if (!body.stage || !DEAL_STAGES.includes(body.stage)) {
    return new Response(
      JSON.stringify({
        error: "Invalid stage. Must be one of: " + DEAL_STAGES.join(", "),
      }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const newStage = body.stage as DealStage;
  const { contact, previousStage } = await updateDealStage(
    auth.userId,
    id,
    newStage
  );

  if (!contact) {
    return new Response(
      JSON.stringify({ error: "Contact not found or update failed" }),
      { status: 404, headers: jsonHeaders }
    );
  }

  // Log stage change activity
  if (previousStage && previousStage !== newStage) {
    await logStageChange(auth.userId, id, previousStage, newStage);
  }

  return new Response(JSON.stringify(contact), { headers: jsonHeaders });
}
