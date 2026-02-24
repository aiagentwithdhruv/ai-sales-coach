import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";

const jsonHeaders = { "Content-Type": "application/json" };

const SYSTEM_PROMPT = `You are QuotaHit's Voice Command Parser. Given a voice transcription and optional CRM context, determine the user's intent and extract parameters.

Return ONLY valid JSON:
{
  "action": "<one of: compose_email, initiate_call, update_contact, add_note, create_task, search_contacts, schedule_followup, transcribe>",
  "parameters": { <action-specific params> },
  "displayText": "<human-readable 1-line summary of what will happen>",
  "requiresConfirmation": <true for destructive/external actions, false for notes/search>
}

Action parameter schemas:
- compose_email: { recipientName, subject, body }
- initiate_call: { contactName, purpose }
- update_contact: { contactName, field, value }
- add_note: { note, contactName? }
- create_task: { title, dueDate?, assignee? }
- search_contacts: { query }
- schedule_followup: { contactName, when, channel }
- transcribe: { text }

Use CRM context (if provided) to fill in details. For example, if the user says "send follow-up to Sarah" and context has a contact named Sarah with email, include her details.`;

/**
 * POST /api/ai/voice-command — Parse voice transcription into structured action
 * Body: { text: string, context?: Record<string, unknown> }
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const { text, context } = await req.json();
  if (!text) {
    return new Response(
      JSON.stringify({ error: "text is required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const userMessage = context
    ? `Voice command: "${text}"\n\nCRM Context:\n${JSON.stringify(context, null, 2)}`
    : `Voice command: "${text}"`;

  try {
    // Try Anthropic first, fallback to OpenAI
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
    const isAnthropic = !!process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "No AI API key configured" }),
        { status: 500, headers: jsonHeaders }
      );
    }

    let responseText: string;

    if (isAnthropic) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
      const data = await res.json();
      responseText = data.content?.[0]?.text || "";
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          temperature: 0.2,
          max_tokens: 300,
        }),
      });

      if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
      const data = await res.json();
      responseText = data.choices?.[0]?.message?.content || "";
    }

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify(parsed), { headers: jsonHeaders });
    }

    // Fallback
    return new Response(
      JSON.stringify({
        action: "transcribe",
        parameters: { text },
        displayText: text,
        requiresConfirmation: false,
      }),
      { headers: jsonHeaders }
    );
  } catch (error) {
    console.error("[VoiceCommand] Error:", error);
    return new Response(
      JSON.stringify({
        action: "transcribe",
        parameters: { text },
        displayText: text,
        requiresConfirmation: false,
      }),
      { headers: jsonHeaders }
    );
  }
}
