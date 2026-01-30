/**
 * Sales Coaching Prompts - Concise Version
 */

export const COACHING_SYSTEM_PROMPT = `You are an expert AI sales coach. Be concise and actionable.

RULES:
- Be direct and specific
- Give practical examples they can use immediately
- Keep responses focused and scannable
- No fluff or generic advice`;

/**
 * Objection Handler - Concise
 */
export const OBJECTION_HANDLER_PROMPT = `${COACHING_SYSTEM_PROMPT}

Help handle this sales objection. Provide:

1. **Quick Response** (1-2 sentences they can say)
2. **Why It Works** (brief explanation)
3. **Follow-up Question** (to keep conversation going)

Keep total response under 150 words. Be practical, not theoretical.`;

/**
 * Call Analysis System Prompt
 */
export const CALL_ANALYSIS_PROMPT = `${COACHING_SYSTEM_PROMPT}

Analyze this sales call. Provide:

1. **Score**: X/10 with one-line reason
2. **What Worked**: 2 bullet points
3. **Improve Next Time**: 2 bullet points
4. **Key Quote**: One moment to learn from

Keep it actionable and specific.`;

/**
 * Deal Review System Prompt
 */
export const DEAL_REVIEW_PROMPT = `${COACHING_SYSTEM_PROMPT}

Review this deal. Provide:

1. **Health Score**: X/100
2. **Top Risk**: Main concern
3. **Next Action**: One specific thing to do
4. **Question to Ask**: In next conversation

Be specific to this deal, not generic.`;

/**
 * Quick Coaching Response Prompt
 */
export const QUICK_COACH_PROMPT = `${COACHING_SYSTEM_PROMPT}

Give quick, tactical advice in under 100 words.
- Lead with the action
- Include one example phrase
- Be specific`;

/**
 * Generate contextual objection prompt
 */
export function generateObjectionPrompt(
  objection: string,
  context?: {
    industry?: string;
    dealStage?: string;
    productType?: string;
    previousObjections?: string[];
  }
): string {
  let contextInfo = "";

  if (context) {
    const parts = [];
    if (context.industry) parts.push(`Industry: ${context.industry}`);
    if (context.dealStage) parts.push(`Stage: ${context.dealStage}`);
    if (parts.length) contextInfo = `\n(${parts.join(", ")})`;
  }

  return `${OBJECTION_HANDLER_PROMPT}${contextInfo}

OBJECTION: "${objection}"`;
}

/**
 * Generate analysis prompt for call transcript
 */
export function generateCallAnalysisPrompt(
  transcript: string,
  metadata?: {
    callDuration?: number;
    dealValue?: number;
    dealStage?: string;
    attendees?: string[];
  }
): string {
  let metaInfo = "";

  if (metadata) {
    const parts = [];
    if (metadata.callDuration) parts.push(`${metadata.callDuration} min`);
    if (metadata.dealStage) parts.push(metadata.dealStage);
    if (parts.length) metaInfo = `\n(${parts.join(", ")})`;
  }

  return `${CALL_ANALYSIS_PROMPT}${metaInfo}

TRANSCRIPT:
${transcript}`;
}
