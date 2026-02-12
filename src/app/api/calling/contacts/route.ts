/**
 * Campaign Contact Import API
 *
 * POST: Import contacts from CSV data, Google Sheets, or CRM
 * GET: List contacts for a specific campaign
 *
 * Supports:
 * - CSV text (paste or file content)
 * - Google Sheets public URL (reads published sheets)
 * - CRM contact filter (pull from existing CRM contacts)
 */

import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { createClient } from "@supabase/supabase-js";

const jsonHeaders = { "Content-Type": "application/json" };

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

interface CampaignContact {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  contact_id?: string; // Link to CRM contact
}

/**
 * POST /api/calling/contacts
 * Import contacts for a campaign from various sources
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const body = await req.json();
  const { source, campaignId, data: importData } = body as {
    source: "csv" | "google_sheets" | "crm";
    campaignId: string;
    data: {
      csv?: string;
      sheetsUrl?: string;
      crmFilter?: { stage?: string; tags?: string[]; limit?: number };
    };
  };

  if (!campaignId) {
    return new Response(
      JSON.stringify({ error: "campaignId is required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  let contacts: CampaignContact[] = [];

  try {
    switch (source) {
      case "csv":
        contacts = parseCSV(importData.csv || "");
        break;

      case "google_sheets":
        contacts = await fetchGoogleSheet(importData.sheetsUrl || "");
        break;

      case "crm":
        contacts = await fetchCRMContacts(auth.userId, importData.crmFilter || {});
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid source. Use: csv, google_sheets, or crm" }),
          { status: 400, headers: jsonHeaders }
        );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Failed to import contacts",
        details: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 400, headers: jsonHeaders }
    );
  }

  // Validate — must have name and phone
  const validContacts = contacts.filter((c) => c.name && c.phone);

  if (validContacts.length === 0) {
    return new Response(
      JSON.stringify({
        error: "No valid contacts found. Each contact needs at least a name and phone number.",
        totalParsed: contacts.length,
      }),
      { status: 400, headers: jsonHeaders }
    );
  }

  // Save contacts to campaign contact list (stored in campaign settings)
  const supabase = getAdmin();

  // Get existing campaign
  const { data: campaign } = await supabase
    .from("ai_call_campaigns")
    .select("contact_list_filter, settings")
    .eq("id", campaignId)
    .eq("user_id", auth.userId)
    .single();

  if (!campaign) {
    return new Response(
      JSON.stringify({ error: "Campaign not found" }),
      { status: 404, headers: jsonHeaders }
    );
  }

  // Store contacts in contact_list_filter JSONB
  const existingContacts = (campaign.contact_list_filter as { contacts?: CampaignContact[] })?.contacts || [];
  const allContacts = [...existingContacts, ...validContacts];

  // Deduplicate by phone number
  const seen = new Set<string>();
  const deduped = allContacts.filter((c) => {
    const key = c.phone.replace(/\D/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  await supabase
    .from("ai_call_campaigns")
    .update({
      contact_list_filter: {
        ...(campaign.contact_list_filter as Record<string, unknown>),
        contacts: deduped,
        last_import: new Date().toISOString(),
        import_source: source,
      },
    })
    .eq("id", campaignId)
    .eq("user_id", auth.userId);

  return new Response(
    JSON.stringify({
      success: true,
      imported: validContacts.length,
      total: deduped.length,
      skippedInvalid: contacts.length - validContacts.length,
      skippedDuplicate: allContacts.length - deduped.length,
    }),
    { headers: jsonHeaders }
  );
}

/**
 * GET /api/calling/contacts?campaignId=xxx
 * Get contacts for a campaign
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const campaignId = req.nextUrl.searchParams.get("campaignId");
  if (!campaignId) {
    return new Response(
      JSON.stringify({ error: "campaignId query param required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const supabase = getAdmin();
  const { data: campaign } = await supabase
    .from("ai_call_campaigns")
    .select("contact_list_filter")
    .eq("id", campaignId)
    .eq("user_id", auth.userId)
    .single();

  if (!campaign) {
    return new Response(
      JSON.stringify({ error: "Campaign not found" }),
      { status: 404, headers: jsonHeaders }
    );
  }

  const contacts = (campaign.contact_list_filter as { contacts?: CampaignContact[] })?.contacts || [];

  return new Response(
    JSON.stringify({ contacts, total: contacts.length }),
    { headers: jsonHeaders }
  );
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

function parseCSV(csv: string): CampaignContact[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV needs a header row and at least one data row");

  const headers = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/"/g, ""));

  // Find column indices — flexible matching
  const nameIdx = headers.findIndex((h) => ["name", "full_name", "fullname", "contact_name", "contact"].includes(h));
  const phoneIdx = headers.findIndex((h) => ["phone", "phone_number", "phonenumber", "mobile", "cell", "tel", "telephone"].includes(h));
  const emailIdx = headers.findIndex((h) => ["email", "email_address", "emailaddress", "e-mail"].includes(h));
  const companyIdx = headers.findIndex((h) => ["company", "company_name", "companyname", "organization", "org"].includes(h));
  const notesIdx = headers.findIndex((h) => ["notes", "note", "comment", "comments", "description"].includes(h));
  // Also support first_name + last_name
  const firstNameIdx = headers.findIndex((h) => ["first_name", "firstname", "first"].includes(h));
  const lastNameIdx = headers.findIndex((h) => ["last_name", "lastname", "last", "surname"].includes(h));

  if (phoneIdx === -1) throw new Error("CSV must have a 'phone' column");
  if (nameIdx === -1 && firstNameIdx === -1) throw new Error("CSV must have a 'name' or 'first_name' column");

  return lines.slice(1).map((line) => {
    const cols = parseCSVLine(line);
    const name = nameIdx >= 0
      ? cols[nameIdx] || ""
      : `${cols[firstNameIdx] || ""} ${cols[lastNameIdx] || ""}`.trim();

    return {
      name,
      phone: cols[phoneIdx] || "",
      email: emailIdx >= 0 ? cols[emailIdx] : undefined,
      company: companyIdx >= 0 ? cols[companyIdx] : undefined,
      notes: notesIdx >= 0 ? cols[notesIdx] : undefined,
    };
  }).filter((c) => c.name && c.phone);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function fetchGoogleSheet(url: string): Promise<CampaignContact[]> {
  // Support various Google Sheets URL formats and convert to CSV export URL
  let csvUrl = "";

  if (url.includes("docs.google.com/spreadsheets")) {
    // Extract spreadsheet ID
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) throw new Error("Invalid Google Sheets URL");
    const sheetId = match[1];
    // Get the gid (sheet tab) if present
    const gidMatch = url.match(/gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : "0";
    csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  } else {
    throw new Error("Please provide a Google Sheets URL (docs.google.com/spreadsheets/d/...)");
  }

  const response = await fetch(csvUrl, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(
      "Failed to fetch Google Sheet. Make sure the sheet is shared as 'Anyone with the link can view'"
    );
  }

  const csv = await response.text();
  if (!csv || csv.includes("<!DOCTYPE html>")) {
    throw new Error(
      "Could not read sheet data. Make sure the Google Sheet is shared publicly (Anyone with the link → Viewer)"
    );
  }

  return parseCSV(csv);
}

async function fetchCRMContacts(
  userId: string,
  filter: { stage?: string; tags?: string[]; limit?: number }
): Promise<CampaignContact[]> {
  const supabase = getAdmin();

  let query = supabase
    .from("contacts")
    .select("id, first_name, last_name, phone, email, company, notes")
    .eq("user_id", userId)
    .not("phone", "is", null)
    .order("lead_score", { ascending: false })
    .limit(filter.limit || 100);

  if (filter.stage && filter.stage !== "all") {
    query = query.eq("deal_stage", filter.stage);
  }

  if (filter.tags && filter.tags.length > 0) {
    query = query.overlaps("tags", filter.tags);
  }

  const { data, error } = await query;

  if (error) throw new Error(`CRM query failed: ${error.message}`);

  return (data || []).map((c) => ({
    name: `${c.first_name} ${c.last_name || ""}`.trim(),
    phone: c.phone!,
    email: c.email || undefined,
    company: c.company || undefined,
    notes: c.notes || undefined,
    contact_id: c.id,
  }));
}
