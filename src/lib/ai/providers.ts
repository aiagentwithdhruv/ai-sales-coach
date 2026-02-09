/**
 * AI Provider Abstraction Layer
 *
 * Supports:
 * - OpenAI (direct)
 * - Anthropic (direct)
 * - OpenRouter (100+ models including GPT, Claude, Llama, Mistral, etc.)
 *
 * Usage:
 * - Set AI_CHAT_PROVIDER in .env.local to switch providers
 * - Use getLanguageModel() for Vercel AI SDK
 * - Use getChatModel() for LangChain
 */

import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

// Provider types
export type ProviderType = "openai" | "anthropic" | "openrouter" | "perplexity" | "moonshot";

// AI Configuration from environment
export const aiConfig = {
  chat: {
    provider: (process.env.AI_CHAT_PROVIDER || "openrouter") as ProviderType,
    models: {
      openai: process.env.AI_OPENAI_MODEL || "gpt-4-turbo",
      anthropic: process.env.AI_ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      openrouter: process.env.AI_OPENROUTER_MODEL || "moonshotai/kimi-k2.5",
    },
  },
  embeddings: {
    provider: "openai" as const,
    model: process.env.AI_EMBEDDING_MODEL || "text-embedding-3-small",
  },
};

// ===========================================
// Vercel AI SDK Providers (for streaming chat)
// ===========================================

// OpenAI provider
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Anthropic provider
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// OpenRouter provider (OpenAI-compatible API)
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "AI Sales Coach",
  },
});

// Moonshot AI provider (Kimi K2.5 - Direct API, OpenAI-compatible)
const moonshot = createOpenAI({
  apiKey: process.env.MOONSHOT_API_KEY,
  baseURL: "https://api.moonshot.ai/v1",
});

// Perplexity provider (OpenAI-compatible API)
const perplexity = createOpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: "https://api.perplexity.ai",
});

/**
 * Get language model for Vercel AI SDK
 * Use this for streaming chat in Next.js API routes
 *
 * @example
 * import { streamText } from 'ai';
 * import { getLanguageModel } from '@/lib/ai/providers';
 *
 * const result = await streamText({
 *   model: getLanguageModel(),
 *   messages: [{ role: 'user', content: 'Hello' }],
 * });
 */
export function getLanguageModel(providerOverride?: ProviderType) {
  const provider = providerOverride || aiConfig.chat.provider;

  switch (provider) {
    case "openai":
      return openai(aiConfig.chat.models.openai);
    case "anthropic":
      return anthropic(aiConfig.chat.models.anthropic);
    case "openrouter":
      return openrouter(aiConfig.chat.models.openrouter);
    default:
      return openrouter(aiConfig.chat.models.openrouter);
  }
}

/**
 * Get specific model by ID (for OpenRouter)
 * OpenRouter supports 100+ models from different providers
 *
 * @example
 * const model = getOpenRouterModel('openai/gpt-4-turbo');
 * const model = getOpenRouterModel('anthropic/claude-3-opus');
 * const model = getOpenRouterModel('meta-llama/llama-3-70b-instruct');
 */
export function getOpenRouterModel(modelId: string) {
  return openrouter(modelId);
}

/**
 * Get direct OpenAI model by ID
 * Uses direct OpenAI API (lower latency, no middleman)
 *
 * @example
 * const model = getDirectOpenAIModel('gpt-4.1');
 * const model = getDirectOpenAIModel('gpt-4.1-mini');
 */
export function getDirectOpenAIModel(modelId: string) {
  return openai(modelId);
}

/**
 * Get direct Anthropic/Claude model by ID
 * Uses direct Anthropic API (lower latency, no middleman)
 *
 * @example
 * const model = getDirectAnthropicModel('claude-opus-4-5-20251101');
 * const model = getDirectAnthropicModel('claude-sonnet-4-5-20250929');
 */
export function getDirectAnthropicModel(modelId: string) {
  return anthropic(modelId);
}

/**
 * Smart model selector - automatically picks the right provider based on model ID
 *
 * Model ID formats:
 * - OpenRouter: contains "/" (e.g., "anthropic/claude-opus-4.5", "openai/gpt-5")
 * - Direct OpenAI: starts with "gpt-" or "o3" (e.g., "gpt-4.1", "o3-mini")
 * - Direct Anthropic: starts with "claude-" (e.g., "claude-opus-4-5-20251101")
 */
