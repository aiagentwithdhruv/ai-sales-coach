/**
 * Sales Agent Tool Definitions — Tier-Based
 *
 * 5 tools for the pricing page sales agent:
 * 1. get_pricing_info — tier pricing lookup (Starter/Growth/Enterprise)
 * 2. generate_checkout_link — Stripe checkout for a specific tier
 * 3. apply_discount — create Stripe promo codes
 * 4. notify_team — alert via n8n webhook
 * 5. get_visitor_context — load returning visitor memory
 */

import { tool } from "ai";
// Use zod v3 compat — Vercel AI SDK's zod-to-json-schema doesn't support zod v4 schemas
import { z as zv3 } from "zod/v3";
const z = zv3 as any;
import {
  TIERS,
  ALL_TIER_SLUGS,
  AGENT_DESCRIPTIONS,
  BILLING_DISCOUNTS,
  FREE_LIMITS,
  TRIAL_DURATION_DAYS,
  getDiscountedPrice,
  type TierSlug,
  type BillingInterval,
} from "@/lib/pricing";
import Stripe from "stripe";
import { stripe, getTierPriceId } from "@/lib/stripe";
import { createDiscountCode, type DiscountType } from "@/lib/agent/discount-engine";
import { buildVisitorContextString, upsertVisitorMemory } from "@/lib/agent/visitor-memory";
import { updateConversation } from "@/lib/agent/conversation-tracker";

