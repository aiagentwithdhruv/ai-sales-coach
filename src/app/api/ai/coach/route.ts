/**
 * AI Coach API Route
 *
 * Handles objection handling requests with model selection and attachments.
 */

import { streamText } from "ai";
import { getLanguageModel, getModelByIdSmart } from "@/lib/ai/providers";
import {
  OBJECTION_HANDLER_PROMPT,
  QUICK_COACH_PROMPT,
  generateObjectionPrompt,
} from "@/lib/ai/prompts/coaching";

export const runtime = "edge";
export const maxDuration = 30;

// Attachment types
interface Attachment {
  type: "pdf" | "image" | "url";
  name: string;
  content?: string; // Base64 for files
  url?: string; // For website URLs
}

// Fetch website content (simple text extraction)
async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "AI Sales Coach Bot" },
    });
    if (!response.ok) return `[Could not fetch ${url}]`;

    const html = await response.text();
    // Simple HTML to text conversion
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000); // Limit context size

    return text;
  } catch {
    return `[Could not fetch ${url}]`;
  }
}

// Process attachments into context string
async function processAttachments(attachments: Attachment[]): Promise<string> {
  const contextParts: string[] = [];

  for (const att of attachments) {
    if (att.type === "url" && att.url) {
      const content = await fetchWebsiteContent(att.url);
      contextParts.push(`\n--- Website Content (${att.name}) ---\n${content}`);
    } else if (att.type === "pdf" && att.content) {
      // For PDF, we'll note it's attached (full PDF parsing would need server-side library)
      contextParts.push(`\n--- PDF Document: ${att.name} ---\n[PDF content attached - using document context]`);
    } else if (att.type === "image" && att.content) {
      contextParts.push(`\n--- Image: ${att.name} ---\n[Image attached for reference]`);
    }
  }

  return contextParts.join("\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      type,
      message,
      model: modelId,
      context,
      attachments,
    }: {
      type: "objection" | "quick-coach" | "general";
      message: string;
      model?: string;
      context?: {
        industry?: string;
        dealStage?: string;
        productType?: string;
        previousObjections?: string[];
      };
      attachments?: Attachment[];
    } = body;

    // Validate input
    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Process attachments if any
    let attachmentContext = "";
    if (attachments && attachments.length > 0) {
      attachmentContext = await processAttachments(attachments);
    }

    // Determine system prompt based on type
    let systemPrompt: string;
    let userMessage: string;

    switch (type) {
      case "objection":
        systemPrompt = OBJECTION_HANDLER_PROMPT;
        userMessage = context
          ? generateObjectionPrompt(message, context)
          : `OBJECTION: "${message}"`;
        break;

      case "quick-coach":
        systemPrompt = QUICK_COACH_PROMPT;
        userMessage = message;
        break;

      default:
        systemPrompt = QUICK_COACH_PROMPT;
        userMessage = message;
    }

    // Add attachment context to user message
    if (attachmentContext) {
      userMessage = `${userMessage}\n\n--- COMPANY/CONTEXT INFORMATION ---${attachmentContext}\n\nUse this context to provide more relevant and specific objection handling advice.`;
    }

    // Get the model - smart selection based on model ID format
    const model = modelId
      ? getModelByIdSmart(modelId)
      : getLanguageModel();

    // Stream the response
    const result = await streamText({
      model,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      temperature: 0.7,
      maxTokens: 800, // Increased for contextual responses
    });

    // Return plain text stream
    return new Response(result.textStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Coach API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process coaching request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * GET endpoint to list common objections
 */
export async function GET() {
  const COMMON_OBJECTIONS = [
    {
      category: "Price",
      objections: ["It's too expensive", "We don't have budget", "Competitor is cheaper"],
    },
    {
      category: "Timing",
      objections: ["Not ready right now", "Call back next quarter", "Not a priority"],
    },
    {
      category: "Authority",
      objections: ["Need to check with boss", "Not the decision maker"],
    },
    {
      category: "Need",
      objections: ["We don't need this", "Don't see the value"],
    },
  ];

  return new Response(JSON.stringify({ objections: COMMON_OBJECTIONS }), {
    headers: { "Content-Type": "application/json" },
  });
}
