/**
 * Zoho CRM API Client
 *
 * Uses Self-Client OAuth flow for server-to-server auth.
 * Supports: lead fetching, status updates, notes, and contact mapping.
 *
 * Required env vars:
 *   ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_API_DOMAIN
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Token Cache ────────────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Exchange refresh_token for a short-lived access_token.
 * Tokens are cached for 50 minutes (Zoho issues 60-min tokens).
 */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const accountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || "https://accounts.zoho.com";

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Zoho credentials not configured. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN.");
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const res = await fetch(`${accountsDomain}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zoho token refresh failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(`Zoho OAuth error: ${data.error}`);
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + 50 * 60 * 1000, // 50 minutes
  };

  return cachedToken.token;
}

// ─── API Helpers ────────────────────────────────────────────────────────────

function getApiDomain(): string {
  return process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.com";
}

async function zohoFetch(
  path: string,
  opts?: { method?: string; body?: Record<string, unknown> | { data: unknown[] }; headers?: Record<string, string> }
): Promise<unknown> {
  const token = await getAccessToken();
  const url = `${getApiDomain()}${path}`;

  const res = await fetch(url, {
    method: opts?.method || "GET",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
      ...(opts?.headers || {}),
    },
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zoho API error (${res.status}): ${text}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Lead Types ─────────────────────────────────────────────────────────────

export interface ZohoLead {
  id: string;
  First_Name: string | null;
  Last_Name: string;
  Email: string | null;
  Phone: string | null;
  Mobile: string | null;
  Company: string | null;
  Lead_Status: string | null;
  Lead_Source: string | null;
  Title: string | null;
  Description: string | null;
  City: string | null;
  State: string | null;
  Country: string | null;
  Annual_Revenue: number | null;
  No_of_Employees: number | null;
  Owner: { id: string; name: string } | null;
  Created_Time: string;
  Modified_Time: string;
}

export interface ZohoListResponse {
  data: ZohoLead[];
  info: {
    per_page: number;
    count: number;
    page: number;
    more_records: boolean;
  };
}

// ─── Fetch Leads ────────────────────────────────────────────────────────────

export async function fetchLeads(filters?: {
  page?: number;
  perPage?: number;
  status?: string;
  modifiedSince?: string;
}): Promise<{ leads: ZohoLead[]; hasMore: boolean; total: number }> {
  const page = filters?.page || 1;
  const perPage = filters?.perPage || 200;

  let path = `/crm/v7/Leads?page=${page}&per_page=${perPage}&fields=First_Name,Last_Name,Email,Phone,Mobile,Company,Lead_Status,Lead_Source,Title,Description,City,State,Country,Annual_Revenue,No_of_Employees,Owner,Created_Time,Modified_Time`;

  if (filters?.modifiedSince) {
    // Zoho uses If-Modified-Since header for this
  }

  const result = (await zohoFetch(path)) as ZohoListResponse | null;

  if (!result || !result.data) {
    return { leads: [], hasMore: false, total: 0 };
  }

  return {
    leads: result.data,
    hasMore: result.info.more_records,
    total: result.info.count,
  };
}

/**
 * Fetch leads using COQL (CRM Object Query Language) for flexible filtering.
 * Example: "SELECT First_Name, Last_Name, Phone FROM Leads WHERE Lead_Status = 'New' AND Phone is not null"
 */
export async function fetchLeadsByCoql(query: string): Promise<ZohoLead[]> {
  const result = (await zohoFetch("/crm/v7/coql", {
    method: "POST",
    body: { select_query: query },
  })) as { data: ZohoLead[] } | null;

  return result?.data || [];
}

// ─── Update Lead Status ─────────────────────────────────────────────────────

export async function updateLeadStatus(
  leadId: string,
  status: string
): Promise<boolean> {
  const result = (await zohoFetch(`/crm/v7/Leads`, {
    method: "PUT",
    body: {
      data: [{ id: leadId, Lead_Status: status }],
    },
  })) as { data: Array<{ code: string; status: string }> } | null;

  return result?.data?.[0]?.status === "success";
}

// ─── Create Note on Lead ────────────────────────────────────────────────────

export async function createNote(
  leadId: string,
  title: string,
  content: string
): Promise<boolean> {
  const result = (await zohoFetch(`/crm/v7/Leads/${leadId}/Notes`, {
    method: "POST",
    body: {
      data: [{ Note_Title: title, Note_Content: content }],
    },
  })) as { data: Array<{ code: string; status: string }> } | null;

  return result?.data?.[0]?.status === "success";
}

// ─── Map Zoho Lead → QuotaHit Contact ───────────────────────────────────────

interface QuotaHitContact {
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  deal_stage: string;
  lead_score: number;
  source: string;
  tags: string[];
  notes: string | null;
  external_id: string;
  external_provider: string;
}

const ZOHO_STATUS_TO_STAGE: Record<string, string> = {
  "New": "new",
  "Not Contacted": "new",
  "Attempted to Contact": "contacted",
  "Contacted": "contacted",
  "Contact in Future": "contacted",
  "Contacted - Interested": "qualified",
  "Junk Lead": "lost",
  "Lost Lead": "lost",
  "Not Interested": "lost",
  "Pre-Qualified": "qualified",
  "Qualified": "qualified",
  "Meeting Scheduled": "proposal",
  "Closed Won": "won",
  "Closed Lost": "lost",
};

export function mapZohoLeadToContact(lead: ZohoLead): QuotaHitContact {
  const phone = lead.Phone || lead.Mobile || null;
  const stage = ZOHO_STATUS_TO_STAGE[lead.Lead_Status || ""] || "new";

  const tags: string[] = [];
  if (lead.Lead_Source) tags.push(lead.Lead_Source);
  if (lead.City) tags.push(lead.City);

  return {
    first_name: lead.First_Name || lead.Last_Name || "Unknown",
    last_name: lead.First_Name ? lead.Last_Name : null,
    email: lead.Email,
    phone,
    company: lead.Company,
    title: lead.Title,
    deal_stage: stage,
    lead_score: stage === "qualified" ? 60 : stage === "contacted" ? 40 : 20,
    source: "zoho",
    tags,
    notes: lead.Description,
    external_id: lead.id,
    external_provider: "zoho",
  };
}

// ─── Call Outcome → Zoho Status Mapping ─────────────────────────────────────

const OUTCOME_TO_ZOHO_STATUS: Record<string, string> = {
  interested: "Contacted - Interested",
  meeting_booked: "Meeting Scheduled",
  callback_scheduled: "Contact in Future",
  not_interested: "Not Interested",
  no_answer: "Attempted to Contact",
  voicemail: "Attempted to Contact",
  wrong_number: "Junk Lead",
};

/**
 * After an AI call completes, push the result back to Zoho:
 * 1. Update Lead_Status based on call outcome
 * 2. Add a Note with the call summary
 */
export async function updateZohoAfterCall(
  contactId: string,
  callOutcome: string,
  callSummary: string,
  callDuration?: number
): Promise<{ statusUpdated: boolean; noteCreated: boolean }> {
  const supabase = getAdmin();

  // Look up the contact to get external_id
  const { data: contact } = await supabase
    .from("contacts")
    .select("external_id, external_provider, first_name, last_name")
    .eq("id", contactId)
    .single();

  if (!contact || contact.external_provider !== "zoho" || !contact.external_id) {
    return { statusUpdated: false, noteCreated: false };
  }

  const zohoStatus = OUTCOME_TO_ZOHO_STATUS[callOutcome];
  let statusUpdated = false;
  let noteCreated = false;

  // Update lead status
  if (zohoStatus) {
    statusUpdated = await updateLeadStatus(contact.external_id, zohoStatus);
  }

  // Create a note with call summary
  if (callSummary) {
    const contactName = `${contact.first_name} ${contact.last_name || ""}`.trim();
    const durationStr = callDuration ? `${Math.floor(callDuration / 60)}m ${callDuration % 60}s` : "N/A";
    const noteTitle = `AI Call — ${callOutcome.replace(/_/g, " ")} (${durationStr})`;
    const noteContent = `Call Outcome: ${callOutcome.replace(/_/g, " ")}\nDuration: ${durationStr}\nContact: ${contactName}\n\n${callSummary}`;

    noteCreated = await createNote(contact.external_id, noteTitle, noteContent);
  }

  return { statusUpdated, noteCreated };
}

// ─── Sync Leads to QuotaHit ─────────────────────────────────────────────────

export interface SyncResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  total: number;
}

export async function syncZohoLeads(
  userId: string,
  syncConfig?: { status?: string; phoneOnly?: boolean; limit?: number }
): Promise<SyncResult> {
  const supabase = getAdmin();
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: 0, total: 0 };

  // Build COQL query for filtered sync
  let query = "SELECT First_Name, Last_Name, Email, Phone, Mobile, Company, Lead_Status, Lead_Source, Title, Description, City, State, Country, Annual_Revenue, No_of_Employees, Created_Time, Modified_Time FROM Leads";

  const conditions: string[] = [];
  if (syncConfig?.phoneOnly !== false) {
    conditions.push("(Phone is not null OR Mobile is not null)");
  }
  if (syncConfig?.status && syncConfig.status !== "all") {
    conditions.push(`Lead_Status = '${syncConfig.status}'`);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  const limit = syncConfig?.limit || 200;
  query += ` LIMIT ${limit}`;

  let leads: ZohoLead[];
  try {
    leads = await fetchLeadsByCoql(query);
  } catch {
    // Fallback to REST API if COQL fails
    const fetched = await fetchLeads({ perPage: limit });
    leads = fetched.leads;
    // Filter manually
    if (syncConfig?.phoneOnly !== false) {
      leads = leads.filter((l) => l.Phone || l.Mobile);
    }
    if (syncConfig?.status && syncConfig.status !== "all") {
      leads = leads.filter((l) => l.Lead_Status === syncConfig.status);
    }
  }

  result.total = leads.length;

  for (const lead of leads) {
    const mapped = mapZohoLeadToContact(lead);

    if (!mapped.phone && !mapped.email) {
      result.skipped++;
      continue;
    }

    try {
      // Check if contact with this external_id already exists
      const { data: existing } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", userId)
        .eq("external_provider", "zoho")
        .eq("external_id", lead.id)
        .maybeSingle();

      if (existing) {
        // Update existing contact
        await supabase
          .from("contacts")
          .update({
            first_name: mapped.first_name,
            last_name: mapped.last_name,
            email: mapped.email,
            phone: mapped.phone,
            company: mapped.company,
            title: mapped.title,
            deal_stage: mapped.deal_stage,
            tags: mapped.tags,
            source: "zoho",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        result.updated++;
      } else {
        // Insert new contact
        await supabase
          .from("contacts")
          .insert({
            user_id: userId,
            first_name: mapped.first_name,
            last_name: mapped.last_name,
            email: mapped.email,
            phone: mapped.phone,
            company: mapped.company,
            title: mapped.title,
            deal_stage: mapped.deal_stage,
            lead_score: mapped.lead_score,
            source: "zoho",
            tags: mapped.tags,
            notes: mapped.notes,
            external_id: mapped.external_id,
            external_provider: mapped.external_provider,
          });

        result.imported++;
      }
    } catch {
      result.errors++;
    }
  }

  return result;
}
