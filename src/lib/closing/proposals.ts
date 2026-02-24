/**
 * Item 18: Proposal Generator
 *
 * Auto-creates proposals from qualification data (BANT scores, enrichment, deal notes).
 * Generates PDF-ready proposal with:
 *   - Custom pricing based on company size + needs
 *   - Solution mapping from qualification notes
 *   - ROI projections from industry benchmarks
 *   - Terms & conditions
 *
 * Output: Structured proposal JSON (render to PDF/HTML on frontend)
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ProposalData {
  id: string;
  userId: string;
  contactId: string;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";
  title: string;
  summary: string;
  contactInfo: {
    name: string;
    company: string;
    email: string;
    title?: string;
  };
  sections: ProposalSection[];
  pricing: PricingTable;
  terms: string;
  validUntil: string; // ISO date
  createdAt: string;
}

export interface ProposalSection {
  heading: string;
  content: string;
  type: "text" | "bullets" | "table" | "metric";
}

export interface PricingTable {
  items: PricingItem[];
  subtotal: number;
  discount?: { label: string; amount: number };
  total: number;
  currency: string;
  billingCycle: "one-time" | "monthly" | "quarterly" | "annual";
}

export interface PricingItem {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ─── Generate Proposal ──────────────────────────────────────────────────────

export async function generateProposal(
  userId: string,
  contactId: string,
  overrides?: Partial<{
    customPricing: PricingItem[];
    templateStyle: string;
    includeROI: boolean;
    validDays: number;
  }>
): Promise<ProposalData> {
  const supabase = getAdmin();

  // Gather all context
  const [contactResult, activitiesResult, qualResult] = await Promise.all([
    supabase.from("contacts").select("*").eq("id", contactId).eq("user_id", userId).single(),
    supabase
      .from("activities")
      .select("activity_type, details, created_at")
      .eq("contact_id", contactId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("activities")
      .select("details")
      .eq("contact_id", contactId)
      .eq("user_id", userId)
      .eq("activity_type", "qualification_completed")
      .limit(1)
      .single(),
  ]);

  const contact = contactResult.data;
  if (!contact) throw new Error("Contact not found");

  const activities = activitiesResult.data || [];
  const qualData = (qualResult.data?.details || {}) as Record<string, unknown>;

  const enrichment = (contact.enrichment_data || {}) as Record<string, unknown>;
  const companySize = enrichment.company_size as string || "small";
  const industry = enrichment.industry as string || "general";

  // AI-generate proposal content
  const proposalContent = await generateProposalContent({
    contactName: `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
    company: contact.company || "your company",
    industry,
    companySize,
    qualificationNotes: qualData.notes as string || "",
    bantScores: qualData.bant as Record<string, number> || {},
    dealValue: contact.deal_value || 0,
    activitySummary: activities.slice(0, 10).map((a) => a.activity_type).join(", "),
    includeROI: overrides?.includeROI !== false,
  });

  // Build pricing
  const pricing = overrides?.customPricing
    ? buildPricingTable(overrides.customPricing)
    : generateDefaultPricing(companySize, contact.deal_value || 0);

  const validDays = overrides?.validDays || 30;
  const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();

  // Store proposal
  const { data: proposal } = await supabase
    .from("proposals")
    .insert({
      user_id: userId,
      contact_id: contactId,
      status: "draft",
      title: proposalContent.title,
      summary: proposalContent.summary,
      contact_info: {
        name: `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
        company: contact.company,
        email: contact.email,
        title: (contact.custom_fields as Record<string, string>)?.title,
      },
      sections: proposalContent.sections,
      pricing,
      terms: proposalContent.terms,
      valid_until: validUntil,
    })
    .select("id")
    .single();

  // Log activity
  await supabase.from("activities").insert({
    user_id: userId,
    contact_id: contactId,
    activity_type: "proposal_generated",
    details: {
      proposal_id: proposal?.id,
      total: pricing.total,
      valid_until: validUntil,
    },
  });

  return {
    id: proposal?.id || "",
    userId,
    contactId,
    status: "draft",
    title: proposalContent.title,
    summary: proposalContent.summary,
    contactInfo: {
      name: `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
      company: contact.company || "",
      email: contact.email || "",
    },
    sections: proposalContent.sections,
    pricing,
    terms: proposalContent.terms,
    validUntil,
    createdAt: new Date().toISOString(),
  };
}

// ─── AI Content Generation ──────────────────────────────────────────────────

async function generateProposalContent(params: {
  contactName: string;
  company: string;
  industry: string;
  companySize: string;
  qualificationNotes: string;
  bantScores: Record<string, number>;
  dealValue: number;
  activitySummary: string;
  includeROI: boolean;
}): Promise<{
  title: string;
  summary: string;
  sections: ProposalSection[];
  terms: string;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY;
  const isAnthropic = !!process.env.ANTHROPIC_API_KEY;

  const systemPrompt = `You are a professional proposal writer. Generate a sales proposal.

Context:
- Contact: ${params.contactName} at ${params.company}
- Industry: ${params.industry} | Company size: ${params.companySize}
- Qualification notes: ${params.qualificationNotes || "N/A"}
- Deal value estimate: $${params.dealValue || "TBD"}
${params.includeROI ? "Include ROI projections section." : ""}

Return JSON:
{
  "title": "Proposal title",
  "summary": "2-3 sentence executive summary",
  "sections": [
    { "heading": "...", "content": "...", "type": "text" }
  ],
  "terms": "Standard terms text"
}

Sections should include: Executive Summary, Solution Overview, Implementation Timeline, ${params.includeROI ? "ROI Projections, " : ""}Why Us, Next Steps.
Return ONLY valid JSON.`;

  const url = isAnthropic
    ? "https://api.anthropic.com/v1/messages"
    : "https://openrouter.ai/api/v1/chat/completions";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let body: string;

  if (isAnthropic) {
    headers["x-api-key"] = apiKey!;
    headers["anthropic-version"] = "2023-06-01";
    body = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: "Generate the proposal." }],
    });
  } else {
    headers["Authorization"] = `Bearer ${apiKey}`;
    body = JSON.stringify({
      model: "anthropic/claude-haiku-4-5-20251001",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the proposal." },
      ],
      max_tokens: 1500,
    });
  }

  try {
    const response = await fetch(url, { method: "POST", headers, body });
    const data = await response.json();
    const content = isAnthropic
      ? data.content?.[0]?.text
      : data.choices?.[0]?.message?.content;
    return JSON.parse(content || "{}");
  } catch {
    // Fallback template
    return {
      title: `Proposal for ${params.company}`,
      summary: `We're excited to present our solution for ${params.company}. Based on our conversations, we've tailored this proposal to address your specific needs.`,
      sections: [
        { heading: "Executive Summary", content: `This proposal outlines our recommended solution for ${params.company}.`, type: "text" },
        { heading: "Solution Overview", content: "Our platform provides end-to-end sales automation powered by AI agents.", type: "text" },
        { heading: "Implementation Timeline", content: "Week 1: Setup & Integration | Week 2: Configuration & Training | Week 3: Go Live", type: "text" },
        { heading: "Next Steps", content: "1. Review this proposal\n2. Schedule a demo\n3. Sign agreement\n4. Begin onboarding", type: "bullets" },
      ],
      terms: "This proposal is valid for 30 days from the date of issue. Payment terms: Net 30. All prices in USD.",
    };
  }
}

// ─── Pricing Helpers ────────────────────────────────────────────────────────

function buildPricingTable(items: PricingItem[]): PricingTable {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  return {
    items,
    subtotal,
    total: subtotal,
    currency: "USD",
    billingCycle: "monthly",
  };
}

function generateDefaultPricing(companySize: string, dealValue: number): PricingTable {
  // Tiered pricing based on company size
  const tiers: Record<string, PricingItem[]> = {
    small: [
      { name: "Starter Plan", description: "Up to 500 contacts, 3 agents", quantity: 1, unitPrice: 297, total: 297 },
      { name: "Setup & Integration", description: "One-time setup fee", quantity: 1, unitPrice: 500, total: 500 },
    ],
    medium: [
      { name: "Growth Plan", description: "Up to 5,000 contacts, 7 agents", quantity: 1, unitPrice: 697, total: 697 },
      { name: "Setup & Integration", description: "One-time setup + data migration", quantity: 1, unitPrice: 1000, total: 1000 },
    ],
    large: [
      { name: "Enterprise Plan", description: "Unlimited contacts, all agents, priority support", quantity: 1, unitPrice: 1497, total: 1497 },
      { name: "Setup & Integration", description: "Full onboarding + custom integrations", quantity: 1, unitPrice: 2500, total: 2500 },
    ],
  };

  const items = tiers[companySize] || tiers.small;

  // If deal value was discussed, adjust
  if (dealValue > 0) {
    const monthlyItem = items[0];
    monthlyItem.unitPrice = Math.round(dealValue / 12);
    monthlyItem.total = monthlyItem.unitPrice;
  }

  return buildPricingTable(items);
}

// ─── Proposal Actions ───────────────────────────────────────────────────────

export async function sendProposal(
  userId: string,
  proposalId: string
): Promise<{ sent: boolean; error?: string }> {
  const supabase = getAdmin();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*, contacts(*)")
    .eq("id", proposalId)
    .eq("user_id", userId)
    .single();

  if (!proposal) return { sent: false, error: "Proposal not found" };

  // Update status
  await supabase
    .from("proposals")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", proposalId);

  // Log activity
  await supabase.from("activities").insert({
    user_id: userId,
    contact_id: proposal.contact_id,
    activity_type: "proposal_sent",
    details: { proposal_id: proposalId, total: proposal.pricing?.total },
  });

  return { sent: true };
}

export async function getProposal(
  userId: string,
  proposalId: string
): Promise<ProposalData | null> {
  const supabase = getAdmin();

  const { data } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .eq("user_id", userId)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    contactId: data.contact_id,
    status: data.status,
    title: data.title,
    summary: data.summary,
    contactInfo: data.contact_info,
    sections: data.sections,
    pricing: data.pricing,
    terms: data.terms,
    validUntil: data.valid_until,
    createdAt: data.created_at,
  };
}

export async function listProposals(
  userId: string,
  filters?: { status?: string; contactId?: string }
): Promise<ProposalData[]> {
  const supabase = getAdmin();

  let query = supabase
    .from("proposals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.contactId) query = query.eq("contact_id", filters.contactId);

  const { data } = await query;

  return (data || []).map((d) => ({
    id: d.id,
    userId: d.user_id,
    contactId: d.contact_id,
    status: d.status,
    title: d.title,
    summary: d.summary,
    contactInfo: d.contact_info,
    sections: d.sections,
    pricing: d.pricing,
    terms: d.terms,
    validUntil: d.valid_until,
    createdAt: d.created_at,
  }));
}
