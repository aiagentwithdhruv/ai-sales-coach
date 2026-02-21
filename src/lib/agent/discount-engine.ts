/**
 * Discount Engine for Sales Agent
 *
 * Creates and manages discount codes via Stripe.
 * Tracks discount offers in Supabase.
 */

import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

export type DiscountType = "social_share" | "referral" | "annual_commitment" | "referral_plus_annual";

export const DISCOUNT_RULES: Record<DiscountType, {
  percent: number;
  description: string;
  expiryHours: number;
  maxPerVisitor: number;
}> = {
  social_share: {
    percent: 5,
    description: "5% off for sharing QuotaHit on social media",
    expiryHours: 72,
    maxPerVisitor: 1,
  },
  referral: {
    percent: 10,
    description: "10% off for referring a friend who signs up",
    expiryHours: 72,
    maxPerVisitor: 3,
  },
  annual_commitment: {
    percent: 20,
    description: "20% off with yearly billing (already built into pricing)",
    expiryHours: 168,
    maxPerVisitor: 1,
  },
  referral_plus_annual: {
    percent: 15,
    description: "15% off for referral + annual commitment combo",
    expiryHours: 72,
    maxPerVisitor: 1,
  },
};

export async function createDiscountCode(
  visitorId: string,
  discountType: DiscountType,
  conversationId?: string
): Promise<{
  success: boolean;
  code?: string;
  percent?: number;
  expiresAt?: string;
  error?: string;
}> {
  const rule = DISCOUNT_RULES[discountType];

  // Annual commitment is already in billing intervals — no separate coupon needed
  if (discountType === "annual_commitment") {
    return {
      success: true,
      code: "YEARLY",
      percent: 20,
      expiresAt: new Date(Date.now() + rule.expiryHours * 3600000).toISOString(),
    };
  }

  try {
    const supabase = createAdminClient();

    // Check if visitor already has max discounts of this type
    const { count } = await supabase
      .from("agent_discount_codes")
      .select("*", { count: "exact", head: true })
      .eq("visitor_id", visitorId)
      .eq("discount_type", discountType)
      .eq("is_used", false);

    if (count && count >= rule.maxPerVisitor) {
      // Return existing unused code
      const { data: existing } = await supabase
        .from("agent_discount_codes")
        .select("stripe_promo_code, discount_percent, expires_at")
        .eq("visitor_id", visitorId)
        .eq("discount_type", discountType)
        .eq("is_used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        return {
          success: true,
          code: existing.stripe_promo_code,
          percent: existing.discount_percent,
          expiresAt: existing.expires_at,
        };
      }
    }

    // Create Stripe coupon
    const expiresAt = new Date(Date.now() + rule.expiryHours * 3600000);
    const coupon = await stripe.coupons.create({
      percent_off: rule.percent,
      duration: "once",
      name: `QuotaHit ${discountType.replace(/_/g, " ")} discount`,
      redeem_by: Math.floor(expiresAt.getTime() / 1000),
    });

    // Create promo code (Stripe v20: coupon goes under promotion object)
    const promoCode = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      code: `QH${discountType.toUpperCase().slice(0, 3)}${Date.now().toString(36).toUpperCase()}`,
      max_redemptions: 1,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    });

    // Store in Supabase
    await supabase.from("agent_discount_codes").insert({
      visitor_id: visitorId,
      conversation_id: conversationId || null,
      discount_type: discountType,
      discount_percent: rule.percent,
      stripe_coupon_id: coupon.id,
      stripe_promo_code: promoCode.code,
      expires_at: expiresAt.toISOString(),
    });

    return {
      success: true,
      code: promoCode.code,
      percent: rule.percent,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error("[DiscountEngine] Error creating discount:", error);
    return {
      success: false,
      error: "Could not create discount at this time. Please try again.",
    };
  }
}
