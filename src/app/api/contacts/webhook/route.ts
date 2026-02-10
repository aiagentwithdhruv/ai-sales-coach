import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createContact } from "@/lib/crm/contacts";
import { logActivity } from "@/lib/crm/activities";
import type { ContactCreateInput } from "@/types/crm";
import crypto from "crypto";

const jsonHeaders = { "Content-Type": "application/json" };

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/**
 * Generate a webhook key for a user (deterministic based on user_id + secret)
 */
function generateWebhookKey(userId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "quotahit-webhook";
  return crypto
    .createHmac("sha256", secret)
    .update(userId)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Verify webhook authentication
 * Supports: Bearer token, X-API-Key header, or ?key= query param
 */
async function authenticateWebhook(
  req: NextRequest
): Promise<{ userId: string } | { error: string; status: number }> {
  // Method 1: Bearer token (same as normal auth)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const supabase = getAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      return { userId: user.id };
    }
  }

  // Method 2: API key via header or query param
  const apiKey = req.headers.get("x-api-key") || req.nextUrl.searchParams.get("key");
  const userId = req.nextUrl.searchParams.get("userId");

  if (apiKey && userId) {
    const expectedKey = generateWebhookKey(userId);
    if (apiKey === expectedKey) {
      return { userId };
    }
    return { error: "Invalid API key", status: 401 };
  }

  return {
    error: "Authentication required. Use Bearer token, or X-API-Key header with ?userId= param.",
    status: 401,
  };
}

/**
 * Parse flexible field names from any source into ContactCreateInput
 * Supports: name/fullName/full_name, firstName/first_name, email, phone/telephone, etc.
 */
function parseLeadData(body: Record<string, unknown>): ContactCreateInput & { _source?: string } {
  // Normalize keys to lowercase
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value !== null && value !== undefined && value !== "") {
      data[key.toLowerCase().replace(/[-\s]/g, "_")] = String(value);
    }
  }

  // Parse name
  let firstName = data.first_name || data.firstname || data.fname || "";
  let lastName = data.last_name || data.lastname || data.lname || "";

  // If full name provided, split it
  const fullName = data.name || data.full_name || data.fullname || data.contact_name || "";
  if (fullName && !firstName) {
    const parts = fullName.trim().split(/\s+/);
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ") || "";
  }

  // Parse other fields
  const email = data.email || data.email_address || data.emailaddress || "";
  const phone = data.phone || data.telephone || data.phone_number || data.phonenumber || data.mobile || data.cell || "";
  const company = data.company || data.company_name || data.companyname || data.organization || data.org || "";
  const title = data.title || data.job_title || data.jobtitle || data.position || data.role || "";
  // Challenge/pain point (from lead forms)
  const challenge = data.challenge || data.business_challenge || data.pain_point || data.problem || "";
  const notes = data.notes || data.message || data.comment || data.comments || data.description || "";
  // Combine notes + challenge
  const combinedNotes = [notes, challenge ? `Challenge: ${challenge}` : ""].filter(Boolean).join("\n");
  const source = data.source || data.utm_source || data.lead_source || data._source || "webhook";

  // Tags from various sources
  const tagsRaw = data.tags || data.tag || data.labels || "";
  const tags: string[] = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  // Add source-specific tags
  if (challenge) tags.push(`challenge:${challenge.toLowerCase()}`);
  if (data.utm_campaign) tags.push(`campaign:${data.utm_campaign}`);
  if (data.utm_medium) tags.push(`medium:${data.utm_medium}`);
  if (data.form_name || data.formname) tags.push(`form:${data.form_name || data.formname}`);

  // Deal value
  const dealValue = parseFloat(data.deal_value || data.dealvalue || data.value || data.budget || "0") || 0;

  if (!firstName && !email && !phone) {
    throw new Error("At least one of: name, email, or phone is required");
  }

  return {
    first_name: firstName || "Unknown",
    last_name: lastName || undefined,
    email: email || undefined,
    phone: phone || undefined,
    company: company || undefined,
    title: title || undefined,
    notes: combinedNotes || undefined,
    source,
    tags: tags.length > 0 ? tags : ["webhook-lead"],
    deal_value: dealValue,
    deal_stage: "new",
    _source: source,
  };
}

