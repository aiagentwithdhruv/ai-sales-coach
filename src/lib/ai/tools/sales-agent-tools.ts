/**
 * Sales Agent Tool Definitions
 *
 * 5 tools for the pricing page sales agent:
 * 1. get_pricing_info — module/bundle pricing lookup
 * 2. generate_checkout_link — Stripe checkout without auth
 * 3. apply_discount — create Stripe promo codes
 * 4. notify_team — alert via n8n webhook
 * 5. get_visitor_context — load returning visitor memory
 */

import { tool } from "ai";
// Use zod v3 compat — Vercel AI SDK's zod-to-json-schema doesn't support zod v4 schemas
import { z as zv3 } from "zod/v3";
const z = zv3 as any;
import {
  MODULES,
  BUNDLE,
  BILLING_DISCOUNTS,
  FREE_LIMITS,
  ALL_MODULE_SLUGS,
  getDiscountedPrice,
  calculateModulesPrice,
  isBundleCheaper,
  type ModuleSlug,
  type BillingInterval,
} from "@/lib/pricing";
import Stripe from "stripe";
import { stripe, MODULE_PRICES } from "@/lib/stripe";
import { createDiscountCode, type DiscountType } from "@/lib/agent/discount-engine";
import { buildVisitorContextString, upsertVisitorMemory } from "@/lib/agent/visitor-memory";
import { updateConversation } from "@/lib/agent/conversation-tracker";

