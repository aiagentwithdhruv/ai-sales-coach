/**
 * Item 27: AI Demo Agent (Voice)
 *
 * Voice-based interactive product demo:
 *   - Prospect calls or clicks "Talk to AI" → connects to voice agent
 *   - Agent gives live product walkthrough via conversation
 *   - Integrates with Twilio for inbound/outbound calls
 *   - Uses pipeline.ts conversation engine for state management
 *   - Can book meetings, share links, and qualify in real-time
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VoiceDemoSession {
  id: string;
  callId?: string;
  callSid?: string;
  visitorPhone?: string;
  status: "active" | "completed" | "dropped";
  transcript: Array<{
    speaker: "agent" | "visitor";
    text: string;
    timestamp: number;
  }>;
  qualificationData: Record<string, unknown>;
  outcome?: string;
  duration?: number;
  createdAt: string;
}

// ─── Demo Agent Configuration ───────────────────────────────────────────────

const DEMO_AGENT_CONFIG = {
  name: "Alex from QuotaHit",
  greeting: "Hey! This is Alex from QuotaHit. I'm an AI demo agent — I can walk you through how our platform works and answer any questions. What's your biggest sales challenge right now?",
  systemPrompt: `You are Alex, the QuotaHit AI demo agent. You're giving a voice-based product demo.

ABOUT QUOTAHIT:
QuotaHit is an Autonomous AI Sales Department with 7 AI agents:
1. Scout — finds leads automatically
2. Researcher — enriches with company data
3. Qualifier — scores leads with BANT+ conversations
4. Outreach — multi-channel sequences (email, LinkedIn, WhatsApp)
5. Caller — autonomous AI phone calls
6. Closer — auto proposals + invoicing
7. Ops — post-sale onboarding

PRICING: Starter $297/mo, Growth $697/mo, Enterprise $1,497/mo

VOICE DEMO RULES:
- Keep answers SHORT (1-3 sentences). This is a phone call.
- Be enthusiastic but not salesy
- Use concrete examples: "For example, one of our SaaS clients went from 10 demos/month to 50"
- Ask qualifying questions naturally
- If they're interested, offer to book a detailed demo or start a trial
- If they mention a competitor (Apollo, Outreach, Salesloft), acknowledge and differentiate

QUALIFICATION (extract during conversation):
- Company name and size
- Current sales process
- Monthly lead volume
- Tech stack they use
- Budget range
- Timeline to buy`,
  objective: "Give an engaging voice demo, qualify the prospect, and either book a follow-up call or start a trial",
  maxDuration: 600, // 10 minutes
  endCallPhrases: ["goodbye", "not interested", "remove me", "stop calling", "hang up"],
};

// ─── Initialize Voice Demo ──────────────────────────────────────────────────

export async function initializeVoiceDemo(params: {
  callId: string;
  callSid?: string;
  visitorPhone?: string;
}): Promise<{
  greeting: string;
  sessionId: string;
}> {
  const supabase = getAdmin();

  const { data: session } = await supabase
    .from("voice_demo_sessions")
    .insert({
      call_id: params.callId,
      call_sid: params.callSid,
      visitor_phone: params.visitorPhone,
      status: "active",
      transcript: [],
      qualification_data: {},
      agent_config: DEMO_AGENT_CONFIG,
    })
    .select("id")
    .single();

  return {
    greeting: DEMO_AGENT_CONFIG.greeting,
    sessionId: session?.id || "",
  };
}

// ─── Process Speech in Demo ─────────────────────────────────────────────────

export async function processDemoSpeech(
  sessionId: string,
  visitorSpeech: string
): Promise<{
  response: string;
  shouldEndCall: boolean;
  action?: string; // book_call, start_trial, transfer
}> {
  const supabase = getAdmin();

  // Get session
  const { data: session } = await supabase
    .from("voice_demo_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return { response: "I seem to have lost our connection. Thank you for your interest in QuotaHit!", shouldEndCall: true };
  }

  const transcript = (session.transcript || []) as VoiceDemoSession["transcript"];
  const startTime = new Date(session.created_at).getTime();
  const elapsed = (Date.now() - startTime) / 1000;

  // Check max duration
  if (elapsed > DEMO_AGENT_CONFIG.maxDuration) {
    return {
      response: "I've really enjoyed chatting with you! I want to be respectful of your time. Can I book a follow-up call to dive deeper?",
      shouldEndCall: false,
      action: "book_call",
    };
  }

  // Check end-call phrases
  const lower = visitorSpeech.toLowerCase();
  for (const phrase of DEMO_AGENT_CONFIG.endCallPhrases) {
    if (lower.includes(phrase)) {
      return {
        response: "Understood. Thank you for your time! If you change your mind, visit quotahit.com anytime. Have a great day!",
        shouldEndCall: true,
      };
    }
  }

  // Add visitor speech to transcript
  transcript.push({
    speaker: "visitor",
    text: visitorSpeech,
    timestamp: elapsed,
  });

  // Generate AI response
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY;
  const isAnthropic = !!process.env.ANTHROPIC_API_KEY;

  const conversationHistory = transcript.map((t) => ({
    role: t.speaker === "agent" ? "assistant" as const : "user" as const,
    content: t.text,
  }));

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
      max_tokens: 200, // Short for voice
      system: DEMO_AGENT_CONFIG.systemPrompt,
      messages: conversationHistory,
    });
  } else {
    headers["Authorization"] = `Bearer ${apiKey}`;
    body = JSON.stringify({
      model: "anthropic/claude-haiku-4-5-20251001",
      messages: [
        { role: "system", content: DEMO_AGENT_CONFIG.systemPrompt },
        ...conversationHistory,
      ],
      max_tokens: 200,
    });
  }

  let aiResponse: string;
  try {
    const result = await fetch(url, { method: "POST", headers, body });
    const data = await result.json();
    aiResponse = isAnthropic
      ? data.content?.[0]?.text || "That's a great question! Tell me more about your current sales process."
      : data.choices?.[0]?.message?.content || "That's a great question! Tell me more about your current sales process.";
  } catch {
    aiResponse = "That's interesting! What's your current sales stack look like?";
  }

  // Add agent response to transcript
  transcript.push({
    speaker: "agent",
    text: aiResponse,
    timestamp: (Date.now() - startTime) / 1000,
  });

  // Detect action intents
  let action: string | undefined;
  if (lower.includes("trial") || lower.includes("try it")) action = "start_trial";
  if (lower.includes("book") || lower.includes("schedule") || lower.includes("demo")) action = "book_call";

  // Save session
  await supabase
    .from("voice_demo_sessions")
    .update({
      transcript,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  return { response: aiResponse, shouldEndCall: false, action };
}

// ─── Complete Voice Demo ────────────────────────────────────────────────────

export async function completeVoiceDemo(
  sessionId: string,
  outcome?: string
): Promise<void> {
  const supabase = getAdmin();

  const { data: session } = await supabase
    .from("voice_demo_sessions")
    .select("created_at, transcript")
    .eq("id", sessionId)
    .single();

  const duration = session
    ? Math.round((Date.now() - new Date(session.created_at).getTime()) / 1000)
    : 0;

  await supabase
    .from("voice_demo_sessions")
    .update({
      status: "completed",
      outcome: outcome || "completed",
      duration,
    })
    .eq("id", sessionId);
}

// ─── Get Demo TwiML ─────────────────────────────────────────────────────────

export function getDemoGreetingTwiML(params: {
  webhookBaseUrl: string;
  sessionId: string;
}): string {
  // Return TwiML that says the greeting and gathers speech
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew">${DEMO_AGENT_CONFIG.greeting}</Say>
  <Gather input="speech" speechTimeout="auto" speechModel="experimental_conversations" action="${params.webhookBaseUrl}/api/webhooks/twilio/demo?sessionId=${params.sessionId}" method="POST">
  </Gather>
  <Say>I didn't catch that. Thank you for calling QuotaHit!</Say>
  <Hangup/>
</Response>`;
}
