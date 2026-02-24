// ============================================
// Compliance & Consent Library — QuotaHit
// ============================================
// TCPA consent tracking, DNC checks, audit logging,
// and pre-call compliance validation.

import { createClient } from "@supabase/supabase-js";

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** AI Disclosure text prepended to every AI-assisted call */
export const AI_CALL_DISCLOSURE =
  "This call may use AI technology to assist our conversation. By continuing, you consent to AI-assisted communication.";

/** Valid consent types */
export const CONSENT_TYPES = [
  "tcpa_call",
  "tcpa_sms",
  "email_marketing",
  "ai_disclosure",
] as const;

export type ConsentType = (typeof CONSENT_TYPES)[number];

/** Valid consent methods */
export const CONSENT_METHODS = [
  "web_form",
  "verbal",
  "written",
  "api",
  "import",
] as const;

export type ConsentMethod = (typeof CONSENT_METHODS)[number];

// ---------------------------------------------------------------------------
// Consent record shape (matches DB)
// ---------------------------------------------------------------------------

export interface ConsentRecord {
  id: string;
  user_id: string;
  contact_id: string;
  consent_type: ConsentType;
  consent_given: boolean;
  consent_method: ConsentMethod;
  ip_address: string | null;
  consent_text: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// hasConsent — check if a contact has active (non-revoked) consent
// ---------------------------------------------------------------------------

export async function hasConsent(
  contactId: string,
  consentType: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("consent_records")
    .select("id")
    .eq("contact_id", contactId)
    .eq("consent_type", consentType)
    .eq("consent_given", true)
    .is("revoked_at", null)
    .limit(1);

  if (error) {
    console.error("[Compliance] hasConsent error:", error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// getConsentRecords — fetch all consent records for a contact
// ---------------------------------------------------------------------------

export async function getConsentRecords(
  contactId: string
): Promise<ConsentRecord[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("consent_records")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Compliance] getConsentRecords error:", error);
    return [];
  }

  return (data ?? []) as ConsentRecord[];
}

// ---------------------------------------------------------------------------
// recordConsent — insert a new consent record
// ---------------------------------------------------------------------------

export async function recordConsent(params: {
  userId: string;
  contactId: string;
  consentType: string;
  consentGiven: boolean;
  consentMethod: string;
  consentText?: string;
  ipAddress?: string;
}): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("consent_records").insert({
    user_id: params.userId,
    contact_id: params.contactId,
    consent_type: params.consentType,
    consent_given: params.consentGiven,
    consent_method: params.consentMethod,
    consent_text: params.consentText ?? null,
    ip_address: params.ipAddress ?? null,
  });

  if (error) {
    console.error("[Compliance] recordConsent error:", error);
    return false;
  }

  // Audit trail
  await logAudit({
    userId: params.userId,
    contactId: params.contactId,
    action: "consent_recorded",
    outcome: "success",
    details: {
      consent_type: params.consentType,
      consent_given: params.consentGiven,
      consent_method: params.consentMethod,
    },
    ipAddress: params.ipAddress,
  });

  return true;
}

// ---------------------------------------------------------------------------
// revokeConsent — mark active consent records as revoked
// ---------------------------------------------------------------------------

export async function revokeConsent(
  contactId: string,
  consentType: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("consent_records")
    .update({ revoked_at: new Date().toISOString() })
    .eq("contact_id", contactId)
    .eq("consent_type", consentType)
    .eq("consent_given", true)
    .is("revoked_at", null);

  if (error) {
    console.error("[Compliance] revokeConsent error:", error);
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// checkDNC — evaluate Do-Not-Call / Do-Not-Email / SMS for a contact
// ---------------------------------------------------------------------------

export async function checkDNC(
  userId: string,
  contactId: string
): Promise<{
  canCall: boolean;
  canEmail: boolean;
  canSMS: boolean;
  reasons: string[];
}> {
  const supabase = getSupabaseAdmin();
  const reasons: string[] = [];

  // 1. Check contact-level DNC flags
  const { data: contact, error: contactErr } = await supabase
    .from("contacts")
    .select("do_not_call, do_not_email")
    .eq("id", contactId)
    .eq("user_id", userId)
    .single();

  let canCall = true;
  let canEmail = true;
  let canSMS = true;

  if (contactErr || !contact) {
    // If we can't find the contact, block everything as a safety measure
    return {
      canCall: false,
      canEmail: false,
      canSMS: false,
      reasons: ["Contact not found or access denied"],
    };
  }

  if (contact.do_not_call) {
    canCall = false;
    reasons.push("Contact flagged as Do Not Call");
  }

  if (contact.do_not_email) {
    canEmail = false;
    reasons.push("Contact flagged as Do Not Email");
  }

  // 2. Check TCPA consent records
  const hasTcpaCall = await hasConsent(contactId, "tcpa_call");
  if (!hasTcpaCall) {
    canCall = false;
    reasons.push("No active TCPA call consent");
  }

  const hasTcpaSms = await hasConsent(contactId, "tcpa_sms");
  if (!hasTcpaSms) {
    canSMS = false;
    reasons.push("No active TCPA SMS consent");
  }

  const hasEmailConsent = await hasConsent(contactId, "email_marketing");
  if (!hasEmailConsent) {
    canEmail = false;
    reasons.push("No active email marketing consent");
  }

  return { canCall, canEmail, canSMS, reasons };
}

// ---------------------------------------------------------------------------
// logAudit — insert an audit log entry
// ---------------------------------------------------------------------------

export async function logAudit(params: {
  userId: string;
  contactId?: string;
  agentName?: string;
  action: string;
  outcome: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("audit_log").insert({
    user_id: params.userId,
    contact_id: params.contactId ?? null,
    agent_name: params.agentName ?? null,
    action: params.action,
    outcome: params.outcome,
    details: params.details ?? {},
    ip_address: params.ipAddress ?? null,
  });

  if (error) {
    // Audit logging should never throw — log and move on
    console.error("[Compliance] logAudit error:", error);
  }
}

// ---------------------------------------------------------------------------
// preCallCheck — combined DNC + consent + disclosure check before a call
// ---------------------------------------------------------------------------

export async function preCallCheck(
  userId: string,
  contactId: string
): Promise<{
  allowed: boolean;
  disclosureRequired: boolean;
  disclosureText: string;
  blockReasons: string[];
}> {
  const blockReasons: string[] = [];

  // 1. Run DNC / consent checks
  const dnc = await checkDNC(userId, contactId);

  if (!dnc.canCall) {
    blockReasons.push(...dnc.reasons.filter((r) => r.toLowerCase().includes("call") || r.includes("Contact not found")));
  }

  // 2. Check AI disclosure consent
  const hasAiDisclosure = await hasConsent(contactId, "ai_disclosure");
  const disclosureRequired = !hasAiDisclosure;

  // 3. Log the compliance check in the audit trail
  const allowed = blockReasons.length === 0;

  await logAudit({
    userId,
    contactId,
    action: "pre_call_check",
    outcome: allowed ? "success" : "blocked",
    details: {
      canCall: dnc.canCall,
      canEmail: dnc.canEmail,
      canSMS: dnc.canSMS,
      disclosureRequired,
      blockReasons,
    },
  });

  return {
    allowed,
    disclosureRequired,
    disclosureText: AI_CALL_DISCLOSURE,
    blockReasons,
  };
}
