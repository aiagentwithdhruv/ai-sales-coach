/**
 * Gamma API Presentation Generator
 *
 * POST endpoint that takes a presentation outline and sends it to Gamma API
 * to generate an actual PPTX / hosted presentation.
 *
 * Requires GAMMA_API_KEY environment variable.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

interface GenerateRequest {
  topic: string;
  slides: number;
  theme: string;
  style: string;
  outline: string;
}

export async function POST(req: Request) {
  try {
    const body: GenerateRequest = await req.json();
    const { topic, slides, theme, style, outline } = body;

    // Validate required fields
    if (!topic || !outline) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields. Provide at least 'topic' and 'outline'.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check for Gamma API key
    const gammaApiKey = process.env.GAMMA_API_KEY;
    if (!gammaApiKey) {
      return new Response(
        JSON.stringify({
          error:
            "Gamma API key is not configured. To enable PPTX generation, add GAMMA_API_KEY to your environment variables. You can get an API key at https://gamma.app. In the meantime, you can use the PDF export or copy the outline.",
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    // Map internal theme names to Gamma-friendly values
    const themeMap: Record<string, string> = {
      "pitch-deck": "startup",
      "product-demo": "modern",
      "sales-proposal": "corporate",
      "quarterly-review": "data",
      "client-onboarding": "friendly",
      "case-study": "story",
    };

    const toneMap: Record<string, string> = {
      professional: "formal",
      casual: "relaxed",
      executive: "executive",
    };

    // Call Gamma API
    const gammaResponse = await fetch("https://api.gamma.app/v1/presentations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gammaApiKey}`,
      },
      body: JSON.stringify({
        title: topic.slice(0, 100),
        content: outline,
        num_slides: slides || 12,
        theme: themeMap[theme] || "modern",
        style: toneMap[style] || "formal",
        format: "pptx",
      }),
    });

    if (!gammaResponse.ok) {
      const errorText = await gammaResponse.text();
      let errorMessage: string;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorText;
      } catch {
        errorMessage = errorText;
      }

      console.error("Gamma API Error:", gammaResponse.status, errorMessage);

      return new Response(
        JSON.stringify({
          error: `Gamma API error (${gammaResponse.status}): ${errorMessage}`,
        }),
        { status: gammaResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const gammaData = await gammaResponse.json();

    // Gamma API may return different response shapes depending on version
    const url =
      gammaData.url ||
      gammaData.presentation_url ||
      gammaData.share_url ||
      gammaData.data?.url;

    const downloadUrl =
      gammaData.download_url ||
      gammaData.pptx_url ||
      gammaData.data?.download_url;

    return new Response(
      JSON.stringify({
        success: true,
        url: url || downloadUrl || null,
        downloadUrl: downloadUrl || null,
        id: gammaData.id || gammaData.presentation_id || null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Presentation Generate Error:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while generating the presentation.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