/**
 * POST /api/contacts/webhook
 *
 * Public webhook for lead capture from any source:
 * - Website forms
 * - n8n workflows
 * - Zapier / Make
 * - Custom integrations
 *
 * Auth: Bearer token, X-API-Key header, or ?key= query param
 *
 * Flexible field mapping — accepts any of these field names:
 * - Name: name, full_name, first_name, last_name
 * - Email: email, email_address
 * - Phone: phone, telephone, mobile, cell
 * - Company: company, organization
 * - Title: title, job_title, position, role
 * - Notes: notes, message, comment
 * - Challenge: challenge, business_challenge, pain_point, problem
 * - Source: source, utm_source, lead_source
 * - Tags: tags (comma-separated)
 * - Value: deal_value, value, budget
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateWebhook(req);
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: { ...jsonHeaders, "Access-Control-Allow-Origin": "*" },
    });
  }

  let body: Record<string, unknown>;
  const contentType = req.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await req.json();
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body. Send JSON or form data." }),
      { status: 400, headers: jsonHeaders }
    );
  }

  // Support batch: if body has "leads" array, process multiple
  const leads = Array.isArray(body.leads) ? body.leads : [body];
  const results: Array<{ success: boolean; id?: string; name?: string; error?: string }> = [];

  for (const lead of leads) {
    try {
      const parsed = parseLeadData(lead as Record<string, unknown>);
      const { _source, ...contactInput } = parsed;

      const contact = await createContact(auth.userId, contactInput);

      if (contact) {
        // Log activity
        await logActivity(
          auth.userId,
          contact.id,
          "system",
          `Lead captured via ${_source || "webhook"}`,
          `New lead from ${_source || "webhook"}: ${contact.first_name} ${contact.last_name || ""}`.trim(),
          {
            source: _source || "webhook",
            raw_data: lead,
            captured_at: new Date().toISOString(),
          }
        );

        results.push({
          success: true,
          id: contact.id,
          name: `${contact.first_name} ${contact.last_name || ""}`.trim(),
        });
      } else {
        results.push({ success: false, error: "Failed to create contact" });
      }
    } catch (err) {
      results.push({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const allSuccess = results.every((r) => r.success);
  const created = results.filter((r) => r.success).length;

  return new Response(
    JSON.stringify({
      success: allSuccess,
      message: `${created}/${results.length} lead(s) created`,
      results,
    }),
    {
      status: allSuccess ? 201 : 207,
      headers: { ...jsonHeaders, "Access-Control-Allow-Origin": "*" },
    }
  );
}

/**
 * GET /api/contacts/webhook
 * Returns webhook info for the authenticated user (URL, key, docs)
 */
export async function GET(req: NextRequest) {
  // Only Bearer token auth for GET (to get your own webhook info)
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Bearer token required" }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const webhookKey = generateWebhookKey(user.id);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.quotahit.com";

  return new Response(
    JSON.stringify({
      webhook_url: `${baseUrl}/api/contacts/webhook?userId=${user.id}&key=${webhookKey}`,
      webhook_key: webhookKey,
      user_id: user.id,
      methods: {
        simple: {
          description: "Use the full URL with key (for forms, n8n, Zapier)",
          url: `${baseUrl}/api/contacts/webhook?userId=${user.id}&key=${webhookKey}`,
          method: "POST",
          content_type: "application/json",
        },
        api_key: {
          description: "Use X-API-Key header (for programmatic access)",
          url: `${baseUrl}/api/contacts/webhook?userId=${user.id}`,
          headers: { "X-API-Key": webhookKey, "Content-Type": "application/json" },
          method: "POST",
        },
        bearer: {
          description: "Use Bearer token (same as app auth)",
          url: `${baseUrl}/api/contacts/webhook`,
          headers: { Authorization: "Bearer <your-token>", "Content-Type": "application/json" },
          method: "POST",
        },
      },
      example_body: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        company: "Acme Corp",
        title: "VP Sales",
        source: "website-form",
        challenge: "Lead generation",
        notes: "Interested in enterprise plan",
        tags: "hot-lead,website",
      },
      example_batch: {
        leads: [
          { name: "John Doe", email: "john@example.com", company: "Acme" },
          { name: "Jane Smith", email: "jane@example.com", company: "BigCo" },
        ],
      },
      n8n_setup: {
        step_1: "Add an HTTP Request node",
        step_2: "Method: POST",
        step_3: `URL: ${baseUrl}/api/contacts/webhook?userId=${user.id}&key=${webhookKey}`,
        step_4: "Body Type: JSON",
        step_5: "Map your fields: name, email, phone, company, source",
      },
    }),
    { headers: jsonHeaders }
  );
}

/**
 * OPTIONS — CORS preflight for browser forms
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    },
  });
}
