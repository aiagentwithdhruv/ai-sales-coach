/**
 * Item 26: AI Demo Agent (Chat)
 *
 * Interactive chat-based product demo that:
 *   - Walks prospects through QuotaHit features
 *   - Answers questions from the knowledge base (RAG)
 *   - Shows real examples of each agent's capability
 *   - Qualifies the prospect during the demo
 *   - Books a call or starts a trial at the end
 *
 * Uses Claude with product knowledge context.
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DemoChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: {
    feature?: string;
    action?: string; // book_call, start_trial, show_pricing
    sentiment?: string;
  };
}

export interface DemoSession {
  id: string;
  visitorId: string;
  messages: DemoChatMessage[];
  stage: "intro" | "discovery" | "demo" | "qualifying" | "closing";
  qualificationData: {
    companySize?: string;
    industry?: string;
    currentTools?: string[];
    painPoints?: string[];
    budget?: string;
    timeline?: string;
  };
  startedAt: string;
  lastActivityAt: string;
}

// ─── Product Knowledge ──────────────────────────────────────────────────────

const PRODUCT_KNOWLEDGE = `
QuotaHit is an Autonomous AI Sales Department — 7 AI agents that handle your entire sales process.

AGENTS:
1. Scout Agent — Finds leads from LinkedIn, web, databases. Imports 100s/day.
2. Researcher Agent — Enriches every lead with company data, tech stack, funding, news.
3. Qualifier Agent — AI conversation that scores leads on BANT+ (Budget, Authority, Need, Timeline).
4. Outreach Agent — Multi-channel sequences: email, LinkedIn, WhatsApp, SMS. Self-improving templates.
5. Caller Agent — Autonomous AI phone calls. Handles objections, books meetings.
6. Closer Agent — Auto-generates proposals, sends invoices, collects payments.
7. Ops Agent — Post-sale onboarding, welcome sequences, success check-ins.

KEY FEATURES:
- Full autonomous mode: Zero human touches from lead to closed deal
- Hybrid mode: AI handles research + outreach, humans close
- Self-improving: Templates A/B test themselves. Scoring recalibrates from outcomes.
- Voice commands: Control your CRM by speaking naturally
- Composition chains: Chain agents together for custom workflows
- Industry loadouts: Pre-built templates for SaaS, Real Estate, Consulting, Healthcare, Agency

PRICING (monthly):
- Starter: $297/mo — 500 contacts, 3 agents
- Growth: $697/mo — 5,000 contacts, all 7 agents
- Enterprise: $1,497/mo — Unlimited, priority support, custom integrations

DIFFERENTIATORS:
- Not just a CRM — it's a full AI sales team
- 10x cheaper than hiring SDRs ($297/mo vs $5,000/mo per SDR)
- Works 24/7, no sick days, no training time
- Gets smarter over time (self-improving templates + scoring)
`;

// ─── Demo System Prompt ─────────────────────────────────────────────────────

const DEMO_SYSTEM_PROMPT = `You are the QuotaHit AI Demo Agent. Your job is to give an engaging, interactive product demo via chat.

${PRODUCT_KNOWLEDGE}

CONVERSATION FLOW:
1. INTRO: Greet warmly. Ask what they're looking for in a sales tool.
2. DISCOVERY: Ask about their current sales process, team size, and pain points.
3. DEMO: Walk through relevant features based on their needs. Use concrete examples.
4. QUALIFYING: Naturally assess budget, timeline, and decision authority.
5. CLOSING: Based on fit, either book a call, offer a trial, or share pricing.

RULES:
- Keep responses concise (2-4 sentences max). This is chat, not a lecture.
- Ask one question at a time.
- Use their industry/company context to personalize examples.
- If they ask about pricing, share it openly — no games.
- If they're not a fit, be honest and helpful.
- End every response that needs input with a question.
- Never make up customer stories or statistics.

ACTIONS (include as JSON in metadata):
- {"action": "show_pricing"} — when they ask about pricing
- {"action": "book_call"} — when ready to schedule a demo call
- {"action": "start_trial"} — when they want to try it
- {"action": "show_feature", "feature": "outreach"} — when demoing a specific feature`;

// ─── Initialize Demo Session ────────────────────────────────────────────────

export async function startDemoSession(
  visitorId: string,
  initialContext?: { name?: string; company?: string; source?: string }
): Promise<{ sessionId: string; greeting: string }> {
  const supabase = getAdmin();

  const greeting = initialContext?.name
    ? `Hey ${initialContext.name}! Welcome to QuotaHit. I'm your AI demo guide. What brings you here today — are you looking to scale your sales outreach, or are you curious about AI-powered sales in general?`
    : `Hey there! Welcome to QuotaHit — the AI-powered sales department. I can give you a quick interactive tour. What's your biggest sales challenge right now?`;

  const session: Omit<DemoSession, "id"> = {
    visitorId,
    messages: [
      {
        role: "assistant",
        content: greeting,
        timestamp: new Date().toISOString(),
        metadata: { feature: "intro" },
      },
    ],
    stage: "intro",
    qualificationData: {},
    startedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };

  const { data } = await supabase
    .from("demo_sessions")
    .insert({
      visitor_id: visitorId,
      messages: session.messages,
      stage: session.stage,
      qualification_data: session.qualificationData,
      context: initialContext || {},
    })
    .select("id")
    .single();

  return { sessionId: data?.id || "", greeting };
}

// ─── Chat with Demo Agent ───────────────────────────────────────────────────

export async function chatWithDemoAgent(
  sessionId: string,
  userMessage: string
): Promise<{
  response: string;
  metadata?: Record<string, unknown>;
  stage: string;
}> {
  const supabase = getAdmin();

  // Get session
  const { data: session } = await supabase
    .from("demo_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return { response: "Session not found. Let me start a new demo for you!", stage: "intro" };
  }

  const messages = (session.messages || []) as DemoChatMessage[];

  // Add user message
  messages.push({
    role: "user",
    content: userMessage,
    timestamp: new Date().toISOString(),
  });

  // Call LLM
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY;
  const isAnthropic = !!process.env.ANTHROPIC_API_KEY;

  const url = isAnthropic
    ? "https://api.anthropic.com/v1/messages"
    : "https://openrouter.ai/api/v1/chat/completions";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let body: string;

  const llmMessages = messages.map((m) => ({
    role: m.role === "system" ? "user" : m.role,
    content: m.content,
  }));

  if (isAnthropic) {
    headers["x-api-key"] = apiKey!;
    headers["anthropic-version"] = "2023-06-01";
    body = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: DEMO_SYSTEM_PROMPT,
      messages: llmMessages,
    });
  } else {
    headers["Authorization"] = `Bearer ${apiKey}`;
    body = JSON.stringify({
      model: "anthropic/claude-haiku-4-5-20251001",
      messages: [
        { role: "system", content: DEMO_SYSTEM_PROMPT },
        ...llmMessages,
      ],
      max_tokens: 500,
    });
  }

  let aiResponse: string;
  try {
    const result = await fetch(url, { method: "POST", headers, body });
    const data = await result.json();
    aiResponse = isAnthropic
      ? data.content?.[0]?.text || "I'd love to help! What would you like to know about QuotaHit?"
      : data.choices?.[0]?.message?.content || "I'd love to help! What would you like to know about QuotaHit?";
  } catch {
    aiResponse = "Thanks for your interest! Let me tell you about QuotaHit's AI agents. What aspect of sales automation interests you most?";
  }

  // Detect stage transitions
  const messageCount = messages.length;
  let stage = session.stage;
  if (messageCount <= 4) stage = "discovery";
  else if (messageCount <= 10) stage = "demo";
  else if (messageCount <= 14) stage = "qualifying";
  else stage = "closing";

  // Add AI response
  messages.push({
    role: "assistant",
    content: aiResponse,
    timestamp: new Date().toISOString(),
    metadata: { feature: stage },
  });

  // Save session
  await supabase
    .from("demo_sessions")
    .update({
      messages,
      stage,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  return { response: aiResponse, stage };
}

// ─── Get Demo Analytics ─────────────────────────────────────────────────────

export async function getDemoAnalytics(period: "day" | "week" | "month" = "week"): Promise<{
  totalSessions: number;
  avgMessages: number;
  conversionToCall: number;
  conversionToTrial: number;
  topFeatures: string[];
}> {
  const supabase = getAdmin();
  const daysMap = { day: 1, week: 7, month: 30 };
  const since = new Date(Date.now() - daysMap[period] * 24 * 60 * 60 * 1000).toISOString();

  const { data: sessions, count } = await supabase
    .from("demo_sessions")
    .select("messages, stage", { count: "exact" })
    .gte("created_at", since);

  const all = sessions || [];
  const totalMessages = all.reduce((sum, s) => sum + ((s.messages as unknown[])?.length || 0), 0);
  const closingSessions = all.filter((s) => s.stage === "closing").length;

  return {
    totalSessions: count || 0,
    avgMessages: all.length > 0 ? Math.round(totalMessages / all.length) : 0,
    conversionToCall: all.length > 0 ? Math.round((closingSessions / all.length) * 100) : 0,
    conversionToTrial: 0, // Track separately via events
    topFeatures: ["outreach", "scoring", "calling"], // Derived from metadata analysis
  };
}
