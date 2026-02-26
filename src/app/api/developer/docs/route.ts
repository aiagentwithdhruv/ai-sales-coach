/**
 * Developer API Documentation
 *
 * GET /api/developer/docs
 *
 * Returns the OpenAPI-style documentation for the QuotaHit Public API.
 * No authentication required.
 */

export const runtime = "nodejs";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://quotahit.com";

const API_DOCS = {
  openapi: "3.0.0",
  info: {
    title: "QuotaHit Public API",
    version: "1.0.0",
    description:
      "The QuotaHit API lets you integrate your AI sales department with any tool. Manage contacts, trigger campaigns, fetch analytics, and more.",
    contact: { email: "api@quotahit.com", url: `${BASE_URL}` },
  },
  servers: [{ url: `${BASE_URL}/api`, description: "Production" }],
  security: [
    { apiKey: [] },
    { bearerAuth: [] },
  ],
  components: {
    securitySchemes: {
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "X-Api-Key",
        description: "Your QuotaHit API key (qh_live_... or qh_test_...)",
      },
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "Supabase JWT token",
      },
    },
  },
  paths: {
    "/contacts": {
      get: {
        summary: "List contacts",
        description: "Retrieve all contacts in your CRM with optional filters.",
        tags: ["Contacts"],
        parameters: [
          { name: "stage", in: "query", schema: { type: "string" }, description: "Filter by deal stage" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by name, email, or company" },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 }, description: "Max results" },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
        ],
        responses: {
          "200": { description: "List of contacts" },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        summary: "Create a contact",
        description: "Add a new contact to your CRM.",
        tags: ["Contacts"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["first_name"],
                properties: {
                  first_name: { type: "string" },
                  last_name: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  company: { type: "string" },
                  title: { type: "string" },
                  deal_stage: { type: "string", enum: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"] },
                  deal_value: { type: "number" },
                  tags: { type: "array", items: { type: "string" } },
                  source: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Contact created" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/contacts/{id}": {
      get: {
        summary: "Get contact details",
        tags: ["Contacts"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Contact details" } },
      },
      patch: {
        summary: "Update a contact",
        tags: ["Contacts"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Contact updated" } },
      },
      delete: {
        summary: "Delete a contact",
        tags: ["Contacts"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Contact deleted" } },
      },
    },
    "/scout/discover": {
      post: {
        summary: "Discover leads with AI",
        description: "Use AI to generate leads matching your ICP. Leads are automatically saved to your CRM.",
        tags: ["Scout AI"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  count: { type: "integer", minimum: 1, maximum: 50, default: 10, description: "Number of leads to discover" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Leads discovered and saved" },
          "400": { description: "ICP not configured" },
          "402": { description: "Usage limit reached" },
        },
      },
    },
    "/ai/command": {
      post: {
        summary: "AI Sales Assistant",
        description: "Send messages to your AI sales assistant. Returns a streaming response.",
        tags: ["AI"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["messages"],
                properties: {
                  messages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        role: { type: "string", enum: ["user", "assistant"] },
                        content: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Streaming AI response" },
        },
      },
    },
    "/analytics/roi": {
      get: {
        summary: "Get ROI metrics",
        description: "Returns commission report and ROI metrics.",
        tags: ["Analytics"],
        parameters: [
          { name: "period", in: "query", schema: { type: "string", enum: ["month", "quarter", "year"] } },
        ],
        responses: { "200": { description: "ROI data" } },
      },
    },
    "/analytics/attribution": {
      get: {
        summary: "Get agent attribution",
        description: "Returns deal attribution data showing which AI agents contributed to deals.",
        tags: ["Analytics"],
        parameters: [
          { name: "contactId", in: "query", schema: { type: "string" }, description: "Get attribution for specific contact" },
          { name: "period", in: "query", schema: { type: "string", enum: ["month", "quarter", "year"] } },
        ],
        responses: { "200": { description: "Attribution data" } },
      },
      post: {
        summary: "Record agent touchpoint",
        description: "Record an AI agent interaction with a contact.",
        tags: ["Analytics"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["contact_id", "agent_type", "action"],
                properties: {
                  contact_id: { type: "string" },
                  agent_type: { type: "string", enum: ["scout", "researcher", "qualifier", "outreach", "caller", "closer", "ops", "manual"] },
                  action: { type: "string" },
                  metadata: { type: "object" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Touchpoint recorded" } },
      },
    },
    "/notifications/hot-lead": {
      post: {
        summary: "Send hot lead alert",
        description: "Dispatch a hot lead notification via Telegram and/or WhatsApp.",
        tags: ["Notifications"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  contactId: { type: "string" },
                  name: { type: "string" },
                  company: { type: "string" },
                  score: { type: "integer" },
                  reason: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Alert sent" } },
      },
    },
    "/icp": {
      get: {
        summary: "Get ICP settings",
        tags: ["Configuration"],
        responses: { "200": { description: "Current ICP configuration" } },
      },
      put: {
        summary: "Update ICP settings",
        tags: ["Configuration"],
        responses: { "200": { description: "ICP updated" } },
      },
    },
    "/developer/keys": {
      get: {
        summary: "List API keys",
        tags: ["Developer"],
        responses: { "200": { description: "List of API keys" } },
      },
      post: {
        summary: "Create API key",
        tags: ["Developer"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  environment: { type: "string", enum: ["live", "test"] },
                  scopes: { type: "array", items: { type: "string" } },
                  expiresInDays: { type: "integer" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "API key created (shown once)" } },
      },
      delete: {
        summary: "Revoke API key",
        tags: ["Developer"],
        parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Key revoked" } },
      },
    },
  },
};

export async function GET() {
  return new Response(JSON.stringify(API_DOCS, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
