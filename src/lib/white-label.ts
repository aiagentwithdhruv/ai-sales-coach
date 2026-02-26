/**
 * White-Label System
 *
 * Allows agencies to brand their QuotaHit instance with:
 *   - Custom logo and brand colors
 *   - Custom domain (via CNAME)
 *   - Custom email sender
 *   - Hidden "Powered by QuotaHit" badge (Enterprise only)
 *   - Client management portal
 *
 * Configuration stored in user_metadata under `white_label` key.
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ─────────────────────────────────────────────────────────────────

export interface WhiteLabelConfig {
  enabled: boolean;
  brand_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string; // hex
  secondary_color: string; // hex
  custom_domain: string | null;
  custom_email_domain: string | null;
  support_email: string | null;
  support_url: string | null;
  hide_powered_by: boolean; // Enterprise only
  custom_css: string | null; // Raw CSS override
  footer_text: string | null;
  onboarding_message: string | null;
}

export interface AgencyClient {
  id: string;
  agency_user_id: string;
  client_name: string;
  client_email: string;
  client_user_id: string | null; // Linked QuotaHit user
  tier_override: string | null;
  monthly_fee: number;
  commission_percent: number;
  is_active: boolean;
  created_at: string;
}

// ─── Default Config ────────────────────────────────────────────────────────

export const DEFAULT_WHITE_LABEL: WhiteLabelConfig = {
  enabled: false,
  brand_name: "QuotaHit",
  logo_url: null,
  favicon_url: null,
  primary_color: "#00B3FF",
  secondary_color: "#00FF88",
  custom_domain: null,
  custom_email_domain: null,
  support_email: null,
  support_url: null,
  hide_powered_by: false,
  custom_css: null,
  footer_text: null,
  onboarding_message: null,
};

// ─── Config Management ─────────────────────────────────────────────────────

/**
 * Get white-label config for a user/agency.
 */
export async function getWhiteLabelConfig(
  userId: string
): Promise<WhiteLabelConfig> {
  const supabase = getAdmin();
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);

  if (!user?.user_metadata?.white_label) {
    return DEFAULT_WHITE_LABEL;
  }

  return {
    ...DEFAULT_WHITE_LABEL,
    ...(user.user_metadata.white_label as Partial<WhiteLabelConfig>),
  };
}

/**
 * Update white-label config.
 */
export async function updateWhiteLabelConfig(
  userId: string,
  config: Partial<WhiteLabelConfig>
): Promise<WhiteLabelConfig> {
  const supabase = getAdmin();
  const current = await getWhiteLabelConfig(userId);
  const updated = { ...current, ...config };

  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { white_label: updated },
  });

  return updated;
}

/**
 * Resolve branding for a request (check custom domain → user → default).
 */
export async function resolveBranding(
  hostname?: string
): Promise<{ config: WhiteLabelConfig; userId: string | null }> {
  // If no custom domain or it's the main domain, return defaults
  const mainDomain = new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://quotahit.com"
  ).hostname;

  if (!hostname || hostname === mainDomain || hostname === "localhost") {
    return { config: DEFAULT_WHITE_LABEL, userId: null };
  }

  // Look up custom domain
  const supabase = getAdmin();
  const { data: users } = await supabase.auth.admin.listUsers();

  const matchedUser = users?.users?.find(
    (u) => u.user_metadata?.white_label?.custom_domain === hostname
  );

  if (matchedUser) {
    const config = {
      ...DEFAULT_WHITE_LABEL,
      ...(matchedUser.user_metadata?.white_label as Partial<WhiteLabelConfig>),
    };
    return { config, userId: matchedUser.id };
  }

  return { config: DEFAULT_WHITE_LABEL, userId: null };
}

// ─── Client Management ─────────────────────────────────────────────────────

/**
 * Add a client to an agency's portfolio.
 */
export async function addAgencyClient(
  agencyUserId: string,
  client: {
    name: string;
    email: string;
    monthlyFee?: number;
    commissionPercent?: number;
  }
): Promise<AgencyClient | null> {
  const supabase = getAdmin();

  const { data, error } = await supabase
    .from("agency_clients")
    .insert({
      agency_user_id: agencyUserId,
      client_name: client.name,
      client_email: client.email,
      monthly_fee: client.monthlyFee || 0,
      commission_percent: client.commissionPercent || 30,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("[WhiteLabel] Add client error:", error);
    return null;
  }

  return data;
}

/**
 * List all clients for an agency.
 */
export async function listAgencyClients(
  agencyUserId: string
): Promise<AgencyClient[]> {
  const supabase = getAdmin();

  const { data } = await supabase
    .from("agency_clients")
    .select("*")
    .eq("agency_user_id", agencyUserId)
    .order("created_at", { ascending: false });

  return data || [];
}

/**
 * Calculate agency revenue from clients.
 */
export async function getAgencyRevenue(
  agencyUserId: string
): Promise<{
  totalClients: number;
  activeClients: number;
  totalMonthlyRevenue: number;
  totalCommission: number;
}> {
  const clients = await listAgencyClients(agencyUserId);
  const activeClients = clients.filter((c) => c.is_active);

  const totalMonthlyRevenue = activeClients.reduce(
    (s, c) => s + c.monthly_fee,
    0
  );
  const totalCommission = activeClients.reduce(
    (s, c) => s + c.monthly_fee * (c.commission_percent / 100),
    0
  );

  return {
    totalClients: clients.length,
    activeClients: activeClients.length,
    totalMonthlyRevenue,
    totalCommission,
  };
}