export function getModelByIdSmart(modelId: string) {
  // Direct Moonshot/Kimi models
  if (modelId.startsWith("kimi-")) {
    return moonshot(modelId);
  }

  // OpenRouter models have a "/" in the ID
  if (modelId.includes("/")) {
    return openrouter(modelId);
  }

  // Direct OpenAI models
  if (modelId.startsWith("gpt-") || modelId.startsWith("o3") || modelId.startsWith("o1")) {
    return openai(modelId);
  }

  // Direct Anthropic models
  if (modelId.startsWith("claude-")) {
    return anthropic(modelId);
  }

  // Default to OpenRouter
  return openrouter(modelId);
}

// ===========================================
// LangChain Providers (for RAG & complex chains)
// ===========================================

/**
 * Get LangChain chat model
 * Use this for RAG pipelines, agents, and complex chains
 *
 * @example
 * import { getChatModel } from '@/lib/ai/providers';
 *
 * const model = getChatModel();
 * const response = await model.invoke([
 *   { role: 'user', content: 'Analyze this deal' }
 * ]);
 */
export function getChatModel(providerOverride?: ProviderType) {
  const provider = providerOverride || aiConfig.chat.provider;

  switch (provider) {
    case "openai":
      return new ChatOpenAI({
        model: aiConfig.chat.models.openai,
        temperature: 0.7,
        apiKey: process.env.OPENAI_API_KEY,
      });

    case "anthropic":
      return new ChatAnthropic({
        model: aiConfig.chat.models.anthropic,
        temperature: 0.7,
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

    case "openrouter":
      // OpenRouter uses OpenAI-compatible API
      return new ChatOpenAI({
        model: aiConfig.chat.models.openrouter,
        temperature: 0.7,
        configuration: {
          baseURL: "https://openrouter.ai/api/v1",
          defaultHeaders: {
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "AI Sales Coach",
          },
        },
        apiKey: process.env.OPENROUTER_API_KEY,
      });

    default:
      return new ChatOpenAI({
        model: aiConfig.chat.models.openrouter,
        temperature: 0.7,
        configuration: {
          baseURL: "https://openrouter.ai/api/v1",
          defaultHeaders: {
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "AI Sales Coach",
          },
        },
        apiKey: process.env.OPENROUTER_API_KEY,
      });
  }
}

/**
 * Get LangChain model for specific provider (for advanced use cases)
 */
export function getLangChainOpenRouterModel(modelId: string) {
  return new ChatOpenAI({
    model: modelId,
    temperature: 0.7,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AI Sales Coach",
      },
    },
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

// ===========================================
// Available OpenRouter Models (Reference)
// ===========================================

/**
 * Latest OpenRouter models (2025/2026):
 *
 * OpenAI:
 * - openai/gpt-5, openai/gpt-5-mini
 * - openai/gpt-4.1, openai/gpt-4.1-mini, openai/gpt-4.1-nano
 * - openai/o3, openai/o3-mini
 *
 * Anthropic:
 * - anthropic/claude-opus-4.5
 * - anthropic/claude-sonnet-4
 * - anthropic/claude-haiku-4-5
 *
 * Google:
 * - google/gemini-3-pro, google/gemini-3-flash
 * - google/gemini-2.5-flash
 *
 * Meta:
 * - meta-llama/llama-4-maverick
 * - meta-llama/llama-4-scout
 *
 * Perplexity:
 * - perplexity/sonar-pro, perplexity/sonar
 *
 * Full list: https://openrouter.ai/models
 */
export const OPENROUTER_MODELS = {
  // Cost-effective default
  default: [
    "moonshotai/kimi-k2.5",
  ],
  // Fast & efficient (good for simple tasks)
  fast: [
    "moonshotai/kimi-k2.5",
    "openai/gpt-4.1-mini",
    "openai/gpt-4.1-nano",
    "anthropic/claude-haiku-4-5",
    "google/gemini-2.5-flash",
    "google/gemini-3-flash",
  ],
  // Balanced (good for most tasks)
  balanced: [
    "moonshotai/kimi-k2.5",
    "openai/gpt-4.1",
    "anthropic/claude-sonnet-4",
    "google/gemini-3-flash",
    "meta-llama/llama-4-scout",
  ],
  // Most capable (for complex reasoning)
  capable: [
    "openai/gpt-5",
    "openai/o3",
    "anthropic/claude-opus-4.5",
    "google/gemini-3-pro",
    "meta-llama/llama-4-maverick",
  ],
  // Research & reasoning
  research: [
    "perplexity/sonar-pro",
    "perplexity/sonar",
  ],
} as const;

/**
 * Get Perplexity model for research tasks
 */
export function getPerplexityModel(modelId: string = "sonar-pro") {
  return perplexity(modelId);
}
