/**
 * Zod Validation Schemas for API Routes
 *
 * Centralized input validation for all public-facing endpoints.
 * Import these schemas in route handlers and validate request bodies.
 */

import { z } from "zod";

// ─── Contacts ────────────────────────────────────────────────────────────────

const DEAL_STAGES = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

export const createContactSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional(),
  email: z.string().email().max(300).optional(),
  phone: z.string().max(30).optional(),
  company: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
  deal_stage: z.enum(DEAL_STAGES).optional(),
  deal_value: z.number().min(0).max(999_999_999).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  source: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
  linkedin_url: z.string().url().max(500).optional(),
  website: z.string().url().max(500).optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const contactFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  stage: z.enum([...DEAL_STAGES, "all"]).optional(),
  sort: z.enum(["created_at", "updated_at", "deal_value", "first_name"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

// ─── ICP ─────────────────────────────────────────────────────────────────────

export const icpUpdateSchema = z.object({
  product_description: z.string().max(2000).optional(),
  target_customer: z.string().max(2000).optional(),
  website_url: z.string().url().max(500).or(z.literal("")).optional(),
  industry: z.string().max(200).optional(),
  company_size: z.string().max(100).optional(),
  deal_size: z.string().max(100).optional(),
  channels: z.array(z.enum(["email", "phone", "whatsapp", "linkedin", "sms"])).optional(),
  icp_template_id: z.string().uuid().optional(),
});

// ─── Scout ───────────────────────────────────────────────────────────────────

export const scoutDiscoverSchema = z.object({
  count: z.number().int().min(1).max(50).optional().default(10),
  product_description: z.string().max(500).optional(),
  target_customer: z.string().max(500).optional(),
  website_url: z.string().max(200).optional(),
});

// ─── Developer API Keys ──────────────────────────────────────────────────────

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  environment: z.enum(["live", "test"]).optional().default("test"),
  scopes: z.array(z.string().max(50)).max(20).optional(),
  ipWhitelist: z.array(z.string().regex(/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^[0-9a-fA-F:]+$/)).max(50).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

// ─── White-Label ─────────────────────────────────────────────────────────────

export const whiteLabelConfigSchema = z.object({
  enabled: z.boolean().optional(),
  brand_name: z.string().min(1).max(200).optional(),
  logo_url: z.string().url().max(500).nullable().optional(),
  favicon_url: z.string().url().max(500).nullable().optional(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  custom_domain: z.string().max(253).nullable().optional(),
  custom_email_domain: z.string().max(253).nullable().optional(),
  support_email: z.string().email().max(300).nullable().optional(),
  support_url: z.string().url().max(500).nullable().optional(),
  hide_powered_by: z.boolean().optional(),
  custom_css: z.string().max(10000).nullable().optional(),
  footer_text: z.string().max(500).nullable().optional(),
  onboarding_message: z.string().max(2000).nullable().optional(),
});

export const addAgencyClientSchema = z.object({
  action: z.literal("add_client"),
  name: z.string().min(1).max(200),
  email: z.string().email().max(300),
  monthlyFee: z.number().min(0).max(100000).optional(),
  commissionPercent: z.number().int().min(0).max(100).optional(),
});

// ─── Admin ───────────────────────────────────────────────────────────────────

export const activatePlanSchema = z.object({
  user_id: z.string().uuid(),
  tier: z.enum(["starter", "growth", "enterprise"]).optional(),
  valid_until: z.string().datetime().optional(),
});

export const quickActivateSchema = z.object({
  email: z.string().email().max(300),
  valid_until: z.string().datetime().optional(),
});

export const impersonateSchema = z.object({
  email: z.string().email().max(300),
});

// ─── Hot Lead Notification ───────────────────────────────────────────────────

export const hotLeadSchema = z.object({
  contactId: z.string().uuid().optional(),
  name: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  score: z.number().int().min(0).max(100).optional(),
  reason: z.string().max(500).optional(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = { success: false; error: string; response: Response };

/**
 * Validate a request body against a Zod schema.
 * Returns { success: true, data } on success or { success: false, error, response } on failure.
 */
export function validateBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): ValidationSuccess<T> | ValidationFailure {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`
    );
    return {
      success: false,
      error: issues.join("; "),
      response: new Response(
        JSON.stringify({
          error: "Validation failed",
          details: issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }
  return { success: true, data: result.data };
}
