/**
 * AI Calling Pipeline Orchestrator
 * Coordinates: Twilio → Deepgram STT → LLM → TTS → Twilio
 *
 * This is the "brain" that processes incoming speech, generates AI responses,
 * and sends back audio in a conversation loop.
 */

import OpenAI from "openai";
import type { AIAgent, TranscriptEntry, CostBreakdown } from "@/types/teams";
import { estimateTTSCost } from "./tts";

// Cost constants (per minute)
const COSTS = {
  twilio_per_min: 0.04,
  deepgram_per_min: 0.0077,
  openai_tts_per_1k_chars: 0.015,
  elevenlabs_tts_per_1k_chars: 0.30,
};

interface ConversationMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ConversationState {
  callId: string;
  agent: AIAgent;
  messages: ConversationMessage[];
  transcript: TranscriptEntry[];
  startTime: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTTSChars: number;
}

// Active conversations keyed by callId
const activeConversations = new Map<string, ConversationState>();

/**
 * Initialize a new conversation for a call
 */
export function initConversation(callId: string, agent: AIAgent, contactContext?: {
  name?: string;
  company?: string;
  title?: string;
  previousNotes?: string;
}): ConversationState {
  // Build system prompt with variable substitution
  let systemPrompt = agent.system_prompt;
  if (contactContext?.name) {
    systemPrompt = systemPrompt.replace(/\{\{contact_name\}\}/g, contactContext.name);
  }
  if (contactContext?.company) {
    systemPrompt = systemPrompt.replace(/\{\{company\}\}/g, contactContext.company);
  }

  // Add context about the call
  systemPrompt += `\n\nIMPORTANT RULES:
- Keep responses concise (1-3 sentences max)
- Be conversational, not robotic
- If the person wants to end the call, say goodbye politely
- Never make up information you don't have
- Your objective: ${agent.objective || "Have a productive conversation"}`;

  // Add knowledge base context if available
  if (agent.knowledge_base.length > 0) {
    systemPrompt += "\n\nKNOWLEDGE BASE:";
    for (const kb of agent.knowledge_base) {
      systemPrompt += `\n[${kb.source}]: ${kb.content}`;
    }
  }

  // Add objection responses
  if (Object.keys(agent.objection_responses).length > 0) {
    systemPrompt += "\n\nOBJECTION HANDLING:";
    for (const [objection, response] of Object.entries(agent.objection_responses)) {
      systemPrompt += `\n- If they say "${objection}": ${response}`;
    }
  }

  // Add contact context
  if (contactContext?.previousNotes) {
    systemPrompt += `\n\nPREVIOUS NOTES ABOUT THIS CONTACT:\n${contactContext.previousNotes}`;
  }

  const state: ConversationState = {
    callId,
    agent,
    messages: [{ role: "system", content: systemPrompt }],
    transcript: [],
    startTime: Date.now(),
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTTSChars: 0,
  };

  activeConversations.set(callId, state);
  return state;
}

/**
 * Process user speech and generate AI response
 * This is the core conversation loop step
 */
export async function processUserSpeech(
  callId: string,
  userSpeech: string
): Promise<{ response: string; shouldEndCall: boolean }> {
  const state = activeConversations.get(callId);
  if (!state) {
    return { response: "I'm sorry, I seem to have lost our conversation. Goodbye.", shouldEndCall: true };
  }

  const callDuration = (Date.now() - state.startTime) / 1000;

  // Check max duration
  if (callDuration > state.agent.max_call_duration_seconds) {
    return {
      response: "I appreciate your time. I need to wrap up, but I'd love to continue this conversation. Can I call you back?",
      shouldEndCall: true,
    };
  }

  // Check for end-call phrases
  const lowerSpeech = userSpeech.toLowerCase();
  for (const phrase of state.agent.end_call_phrases) {
    if (lowerSpeech.includes(phrase.toLowerCase())) {
      // Record the user's message
      state.transcript.push({
        speaker: "contact",
        text: userSpeech,
        timestamp: callDuration,
      });
      state.messages.push({ role: "user", content: userSpeech });

      return {
        response: "I understand. Thank you for your time today. Have a great day!",
        shouldEndCall: true,
      };
    }
  }

  // Add user message
  state.messages.push({ role: "user", content: userSpeech });
  state.transcript.push({
    speaker: "contact",
    text: userSpeech,
    timestamp: callDuration,
  });

  // Generate AI response via LLM
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: state.agent.model || "gpt-4o-mini",
    messages: state.messages,
    temperature: state.agent.temperature,
    max_tokens: state.agent.max_tokens,
  });

  const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, could you repeat that?";

  // Track tokens
  state.totalInputTokens += completion.usage?.prompt_tokens || 0;
  state.totalOutputTokens += completion.usage?.completion_tokens || 0;
  state.totalTTSChars += aiResponse.length;

  // Add to conversation
  state.messages.push({ role: "assistant", content: aiResponse });
  state.transcript.push({
    speaker: "agent",
    text: aiResponse,
    timestamp: (Date.now() - state.startTime) / 1000,
  });

  return { response: aiResponse, shouldEndCall: false };
}

