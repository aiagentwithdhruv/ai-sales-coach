/**
 * Quotation Follow-Up API Route
 *
 * Creates notification tickets for quotation follow-up reminders.
 * When a user sets a follow-up date on a quotation, this creates
 * a notification entry that will appear in their notification center.
 */

import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { createNotification } from "@/lib/crm/notifications";

const jsonHeaders = { "Content-Type": "application/json" };

export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const body = await req.json();
  const {
    referenceNumber,
    clientName,
    company,
    followUpDate,
    notes,
    total,
    contactId,
  }: {
    referenceNumber: string;
    clientName: string;
    company?: string;
    followUpDate: string;
    notes?: string;
    total?: number;
    contactId?: string;
  } = body;

  if (!referenceNumber || !clientName || !followUpDate) {
    return new Response(
      JSON.stringify({ error: "referenceNumber, clientName, and followUpDate are required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const followUpDateObj = new Date(followUpDate);
  const isOverdue = followUpDateObj < new Date();
  const type = isOverdue ? "follow_up_overdue" : "follow_up_due";
  const severity = isOverdue ? "warning" : "info";

  const totalStr = total ? ` ($${total.toLocaleString()})` : "";
  const companyStr = company ? ` at ${company}` : "";

  const notification = await createNotification(auth.userId, type as "follow_up_due" | "follow_up_overdue", `Quotation follow-up: ${clientName}${companyStr}${totalStr}`, {
    description: notes
      ? `${referenceNumber} — ${notes}`
      : `Follow up on quotation ${referenceNumber}`,
    severity,
    contactId,
    actionUrl: `/dashboard/quotations?ref=${referenceNumber}`,
    metadata: {
      quotationRef: referenceNumber,
      clientName,
      company,
      followUpDate,
      total,
    },
  });

  if (!notification) {
    return new Response(
      JSON.stringify({ error: "Failed to create follow-up notification" }),
      { status: 500, headers: jsonHeaders }
    );
  }

  return new Response(
    JSON.stringify({ success: true, notification }),
    { headers: jsonHeaders }
  );
}
