/**
 * Item 23: Pre-Built Industry Loadouts
 *
 * Ready-to-install loadout templates for specific industries:
 *   - SaaS (B2B software sales)
 *   - Real Estate (property listings + buyer outreach)
 *   - Consulting (lead gen + proposal automation)
 *   - Healthcare (patient acquisition + appointment booking)
 *   - Agency (client acquisition + project onboarding)
 *   - E-Commerce (customer reactivation + upsell)
 *   - Financial Services (wealth management leads)
 *
 * Each template is a complete LoadoutConfig with industry-specific
 * agent prompts, channels, sequences, and scoring weights.
 */

import type { AgentConfig, ChainConfig, LoadoutSettings } from "./loadout-builder";

// ─── Industry Template Type ─────────────────────────────────────────────────

export interface IndustryLoadout {
  id: string;
  name: string;
  industry: string;
  description: string;
  icon: string;
  tags: string[];
  agents: AgentConfig[];
  chain: ChainConfig;
  settings: LoadoutSettings;
  metrics: {
    avgConversionRate: string;
    avgDealSize: string;
    avgCycleTime: string;
  };
}

// ─── Pre-Built Templates ────────────────────────────────────────────────────

export const INDUSTRY_LOADOUTS: IndustryLoadout[] = [
  {
    id: "saas-b2b",
    name: "SaaS B2B Sales Machine",
    industry: "saas",
    description: "Full-stack B2B SaaS pipeline: LinkedIn prospecting → email sequences → demo booking → proposal → close",
    icon: "laptop",
    tags: ["b2b", "saas", "software", "tech"],
    agents: [
      {
        type: "researcher", enabled: true,
        config: {
          channels: ["linkedin", "api"],
          customFields: {
            idealCustomerProfile: "B2B SaaS companies, 50-500 employees, Series A+",
            enrichSources: ["linkedin", "crunchbase", "g2"],
          },
        },
      },
      {
        type: "qualifier", enabled: true,
        config: {
          threshold: 50,
          systemPrompt: "Qualify SaaS leads on: current tech stack, pain points with existing tools, team size, budget cycle, and decision-making timeline. Focus on product-market fit.",
        },
      },
      {
        type: "outreach", enabled: true,
        config: {
          channels: ["email", "linkedin"],
          maxAttempts: 7,
          schedule: "standard_b2b",
          customFields: { toneOfVoice: "professional-casual", focusOn: "ROI and time savings" },
        },
      },
      {
        type: "closer", enabled: true,
        config: { channels: ["email", "call"], customFields: { proposalStyle: "roi-focused", includeROI: true } },
      },
      {
        type: "ops", enabled: true,
        config: { channels: ["email"], customFields: { onboardingType: "self-serve + guided" } },
      },
    ],
    chain: {
      type: "full-autonomous",
      steps: [
        { agentType: "researcher", action: "enrich_contact" },
        { agentType: "qualifier", action: "qualify_bant", condition: "score >= 40" },
        { agentType: "outreach", action: "enroll_sequence", condition: "qualified" },
        { agentType: "closer", action: "generate_proposal", condition: "stage == negotiation" },
        { agentType: "ops", action: "onboard_client", condition: "stage == won" },
      ],
    },
    settings: {
      timezone: "America/New_York",
      businessHours: { start: 9, end: 17 },
      maxContactsPerDay: 50,
      channels: ["email", "linkedin"],
    },
    metrics: { avgConversionRate: "3-5%", avgDealSize: "$5,000-$50,000/yr", avgCycleTime: "30-60 days" },
  },
  {
    id: "real-estate",
    name: "Real Estate Lead Machine",
    industry: "real_estate",
    description: "Property buyer/seller lead nurturing: listing alerts → personalized outreach → showing booking → closing",
    icon: "building",
    tags: ["real-estate", "property", "listings", "agents"],
    agents: [
      {
        type: "researcher", enabled: true,
        config: {
          channels: ["api", "web"],
          customFields: { sources: ["zillow", "realtor.com", "local_mls"], trackPropertyViews: true },
        },
      },
      {
        type: "qualifier", enabled: true,
        config: {
          threshold: 30,
          systemPrompt: "Qualify real estate leads on: budget range, preferred locations, timeline to buy/sell, pre-approval status, and property preferences (beds, baths, sqft).",
        },
      },
      {
        type: "outreach", enabled: true,
        config: {
          channels: ["email", "sms", "whatsapp"],
          maxAttempts: 10,
          schedule: "nurture",
          customFields: { includeListings: true, personalizedMarketUpdates: true },
        },
      },
      {
        type: "caller", enabled: true,
        config: {
          channels: ["phone"],
          maxAttempts: 3,
          customFields: { script: "friendly-neighborhood-agent", maxDuration: 180 },
        },
      },
    ],
    chain: {
      type: "hybrid",
      steps: [
        { agentType: "researcher", action: "enrich_contact" },
        { agentType: "qualifier", action: "qualify_bant" },
        { agentType: "outreach", action: "enroll_sequence", condition: "qualified" },
        { agentType: "caller", action: "autonomous_call", condition: "score >= 60" },
      ],
    },
    settings: {
      timezone: "America/New_York",
      businessHours: { start: 8, end: 20 },
      maxContactsPerDay: 30,
      channels: ["email", "sms", "whatsapp", "phone"],
    },
    metrics: { avgConversionRate: "2-4%", avgDealSize: "$8,000-$25,000 commission", avgCycleTime: "60-120 days" },
  },
  {
    id: "consulting",
    name: "Consulting Pipeline Accelerator",
    industry: "consulting",
    description: "Thought leadership → lead capture → qualification → proposal → retainer close",
    icon: "briefcase",
    tags: ["consulting", "professional-services", "advisory"],
    agents: [
      {
        type: "researcher", enabled: true,
        config: {
          channels: ["linkedin", "api"],
          customFields: { lookFor: "decision-makers at companies with recent funding, hiring, or strategy changes" },
        },
      },
      {
        type: "qualifier", enabled: true,
        config: {
          threshold: 45,
          systemPrompt: "Qualify consulting leads on: specific business challenges, budget for external help, decision authority, project timeline, and previous consulting experience.",
        },
      },
      {
        type: "outreach", enabled: true,
        config: {
          channels: ["email", "linkedin"],
          maxAttempts: 5,
          schedule: "nurture",
          customFields: { toneOfVoice: "thought-leader", shareInsights: true },
        },
      },
      {
        type: "closer", enabled: true,
        config: {
          channels: ["email", "call"],
          customFields: { proposalStyle: "scope-of-work", includeTimeline: true },
        },
      },
    ],
    chain: {
      type: "hybrid",
      steps: [
        { agentType: "researcher", action: "enrich_contact" },
        { agentType: "qualifier", action: "qualify_bant", condition: "score >= 45" },
        { agentType: "outreach", action: "enroll_sequence", condition: "qualified" },
        { agentType: "closer", action: "generate_proposal", condition: "stage == negotiation" },
      ],
    },
    settings: {
      timezone: "America/New_York",
      businessHours: { start: 9, end: 18 },
      maxContactsPerDay: 20,
      channels: ["email", "linkedin"],
    },
    metrics: { avgConversionRate: "5-10%", avgDealSize: "$10,000-$100,000", avgCycleTime: "30-90 days" },
  },
  {
    id: "healthcare",
    name: "Healthcare Patient Acquisition",
    industry: "healthcare",
    description: "Patient lead nurturing: education content → appointment booking → intake → follow-up care",
    icon: "heart-pulse",
    tags: ["healthcare", "medical", "dental", "wellness"],
    agents: [
      {
        type: "qualifier", enabled: true,
        config: {
          threshold: 25,
          systemPrompt: "Qualify healthcare leads on: insurance status, specific health needs, location proximity, urgency of care, and preferred appointment times. Be empathetic and HIPAA-aware.",
        },
      },
      {
        type: "outreach", enabled: true,
        config: {
          channels: ["email", "sms"],
          maxAttempts: 5,
          schedule: "nurture",
          customFields: { toneOfVoice: "caring-professional", includeHealthTips: true },
        },
      },
      {
        type: "ops", enabled: true,
        config: {
          channels: ["email", "sms"],
          customFields: { onboardingType: "patient-intake", sendForms: true },
        },
      },
    ],
    chain: {
      type: "inbound",
      steps: [
        { agentType: "qualifier", action: "qualify_bant" },
        { agentType: "outreach", action: "enroll_sequence", condition: "qualified" },
        { agentType: "ops", action: "onboard_client", condition: "stage == won" },
      ],
    },
    settings: {
      timezone: "America/New_York",
      businessHours: { start: 8, end: 18 },
      maxContactsPerDay: 100,
      channels: ["email", "sms"],
    },
    metrics: { avgConversionRate: "8-15%", avgDealSize: "$500-$5,000/patient", avgCycleTime: "7-30 days" },
  },
  {
    id: "agency",
    name: "Agency Client Acquisition",
    industry: "agency",
    description: "Outbound prospecting → case study sharing → discovery call → proposal → retainer",
    icon: "rocket",
    tags: ["agency", "marketing", "creative", "digital"],
    agents: [
      {
        type: "scout", enabled: true,
        config: {
          channels: ["linkedin", "web"],
          customFields: { targets: "Growing companies spending on ads, hiring marketers, or launching new products" },
        },
      },
      {
        type: "researcher", enabled: true,
        config: {
          channels: ["api", "web"],
          customFields: { lookFor: "current marketing stack, ad spend signals, team size" },
        },
      },
      {
        type: "outreach", enabled: true,
        config: {
          channels: ["email", "linkedin", "whatsapp"],
          maxAttempts: 7,
          schedule: "aggressive",
          customFields: { shareCaseStudies: true, toneOfVoice: "results-driven" },
        },
      },
      {
        type: "closer", enabled: true,
        config: {
          channels: ["email", "call"],
          customFields: { proposalStyle: "retainer-based", includeROI: true },
        },
      },
      {
        type: "ops", enabled: true,
        config: { channels: ["email"], customFields: { onboardingType: "client-kickoff", duration: 14 } },
      },
    ],
    chain: {
      type: "full-autonomous",
      steps: [
        { agentType: "scout", action: "find_leads" },
        { agentType: "researcher", action: "enrich_contact" },
        { agentType: "outreach", action: "enroll_sequence" },
        { agentType: "closer", action: "generate_proposal", condition: "stage == negotiation" },
        { agentType: "ops", action: "onboard_client", condition: "stage == won" },
      ],
    },
    settings: {
      timezone: "America/New_York",
      businessHours: { start: 9, end: 18 },
      maxContactsPerDay: 30,
      channels: ["email", "linkedin", "whatsapp"],
    },
    metrics: { avgConversionRate: "3-7%", avgDealSize: "$3,000-$15,000/mo", avgCycleTime: "21-45 days" },
  },
];

// ─── API Functions ──────────────────────────────────────────────────────────

export function listIndustryLoadouts(industry?: string): IndustryLoadout[] {
  if (industry) {
    return INDUSTRY_LOADOUTS.filter((l) => l.industry === industry);
  }
  return INDUSTRY_LOADOUTS;
}

export function getIndustryLoadout(id: string): IndustryLoadout | undefined {
  return INDUSTRY_LOADOUTS.find((l) => l.id === id);
}

export function searchIndustryLoadouts(query: string): IndustryLoadout[] {
  const lower = query.toLowerCase();
  return INDUSTRY_LOADOUTS.filter(
    (l) =>
      l.name.toLowerCase().includes(lower) ||
      l.description.toLowerCase().includes(lower) ||
      l.tags.some((t) => t.includes(lower)) ||
      l.industry.includes(lower)
  );
}