export function getSalesAgentTools(visitorId: string, conversationId?: string) {
  return {
    get_pricing_info: tool({
      description:
        "Get pricing details for QuotaHit tiers (Starter, Growth, Enterprise), free trial info, or compare all plans. Use when visitor asks about pricing.",
      parameters: z.object({
        query_type: z
          .enum(["tier", "all", "compare", "free_trial", "agents"])
          .describe("What pricing info to retrieve"),
        tier_slug: z
          .enum(["starter", "growth", "enterprise"])
          .optional()
          .describe("Specific tier to look up (for tier query)"),
        billing_interval: z
          .enum(["monthly", "quarterly", "yearly"])
          .optional()
          .describe("Billing interval for price calculation"),
      }),
      execute: async ({ query_type, tier_slug, billing_interval }) => {
        const interval: BillingInterval = billing_interval || "monthly";

        if (query_type === "tier" && tier_slug) {
          const t = TIERS[tier_slug as TierSlug];
          const price = getDiscountedPrice(t.monthlyPrice, interval);
          return {
            name: t.name,
            tagline: t.tagline,
            monthly_price: t.monthlyPrice,
            discounted_price: price,
            interval,
            contact_limit: t.contactLimit,
            agent_count: t.agentCount,
            agents: t.agents,
            features: t.features,
            cta: t.cta,
            popular: t.popular || false,
          };
        }

        if (query_type === "free_trial") {
          return {
            price: "$0 for 14 days",
            trial_days: TRIAL_DURATION_DAYS,
            limits_after_trial: FREE_LIMITS,
            note: "Full access to all features during trial. No credit card required to start.",
          };
        }

        if (query_type === "agents") {
          return {
            total_agents: 7,
            agents: AGENT_DESCRIPTIONS,
            starter_agents: TIERS.starter.agents,
            growth_agents: TIERS.growth.agents,
          };
        }

        if (query_type === "compare") {
          return {
            tiers: ALL_TIER_SLUGS.map((slug) => {
              const t = TIERS[slug];
              return {
                name: t.name,
                price: `$${getDiscountedPrice(t.monthlyPrice, interval)}/mo`,
                contact_limit: t.contactLimit,
                agents: `${t.agentCount} agents`,
                popular: t.popular || false,
              };
            }),
            billing_discounts: {
              quarterly: `${BILLING_DISCOUNTS.quarterly.discount}% off`,
              yearly: `${BILLING_DISCOUNTS.yearly.discount}% off`,
            },
            competitor_comparison: {
              "11x.ai": "$800-1,500/mo (prospecting only)",
              "Artisan AI": "$2,000/mo (outreach only)",
              QuotaHit: "$297-1,497/mo (full pipeline: find → qualify → close)",
            },
          };
        }

        // "all" — return everything
        return {
          tiers: ALL_TIER_SLUGS.map((slug) => {
            const t = TIERS[slug];
            return {
              slug,
              name: t.name,
              tagline: t.tagline,
              price: `$${t.monthlyPrice}/mo`,
              features: t.features,
              agents: t.agents,
              popular: t.popular || false,
            };
          }),
          free_trial: { days: TRIAL_DURATION_DAYS, limits: FREE_LIMITS },
          billing: BILLING_DISCOUNTS,
        };
      },
    }),

    generate_checkout_link: tool({
      description:
        "Generate a Stripe checkout link for a specific tier. Use when the visitor is ready to buy. Always confirm tier and billing interval first.",
      parameters: z.object({
        tier: z
          .enum(["starter", "growth"])
          .describe("Tier to checkout (enterprise requires demo call)"),
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
      execute: async ({ tier, billing_interval, promo_code, email }) => {
        try {
          if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
            return {
              success: false,
              error: "Stripe not configured yet. Please contact our team to complete your purchase.",
              fallback_url: "https://www.quotahit.com/pricing",
            };
          }

          const tierSlug = tier as TierSlug;
          const interval = billing_interval as BillingInterval;
          const priceId = getTierPriceId(tierSlug, interval);

          if (!priceId) {
            return {
              success: false,
              error: `${TIERS[tierSlug].name} pricing is being set up. Contact us for a direct link.`,
            };
          }

          const origin = process.env.NEXT_PUBLIC_APP_URL || "https://www.quotahit.com";

          const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [{ price: priceId, quantity: 1 }],
            subscription_data: {
              trial_period_days: TRIAL_DURATION_DAYS,
              metadata: {
                source: "sales_agent",
                visitor_id: visitorId,
                tier: tierSlug,
                interval,
              },
            },
            metadata: {
              source: "sales_agent",
              visitor_id: visitorId,
              tier: tierSlug,
              interval,
            },
            success_url: `${origin}/dashboard?checkout=success&source=agent`,
            cancel_url: `${origin}/pricing?checkout=cancel`,
          };

          if (email) {
            sessionParams.customer_email = email;
          }

          if (promo_code) {
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

          const t = TIERS[tierSlug];
          return {
            success: true,
            checkout_url: session.url,
            total: `$${getDiscountedPrice(t.monthlyPrice, interval)}/mo`,
            tier: t.name,
            interval,
            trial: `${TRIAL_DURATION_DAYS}-day free trial included`,
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
        tier_interested: z
          .enum(["starter", "growth", "enterprise"])
          .optional()
          .describe("Which tier they showed interest in"),
      }),
      execute: async ({
        notification_type,
        visitor_name,
        visitor_email,
        company,
        team_size,
        summary,
        tier_interested,
      }) => {
        // Update visitor memory with collected info
        await upsertVisitorMemory(visitorId, {
          name: visitor_name,
          email: visitor_email,
          company,
          team_size,
          tier_interested,
        });

        // Update conversation
        if (conversationId) {
          await updateConversation(conversationId, {
            email_collected: visitor_email,
            name_collected: visitor_name,
            company_collected: company,
            team_size,
            tier_interested,
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
                tier_interested: tier_interested || "unknown",
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

    save_visitor_info: tool({
      description:
        "Save visitor details (name, phone, email, company, etc.) to memory for future conversations. Use IMMEDIATELY when the visitor shares any personal info — don't wait until the end.",
      parameters: z.object({
        name: z.string().optional().describe("Visitor's name"),
        phone: z.string().optional().describe("Visitor's phone number"),
        email: z.string().optional().describe("Visitor's email address"),
        company: z.string().optional().describe("Company name"),
        team_size: z.string().optional().describe("Team size (e.g., '5', '10-20', 'solo')"),
        industry: z.string().optional().describe("Industry/vertical (e.g., 'SaaS', 'Real Estate')"),
        current_tools: z
          .array(z.string())
          .optional()
          .describe("Sales tools they currently use (e.g., ['Gong', 'HubSpot'])"),
        objections: z
          .array(z.string())
          .optional()
          .describe("Objections raised (e.g., ['too expensive', 'need to think'])"),
        tier_interested: z
          .enum(["starter", "growth", "enterprise"])
          .optional()
          .describe("Which tier they showed interest in"),
        summary: z
          .string()
          .optional()
          .describe("Brief summary of this conversation for next time"),
      }),
      execute: async ({
        name,
        phone,
        email,
        company,
        team_size,
        industry,
        current_tools,
        objections,
        tier_interested,
        summary,
      }: {
        name?: string;
        phone?: string;
        email?: string;
        company?: string;
        team_size?: string;
        industry?: string;
        current_tools?: string[];
        objections?: string[];
        tier_interested?: string;
        summary?: string;
      }) => {
        const updates: Record<string, unknown> = {};
        if (name) updates.name = name;
        if (phone) updates.phone = phone;
        if (email) updates.email = email;
        if (company) updates.company = company;
        if (team_size) updates.team_size = team_size;
        if (industry) updates.industry = industry;
        if (current_tools) updates.current_tools = current_tools;
        if (objections) updates.all_objections = objections;
        if (tier_interested) updates.tier_interested = tier_interested;
        if (summary) updates.summary = summary;

        await upsertVisitorMemory(visitorId, updates as any);

        // Also update conversation record
        if (conversationId) {
          await updateConversation(conversationId, {
            name_collected: name,
            email_collected: email,
            company_collected: company,
            team_size,
            tier_interested,
          });
        }

        return {
          success: true,
          saved_fields: Object.keys(updates),
        };
      },
    }),
  };
}