export function getSalesAgentTools(visitorId: string, conversationId?: string) {
  return {
    get_pricing_info: tool({
      description:
        "Get pricing details for specific modules, the bundle, or billing intervals. Use when visitor asks about pricing.",
      parameters: z.object({
        query_type: z
          .enum(["module", "bundle", "all", "compare", "free_tier"])
          .describe("What pricing info to retrieve"),
        module_slug: z
          .enum(["coaching", "crm", "calling", "followups", "analytics"])
          .optional()
          .describe("Specific module to look up (for module query)"),
        billing_interval: z
          .enum(["monthly", "quarterly", "yearly"])
          .optional()
          .describe("Billing interval for price calculation"),
      }),
      execute: async ({ query_type, module_slug, billing_interval }) => {
        const interval: BillingInterval = billing_interval || "monthly";

        if (query_type === "module" && module_slug) {
          const m = MODULES[module_slug as ModuleSlug];
          const price = getDiscountedPrice(m.monthlyPrice, interval);
          return {
            name: m.name,
            monthly_price: m.monthlyPrice,
            discounted_price: price,
            interval,
            features: m.features,
            competitor_price: m.marketPrice,
            savings_vs_competitor: `${Math.round((1 - m.monthlyPrice / m.marketPrice) * 100)}%`,
          };
        }

        if (query_type === "bundle") {
          const price = getDiscountedPrice(BUNDLE.monthlyPrice, interval);
          return {
            name: BUNDLE.name,
            monthly_price: BUNDLE.monthlyPrice,
            discounted_price: price,
            interval,
            individual_total: BUNDLE.individualTotal,
            savings: `${BUNDLE.savings}%`,
            includes: ALL_MODULE_SLUGS.map((s) => MODULES[s].name),
          };
        }

        if (query_type === "free_tier") {
          return {
            price: "$0/mo",
            limits: FREE_LIMITS,
            note: "All features accessible with usage limits. No credit card required.",
          };
        }

        if (query_type === "compare") {
          return {
            modules: ALL_MODULE_SLUGS.map((s) => ({
              name: MODULES[s].name,
              price: `$${getDiscountedPrice(MODULES[s].monthlyPrice, interval)}/mo`,
              competitor: `$${MODULES[s].marketPrice}/mo`,
            })),
            bundle: {
              price: `$${getDiscountedPrice(BUNDLE.monthlyPrice, interval)}/mo`,
              savings: `${BUNDLE.savings}%`,
            },
            billing_discounts: {
              quarterly: `${BILLING_DISCOUNTS.quarterly.discount}% off`,
              yearly: `${BILLING_DISCOUNTS.yearly.discount}% off`,
            },
          };
        }

        // "all" — return everything
        return {
          modules: ALL_MODULE_SLUGS.map((s) => ({
            slug: s,
            name: MODULES[s].name,
            price: `$${MODULES[s].monthlyPrice}/mo`,
            features: MODULES[s].features,
          })),
          bundle: {
            price: `$${BUNDLE.monthlyPrice}/mo`,
            savings: `${BUNDLE.savings}%`,
          },
          free_tier: FREE_LIMITS,
          billing: BILLING_DISCOUNTS,
        };
      },
    }),

    generate_checkout_link: tool({
      description:
        "Generate a Stripe checkout link for the visitor. Use when they're ready to buy. Always confirm modules and billing interval first.",
      parameters: z.object({
        modules: z
          .array(z.enum(["coaching", "crm", "calling", "followups", "analytics", "bundle"]))
          .describe("Modules to include in checkout"),
        billing_interval: z
          .enum(["monthly", "quarterly", "yearly"])
          .default("monthly")
          .describe("Billing interval"),
        promo_code: z
          .string()
          .optional()
          .describe("Optional promo/discount code to apply"),
        email: z.string().optional().describe("Visitor email for checkout"),
      }),
      execute: async ({ modules, billing_interval, promo_code, email }) => {
        try {
          if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
            return {
              success: false,
              error: "Stripe not configured yet. Please contact our team to complete your purchase.",
              fallback_url: "https://www.quotahit.com/pricing",
            };
          }

          const lineItems: { price: string; quantity: number }[] = [];

          if (modules.includes("bundle")) {
            const bundlePrice = MODULE_PRICES.bundle.priceId;
            if (!bundlePrice) {
              return {
                success: false,
                error: "Bundle pricing is being set up. Contact us for a direct link.",
              };
            }
            lineItems.push({ price: bundlePrice, quantity: 1 });
          } else {
            for (const mod of modules) {
              if (mod === "bundle") continue;
              const config = MODULE_PRICES[mod as keyof typeof MODULE_PRICES];
              if (!config?.priceId) {
                return {
                  success: false,
                  error: `${mod} module pricing is being set up. Contact us for a direct link.`,
                };
              }
              lineItems.push({ price: config.priceId, quantity: 1 });
            }
          }

          if (lineItems.length === 0) {
            return { success: false, error: "No valid modules selected." };
          }

          const origin = process.env.NEXT_PUBLIC_APP_URL || "https://www.quotahit.com";

          const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: lineItems,
            metadata: {
              source: "sales_agent",
              visitor_id: visitorId,
              modules: modules.join(","),
              billing_interval,
            },
            success_url: `${origin}/dashboard?checkout=success&source=agent`,
            cancel_url: `${origin}/pricing?checkout=cancel`,
          };

          if (email) {
            sessionParams.customer_email = email;
          }

          if (promo_code) {
            // Look up the promo code in Stripe
            const promos = await stripe.promotionCodes.list({
              code: promo_code,
              active: true,
              limit: 1,
            });
            if (promos.data.length > 0) {
              sessionParams.discounts = [{ promotion_code: promos.data[0].id }];
            }
          }

          const session = await stripe.checkout.sessions.create(sessionParams);

          // Track in conversation
          if (conversationId) {
            await updateConversation(conversationId, {
              checkout_url: session.url || undefined,
              outcome: "checkout_generated",
            });
          }

          const total = modules.includes("bundle")
            ? BUNDLE.monthlyPrice
            : (modules as string[]).reduce(
                (sum: number, m: string) =>
                  sum + (MODULES[m as ModuleSlug]?.monthlyPrice || 0),
                0
              );

          return {
            success: true,
            checkout_url: session.url,
            total: `$${getDiscountedPrice(total, billing_interval as BillingInterval)}/mo`,
            modules: modules.join(", "),
            interval: billing_interval,
          };
        } catch (error) {
          console.error("[SalesAgent] Checkout error:", error);
          return {
            success: false,
            error: "Could not create checkout link. Please try again or visit our pricing page.",
          };
        }
      },
    }),

    apply_discount: tool({
      description:
        "Create a discount code for the visitor. Only use after a price objection — never offer discounts unprompted.",
      parameters: z.object({
        discount_type: z
          .enum(["social_share", "referral", "annual_commitment", "referral_plus_annual"])
          .describe(
            "Type of discount: social_share (5%), referral (10%), annual_commitment (20% built-in), referral_plus_annual (15%)"
          ),
      }),
      execute: async ({ discount_type }) => {
        const result = await createDiscountCode(
          visitorId,
          discount_type as DiscountType,
          conversationId
        );

        if (result.success && conversationId) {
          await updateConversation(conversationId, {
            discount_offered: result.percent,
            discount_type,
          });
        }

        return result;
      },
    }),

    notify_team: tool({
      description:
        "Notify the QuotaHit team about a hot lead, demo request, or enterprise inquiry. Use when visitor shares email or requests a demo.",
      parameters: z.object({
        notification_type: z
          .enum(["hot_lead", "demo_request", "enterprise_inquiry", "feedback"])
          .describe("Type of notification"),
        visitor_name: z.string().optional().describe("Visitor name if collected"),
        visitor_email: z.string().optional().describe("Visitor email if collected"),
        company: z.string().optional().describe("Company name if mentioned"),
        team_size: z.string().optional().describe("Team size if mentioned"),
        summary: z.string().describe("Brief summary of the conversation and what they need"),
        modules_interested: z
          .array(z.string())
          .optional()
          .describe("Which modules they showed interest in"),
      }),
      execute: async ({
        notification_type,
        visitor_name,
        visitor_email,
        company,
        team_size,
        summary,
        modules_interested,
      }) => {
        // Update visitor memory with collected info
        await upsertVisitorMemory(visitorId, {
          name: visitor_name,
          email: visitor_email,
          company,
          team_size,
          modules_interested: modules_interested as ModuleSlug[],
        });

        // Update conversation
        if (conversationId) {
          await updateConversation(conversationId, {
            email_collected: visitor_email,
            name_collected: visitor_name,
            company_collected: company,
            team_size,
            modules_interested: modules_interested as string[],
            outcome: notification_type,
          });
        }

        // Send to n8n webhook
        const webhookUrl = process.env.SALES_AGENT_WEBHOOK_URL;
        if (webhookUrl) {
          try {
            await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: notification_type,
                visitor_id: visitorId,
                name: visitor_name || "Anonymous",
                email: visitor_email || "Not provided",
                company: company || "Not provided",
                team_size: team_size || "Unknown",
                summary,
                modules_interested: modules_interested || [],
                timestamp: new Date().toISOString(),
                source: "quotahit_sales_agent",
              }),
            });
          } catch (e) {
            console.error("[SalesAgent] Webhook error:", e);
          }
        }

        return {
          success: true,
          message: `Team notified about ${notification_type.replace(/_/g, " ")}. ${
            visitor_email ? "We'll follow up via email." : "We'll keep an eye out."
          }`,
        };
      },
    }),

    get_visitor_context: tool({
      description:
        "Load context about a returning visitor from previous conversations. Use at the start of conversation to personalize the greeting.",
      parameters: z.object({
        reason: z
          .string()
          .describe("Why you're loading context (e.g., 'personalize greeting')"),
      }),
      execute: async () => {
        const context = await buildVisitorContextString(visitorId);
        return {
          has_history: !!context,
          context: context || "First-time visitor. No previous context available.",
        };
      },
    }),
  };
}
