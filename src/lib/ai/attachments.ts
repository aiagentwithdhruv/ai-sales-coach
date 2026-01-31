export type AttachmentType = "pdf" | "image" | "url";

export interface Attachment {
  type: AttachmentType;
  name: string;
  content?: string; // Base64 for files
  url?: string; // For website URLs
}

const MAX_WEBSITE_CHARS = 3000;

// Fetch website content (simple text extraction)
export async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "AI Sales Coach Bot" },
    });
    if (!response.ok) return `[Could not fetch ${url}]`;

    const html = await response.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_WEBSITE_CHARS);

    return text;
  } catch {
    return `[Could not fetch ${url}]`;
  }
}

// Process attachments into context string
export async function processAttachmentsForContext(
  attachments: Attachment[]
): Promise<string> {
  const contextParts: string[] = [];

  for (const att of attachments) {
    if (att.type === "url" && att.url) {
      const content = await fetchWebsiteContent(att.url);
      contextParts.push(`\n--- Website Content (${att.name}) ---\n${content}`);
    } else if (att.type === "pdf") {
      contextParts.push(
        `\n--- PDF Document: ${att.name} ---\n[PDF attached for reference]`
      );
    } else if (att.type === "image") {
      contextParts.push(
        `\n--- Image: ${att.name} ---\n[Image attached for reference]`
      );
    }
  }

  return contextParts.join("\n");
}
