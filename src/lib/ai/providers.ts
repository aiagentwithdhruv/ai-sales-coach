/**
 * AI Provider Abstraction Layer
 *
 * Supports:
 * - OpenAI (direct)
 * - Anthropic (direct)
 * - OpenRouter (100+ models including GPT, Claude, Llama, Mistral, etc.)
 *
 * BYOAPI: All provider functions accept optional user API keys.
 * If user keys are provided, they are used instead of platform env vars.
 * Use resolveUserKeys() from key-resolver.ts to get the right keys.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import type { ResolvedKeys } from "./key-resolver";

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
// Provider Factories (create on demand with user keys)
// ===========================================

function createOpenAIProvider(apiKey?: string) {
  return createOpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY,
  });
}

function createAnthropicProvider(apiKey?: string) {
  return createAnthropic({
    apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
  });
}

export function createOpenRouterProvider(apiKey?: string) {
  return createOpenAI({
    apiKey: apiKey || process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    headers: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "AI Sales Coach",
    },
  });
}

function createMoonshotProvider() {
  return createOpenAI({
    apiKey: process.env.MOONSHOT_API_KEY,
    baseURL: "https://api.moonshot.ai/v1",
  });
}

function createPerplexityProvider() {
  return createOpenAI({
    apiKey: process.env.PERPLEXITY_API_KEY,
    baseURL: "https://api.perplexity.ai",
  });
}

// Fallback singletons for backward compatibility (use platform env vars)
const openai = createOpenAIProvider();
const anthropic = createAnthropicProvider();
const openrouter = createOpenRouterProvider();
const moonshot = createMoonshotProvider();
const perplexity = createPerplexityProvider();

// ===========================================
// Vercel AI SDK Providers (for streaming chat)
// ===========================================

/**
 * Get language model for Vercel AI SDK
 * Accepts optional user keys for BYOAPI support.
 */
export function getLanguageModel(providerOverride?: ProviderType, userKeys?: ResolvedKeys) {
  const provider = providerOverride || aiConfig.chat.provider;

  switch (provider) {
    case "openai":
      return createOpenAIProvider(userKeys?.openai)(aiConfig.chat.models.openai);
    case "anthropic":
      return createAnthropicProvider(userKeys?.anthropic)(aiConfig.chat.models.anthropic);
    case "openrouter":
      return createOpenRouterProvider(userKeys?.openrouter)(aiConfig.chat.models.openrouter);
    default:
      return createOpenRouterProvider(userKeys?.openrouter)(aiConfig.chat.models.openrouter);
  }
}

/**
 * Get specific model by ID (for OpenRouter)
 */
export function getOpenRouterModel(modelId: string, userKeys?: ResolvedKeys) {
  return createOpenRouterProvider(userKeys?.openrouter)(modelId);
}

/**
 * Get direct OpenAI model by ID
 */
export function getDirectOpenAIModel(modelId: string, userKeys?: ResolvedKeys) {
  return createOpenAIProvider(userKeys?.openai)(modelId);
}

/**
 * Get direct Anthropic/Claude model by ID
 */
export function getDirectAnthropicModel(modelId: string, userKeys?: ResolvedKeys) {
  return createAnthropicProvider(userKeys?.anthropic)(modelId);
}

/**
 * Smart model selector - automatically picks the right provider based on model ID.
 * Accepts optional user keys for BYOAPI support.
 *
 * Model ID formats:
 * - OpenRouter: contains "/" (e.g., "anthropic/claude-opus-4.5", "openai/gpt-5")
 * - Direct OpenAI: starts with "gpt-" or "o3" (e.g., "gpt-4.1", "o3-mini")
 * - Direct Anthropic: starts with "claude-" (e.g., "claude-opus-4-5-20251101")
 */
export function getModelByIdSmart(modelId: string, userKeys?: ResolvedKeys) {
  // Direct Moonshot/Kimi models (platform-managed, no BYOAPI)
  if (modelId.startsWith("kimi-")) {
    return moonshot(modelId);
  }

  // Perplexity models (sonar, sonar-pro, sonar-reasoning-pro)
  if (modelId.startsWith("sonar")) {
    return perplexity(modelId);
  }

  // OpenRouter models have a "/" in the ID
  if (modelId.includes("/")) {
    return createOpenRouterProvider(userKeys?.openrouter)(modelId);
  }

  // Direct OpenAI models
  if (modelId.startsWith("gpt-") || modelId.startsWith("o3") || modelId.startsWith("o1")) {
    return createOpenAIProvider(userKeys?.openai)(modelId);
  }

  // Direct Anthropic models
  if (modelId.startsWith("claude-")) {
    return createAnthropicProvider(userKeys?.anthropic)(modelId);
  }

  // Default to OpenRouter
  return createOpenRouterProvider(userKeys?.openrouter)(modelId);
}

// ===========================================
// LangChain Providers (for RAG & complex chains)
// ===========================================

/**
 * Get LangChain chat model
 * Accepts optional user keys for BYOAPI support.
 */
export function getChatModel(providerOverride?: ProviderType, userKeys?: ResolvedKeys) {
  const provider = providerOverride || aiConfig.chat.provider;

  switch (provider) {
    case "openai":
      return new ChatOpenAI({
        model: aiConfig.chat.models.openai,
        temperature: 0.7,
        apiKey: userKeys?.openai || process.env.OPENAI_API_KEY,
      });

    case "anthropic":
      return new ChatAnthropic({
        model: aiConfig.chat.models.anthropic,
        temperature: 0.7,
        apiKey: userKeys?.anthropic || process.env.ANTHROPIC_API_KEY,
      });

    case "openrouter":
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
        apiKey: userKeys?.openrouter || process.env.OPENROUTER_API_KEY,
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
        apiKey: userKeys?.openrouter || process.env.OPENROUTER_API_KEY,
      });
  }
}

/**
 * Get LangChain model for specific provider (for advanced use cases)
 */
export function getLangChainOpenRouterModel(modelId: string, userKeys?: ResolvedKeys) {
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
    apiKey: userKeys?.openrouter || process.env.OPENROUTER_API_KEY,
  });
}

// ===========================================
// Available OpenRouter Models (Reference)
// ===========================================

export const OPENROUTER_MODELS = {
  default: ["moonshotai/kimi-k2.5"],
  fast: [
    "moonshotai/kimi-k2.5",
    "openai/gpt-4.1-mini",
    "openai/gpt-4.1-nano",
    "anthropic/claude-haiku-4-5",
    "google/gemini-2.5-flash",
    "google/gemini-3-flash",
  ],
  balanced: [
    "moonshotai/kimi-k2.5",
    "openai/gpt-4.1",
    "anthropic/claude-sonnet-4",
    "google/gemini-3-flash",
    "meta-llama/llama-4-scout",
  ],
  capable: [
    "openai/gpt-5",
    "openai/o3",
    "anthropic/claude-opus-4.5",
    "google/gemini-3-pro",
    "meta-llama/llama-4-maverick",
  ],
  research: ["perplexity/sonar-pro", "perplexity/sonar"],
} as const;

/**
 * Get Perplexity model for research tasks
 */
export function getPerplexityModel(modelId: string = "sonar-pro") {
  return perplexity(modelId);
}