/**
 * Get the greeting message for the agent
 */
export function getAgentGreeting(agent: AIAgent, contactContext?: {
  name?: string;
  company?: string;
}): string {
  let greeting = agent.greeting;
  greeting = greeting.replace(/\{\{agent_name\}\}/g, agent.name);
  if (contactContext?.name) {
    greeting = greeting.replace(/\{\{contact_name\}\}/g, contactContext.name);
  }
  if (contactContext?.company) {
    greeting = greeting.replace(/\{\{company\}\}/g, contactContext.company);
  }
  // Clean up unreplaced variables
  greeting = greeting.replace(/\{\{[^}]+\}\}/g, "");
  return greeting.trim();
}

/**
 * End a conversation and calculate costs
 */
export function endConversation(callId: string): {
  transcript: TranscriptEntry[];
  costBreakdown: CostBreakdown;
  duration: number;
} | null {
  const state = activeConversations.get(callId);
  if (!state) return null;

  const duration = (Date.now() - state.startTime) / 1000;
  const durationMinutes = duration / 60;

  const ttsProvider = state.agent.voice_provider || "openai";

  const costBreakdown: CostBreakdown = {
    telephony: Math.round(durationMinutes * COSTS.twilio_per_min * 10000) / 10000,
    stt: Math.round(durationMinutes * COSTS.deepgram_per_min * 10000) / 10000,
    llm: Math.round(((state.totalInputTokens * 0.00015 / 1000) + (state.totalOutputTokens * 0.0006 / 1000)) * 10000) / 10000,
    tts: Math.round(estimateTTSCost(state.totalTTSChars, ttsProvider) * 10000) / 10000,
    total: 0,
  };
  costBreakdown.total = Math.round(
    (costBreakdown.telephony + costBreakdown.stt + costBreakdown.llm + costBreakdown.tts) * 10000
  ) / 10000;

  activeConversations.delete(callId);

  return {
    transcript: state.transcript,
    costBreakdown,
    duration: Math.round(duration),
  };
}

/**
 * Get active conversation state (for monitoring)
 */
export function getConversationState(callId: string): ConversationState | undefined {
  return activeConversations.get(callId);
}

/**
 * Analyze a completed call transcript with AI
 * Returns summary, outcome, sentiment, score, objections, topics
 */
export async function analyzeCallTranscript(transcript: TranscriptEntry[], agent: AIAgent): Promise<{
  summary: string;
  outcome: string;
  sentiment: string;
  score: number;
  scoreBreakdown: { discovery: number; rapport: number; objection_handling: number; closing: number; overall: number };
  objections: string[];
  topics: string[];
  nextSteps: string;
}> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const transcriptText = transcript
    .map((e) => `${e.speaker === "agent" ? "Agent" : "Contact"}: ${e.text}`)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Analyze this sales call transcript. The agent's objective was: "${agent.objective || "productive conversation"}".

Return a JSON object with:
- summary: 2-3 sentence summary
- outcome: one of: meeting_booked, callback_scheduled, interested, not_interested, wrong_number, voicemail, no_answer
- sentiment: positive, neutral, or negative
- score: 0-100 overall score
- scoreBreakdown: { discovery: 0-100, rapport: 0-100, objection_handling: 0-100, closing: 0-100, overall: 0-100 }
- objections: array of objections raised by the contact
- topics: array of key topics discussed
- nextSteps: recommended next steps

Return ONLY valid JSON, no markdown.`,
      },
      {
        role: "user",
        content: transcriptText,
      },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

  return {
    summary: result.summary || "Call completed.",
    outcome: result.outcome || "no_answer",
    sentiment: result.sentiment || "neutral",
    score: result.score || 50,
    scoreBreakdown: result.scoreBreakdown || { discovery: 50, rapport: 50, objection_handling: 50, closing: 50, overall: 50 },
    objections: result.objections || [],
    topics: result.topics || [],
    nextSteps: result.nextSteps || "No specific next steps identified.",
  };
}
