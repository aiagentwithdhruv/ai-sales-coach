import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import {
  getConsentRecords,
  recordConsent,
  revokeConsent,
  checkDNC,
  logAudit,
  CONSENT_TYPES,
  CONSENT_METHODS,
} from "@/lib/compliance";

const jsonHeaders = { "Content-Type": "application/json" };

// ---------------------------------------------------------------------------
// GET /api/compliance?contactId=xxx
// Returns consent records + DNC status for a contact
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const url = new URL(req.url);
  const contactId = url.searchParams.get("contactId");

  if (!contactId) {
    return new Response(
      JSON.stringify({ error: "contactId query parameter is required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const [records, dnc] = await Promise.all([
    getConsentRecords(contactId),
    checkDNC(auth.userId, contactId),
  ]);

  // Audit the lookup
  await logAudit({
    userId: auth.userId,
    contactId,
    action: "consent_lookup",
    outcome: "success",
  });

  return new Response(
    JSON.stringify({ consentRecords: records, dncStatus: dnc }),
    { headers: jsonHeaders }
  );
}

// ---------------------------------------------------------------------------
// POST /api/compliance
// Record consent: { contactId, consentType, consentGiven, consentMethod, consentText? }
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
  const { contactId, consentType, consentGiven, consentMethod, consentText } =
    body as {
      contactId?: string;
      consentType?: string;
      consentGiven?: boolean;
      consentMethod?: string;
      consentText?: string;
    };

  // Validate required fields
  if (!contactId) {
    return new Response(
      JSON.stringify({ error: "contactId is required" }),
      { status: 400, headers: jsonHeaders }
    );
  }
  if (!consentType || !(CONSENT_TYPES as readonly string[]).includes(consentType)) {
    return new Response(
      JSON.stringify({
        error: `consentType must be one of: ${CONSENT_TYPES.join(", ")}`,
      }),
      { status: 400, headers: jsonHeaders }
    );
  }
  if (typeof consentGiven !== "boolean") {
    return new Response(
      JSON.stringify({ error: "consentGiven (boolean) is required" }),
      { status: 400, headers: jsonHeaders }
    );
  }
  if (!consentMethod || !(CONSENT_METHODS as readonly string[]).includes(consentMethod)) {
    return new Response(
      JSON.stringify({
        error: `consentMethod must be one of: ${CONSENT_METHODS.join(", ")}`,
      }),
      { status: 400, headers: jsonHeaders }
    );
  }

  // Extract IP from request headers
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined;

  const ok = await recordConsent({
    userId: auth.userId,
    contactId,
    consentType,
    consentGiven,
    consentMethod,
    consentText,
    ipAddress,
  });

  if (!ok) {
    return new Response(
      JSON.stringify({ error: "Failed to record consent" }),
      { status: 500, headers: jsonHeaders }
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: "Consent recorded" }),
    { status: 201, headers: jsonHeaders }
  );
}

// ---------------------------------------------------------------------------
// DELETE /api/compliance
// Revoke consent: { contactId, consentType }
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const body = await req.json();
  const { contactId, consentType } = body as {
    contactId?: string;
    consentType?: string;
  };

  if (!contactId) {
    return new Response(
      JSON.stringify({ error: "contactId is required" }),
      { status: 400, headers: jsonHeaders }
    );
  }
  if (!consentType || !(CONSENT_TYPES as readonly string[]).includes(consentType)) {
    return new Response(
      JSON.stringify({
        error: `consentType must be one of: ${CONSENT_TYPES.join(", ")}`,
      }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const ok = await revokeConsent(contactId, consentType);

  if (!ok) {
    return new Response(
      JSON.stringify({ error: "Failed to revoke consent" }),
      { status: 500, headers: jsonHeaders }
    );
  }

  // Audit trail for revocation
  await logAudit({
    userId: auth.userId,
    contactId,
    action: "consent_revoked",
    outcome: "success",
    details: { consent_type: consentType },
  });

  return new Response(
    JSON.stringify({ success: true, message: "Consent revoked" }),
    { headers: jsonHeaders }
  );
}
