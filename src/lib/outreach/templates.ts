/**
 * Item 7: AI Template Generator
 *
 * AI writes email/LinkedIn/WhatsApp templates from enrichment data.
 * No human ever writes a template.
 *
 * Uses Claude Haiku for fast, cheap generation (~$0.001 per template).
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ─────────────────────────────────────────────────────────────────

export interface EnrichmentData {
  company_overview?: string;
  industry?: string;
  company_size?: string;
  website?: string;
  linkedin_url?: string;
  funding?: string;
  recent_news?: string[];
  pain_points?: string[];
  tech_stack?: string[];
  conversation_starters?: string[];
  key_people?: { name: string; title: string; insight: string }[];
}

export interface ContactForTemplate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  enrichment_data?: EnrichmentData;
}

export interface GeneratedTemplate {
  subject?: string;
  body: string;
  channel: "email" | "linkedin" | "whatsapp" | "sms";
  tone: string;
  purpose: string;
  personalization_score: number; // 0-100 how personalized
}

type Tone = "professional" | "casual" | "friendly" | "direct" | "consultative";
type Purpose = "intro" | "followup" | "value_add" | "breakup" | "connection_request" | "meeting_request";

// ─── System Prompts ────────────────────────────────────────────────────────

const BASE_PROMPT = `You are an expert sales copywriter for QuotaHit, an AI sales platform. Write highly personalized outreach messages.

Rules:
- NEVER use generic filler ("I hope this email finds you well", "I wanted to reach out")
- ALWAYS reference specific company/person details from the enrichment data
- Keep messages concise and value-focused
- Include a clear, specific CTA
- Match the requested tone exactly
- Output ONLY the message content, no explanations`;

const CHANNEL_INSTRUCTIONS: Record<string, string> = {
  email: `Format: Subject line on first line (prefix "Subject: "), then blank line, then body.
Keep under 150 words. Include 1-2 personalized sentences referencing their company.
End with a specific CTA (not "let me know").`,

  linkedin: `Format: Just the message body (no subject).
Keep under 300 characters for connection requests, under 500 for DMs.
Be conversational. Reference something specific about their profile or company.
No hard selling — focus on value and curiosity.`,

  whatsapp: `Format: Just the message body (no subject).
Keep under 200 words. Be conversational and casual.
Use line breaks for readability. Can use 1-2 emojis if appropriate.
Get to the point fast — WhatsApp is a casual channel.`,

  sms: `Format: Just the message body (no subject).
Keep under 160 characters (1 SMS). Ultra-concise.
Include the prospect's name and a clear CTA.`,
};

// ─── Generation Functions ──────────────────────────────────────────────────

export async function generateEmailTemplate(
  contact: ContactForTemplate,
  tone: Tone = "professional",
  purpose: Purpose = "intro"
): Promise<GeneratedTemplate> {
  const enrichment = contact.enrichment_data || {};
  const context = buildContext(contact, enrichment);

  const prompt = `${BASE_PROMPT}

${CHANNEL_INSTRUCTIONS.email}

Tone: ${tone}
Purpose: ${purpose}
${context}

Write a personalized cold email for this prospect.`;

  const result = await callLLM(prompt);
  const { subject, body } = parseEmailResponse(result);

  return {
    subject,
    body,
    channel: "email",
    tone,
    purpose,
    personalization_score: calculatePersonalizationScore(body, enrichment),
  };
}

export async function generateLinkedInDM(
  contact: ContactForTemplate,
  isConnectionRequest: boolean = false,
  tone: Tone = "friendly"
): Promise<GeneratedTemplate> {
  const enrichment = contact.enrichment_data || {};
  const context = buildContext(contact, enrichment);

  const purpose = isConnectionRequest ? "connection_request" : "intro";
  const prompt = `${BASE_PROMPT}

${CHANNEL_INSTRUCTIONS.linkedin}

Tone: ${tone}
Purpose: ${isConnectionRequest ? "LinkedIn connection request (under 300 chars)" : "LinkedIn DM after connection accepted"}
${context}

Write a personalized LinkedIn ${isConnectionRequest ? "connection request note" : "direct message"}.`;

  const body = await callLLM(prompt);

  return {
    body: body.trim(),
    channel: "linkedin",
    tone,
    purpose,
    personalization_score: calculatePersonalizationScore(body, enrichment),
  };
}

export async function generateWhatsAppMessage(
  contact: ContactForTemplate,
  tone: Tone = "casual",
  purpose: Purpose = "intro"
): Promise<GeneratedTemplate> {
  const enrichment = contact.enrichment_data || {};
  const context = buildContext(contact, enrichment);

  const prompt = `${BASE_PROMPT}

${CHANNEL_INSTRUCTIONS.whatsapp}

Tone: ${tone}
Purpose: ${purpose}
${context}

Write a personalized WhatsApp message for this prospect.`;

  const body = await callLLM(prompt);

  return {
    body: body.trim(),
    channel: "whatsapp",
    tone,
    purpose,
    personalization_score: calculatePersonalizationScore(body, enrichment),
  };
}

export async function generateColdEmailVariants(
  contact: ContactForTemplate,
  count: number = 3
): Promise<GeneratedTemplate[]> {
  const tones: Tone[] = ["professional", "consultative", "direct"];
  const variants: GeneratedTemplate[] = [];

  for (let i = 0; i < Math.min(count, tones.length); i++) {
    const variant = await generateEmailTemplate(contact, tones[i], "intro");
    variants.push(variant);
  }

  return variants;
}

// ─── Template Personalization ──────────────────────────────────────────────

export function personalizeTemplate(
  template: string,
  contact: ContactForTemplate
): string {
  const enrichment = contact.enrichment_data || {};
  const vars: Record<string, string> = {
    first_name: contact.first_name || "there",
    last_name: contact.last_name || "",
    full_name: [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "there",
    company: contact.company || "your company",
    title: contact.title || "",
    industry: enrichment.industry || "",
    pain_point: enrichment.pain_points?.[0] || "",
    conversation_starter: enrichment.conversation_starters?.[0] || "",
  };

  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function buildContext(contact: ContactForTemplate, enrichment: EnrichmentData): string {
  const lines: string[] = [];

  if (contact.first_name) lines.push(`Name: ${contact.first_name} ${contact.last_name || ""}`);
  if (contact.title) lines.push(`Title: ${contact.title}`);
  if (contact.company) lines.push(`Company: ${contact.company}`);
  if (enrichment.industry) lines.push(`Industry: ${enrichment.industry}`);
  if (enrichment.company_size) lines.push(`Company Size: ${enrichment.company_size}`);
  if (enrichment.company_overview) lines.push(`About: ${enrichment.company_overview}`);
  if (enrichment.pain_points?.length) lines.push(`Pain Points: ${enrichment.pain_points.join(", ")}`);
  if (enrichment.tech_stack?.length) lines.push(`Tech Stack: ${enrichment.tech_stack.join(", ")}`);
  if (enrichment.recent_news?.length) lines.push(`Recent News: ${enrichment.recent_news[0]}`);
  if (enrichment.conversation_starters?.length) lines.push(`Conversation Starters: ${enrichment.conversation_starters.join("; ")}`);
  if (enrichment.funding) lines.push(`Funding: ${enrichment.funding}`);

  return lines.length > 0 ? `\nProspect Context:\n${lines.join("\n")}` : "\nNo enrichment data available — write a semi-personalized message using just name/company.";
}

function parseEmailResponse(response: string): { subject: string; body: string } {
  const lines = response.trim().split("\n");
  let subject = "";
  let bodyStart = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().startsWith("subject:")) {
      subject = lines[i].replace(/^subject:\s*/i, "").trim();
      bodyStart = i + 1;
      // Skip blank line after subject
      if (bodyStart < lines.length && lines[bodyStart].trim() === "") {
        bodyStart++;
      }
      break;
    }
  }

  const body = lines.slice(bodyStart).join("\n").trim();
  return { subject: subject || "Quick question", body };
}

function calculatePersonalizationScore(text: string, enrichment: EnrichmentData): number {
  let score = 0;
  const lower = text.toLowerCase();

  if (enrichment.company_overview && lower.includes(enrichment.company_overview.split(" ")[0]?.toLowerCase())) score += 15;
  if (enrichment.industry && lower.includes(enrichment.industry.toLowerCase())) score += 15;
  if (enrichment.pain_points?.some((p) => lower.includes(p.split(" ")[0]?.toLowerCase()))) score += 20;
  if (enrichment.tech_stack?.some((t) => lower.includes(t.toLowerCase()))) score += 15;
  if (enrichment.recent_news?.some((n) => lower.includes(n.split(" ")[0]?.toLowerCase()))) score += 15;
  if (enrichment.funding && lower.includes("funding")) score += 10;
  if (enrichment.conversation_starters?.length) score += 10;

  return Math.min(score, 100);
}

async function callLLM(prompt: string): Promise<string> {
  // Try Anthropic (Claude Haiku) first, fallback to OpenRouter
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  if (anthropicKey) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.content?.[0]?.text || "";
    }
  }

  if (openrouterKey) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://www.quotahit.com",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    }
  }

  throw new Error("No AI provider configured for template generation");
}
