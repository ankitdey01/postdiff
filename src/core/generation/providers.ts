// Engine: generation provider registry. Metadata (labels, env keys, curated
// models) is cheap and safe to import anywhere — the heavyweight @ai-sdk
// packages load lazily inside `load()`, so CLI paths that never touch a model
// don't pay for ten provider packages at startup.
//
// Web search is provider-specific by design (grill-me decision): each spec
// declares which models support a server-side search tool and how to build
// it. Providers without one return null and the pipeline warns instead of
// failing. Search tools are provider-executed (the model never emits an
// SDK-visible tool call) and bill to the same key as generation.

import type { LanguageModel, Tool } from "ai";
import type { ProviderOptions } from "@ai-sdk/provider-utils";
import type { GroqLanguageModelChatOptions } from "@ai-sdk/groq";

// Each @ai-sdk provider package pins an exact @ai-sdk/provider-utils patch
// version, so node_modules holds several copies at once. The copies' nominal
// `schemaSymbol` differs, making a tool typed by one copy unnameable as
// `Tool` by another — but the wire format is identical. The casts below are
// that compatibility seam, kept at this registry boundary and nowhere else.

/** What a loaded provider can do — bound to one API key. */
export interface ProviderRuntime {
  /** Model handle for a model id. */
  model(modelId: string): LanguageModel;
  /**
   * Server-side web-search tool for the model, or null when this
   * provider/model cannot search. Attached as `browser_search`.
   */
  webSearch(modelId: string): Tool | null;
  /** Extra providerOptions merged into generate calls (undefined = none). */
  providerOptions?: ProviderOptions;
}

export interface ProviderSpec {
  readonly id: string;
  readonly label: string;
  /** Env var the key lives in (real env, cwd/.env, or ~/.postdiff/.env). */
  readonly envKey: string;
  /** Where the user creates a key — shown by the setup wizard. */
  readonly keysUrl: string;
  /** Curated model ids, recommended first; the first entry is the default. */
  readonly models: readonly string[];
  /** Whether this model id can attach the provider's server-side search tool. */
  readonly supportsWebSearch: (modelId: string) => boolean;
  /** Loads the SDK factory with the key and binds model + search tool. */
  load(apiKey: string): Promise<ProviderRuntime>;
}

const matches = (re: RegExp) => (modelId: string) => re.test(modelId);

export const PROVIDERS: readonly ProviderSpec[] = [
  {
    id: "groq",
    label: "Groq",
    envKey: "GROQ_KEY",
    keysUrl: "https://console.groq.com/keys",
    models: [
      "openai/gpt-oss-20b",
      "openai/gpt-oss-120b",
      "qwen/qwen3.8-27b",
    ],
    supportsWebSearch: matches(/gpt-oss/),
    async load(apiKey) {
      const { createGroq } = await import("@ai-sdk/groq");
      const groq = createGroq({ apiKey });
      return {
        model: (modelId) => groq(modelId),
        // browser_search is provider-executed and gpt-oss-only; other Groq
        // models never see the tool.
        webSearch: (modelId) => (modelId.includes("gpt-oss") ? (groq.tools.browserSearch({}) as unknown as Tool) : null),
        // Browse sessions bill as input tokens (observed 600k+ on high effort).
        // Low effort keeps search useful without torching the daily quota.
        providerOptions: { groq: { reasoningEffort: "low" } satisfies GroqLanguageModelChatOptions },
      };
    },
  },
  {
    id: "openai",
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    keysUrl: "https://platform.openai.com/api-keys",
    models: ["gpt-5.5", "gpt-5.4-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini"],
    supportsWebSearch: () => true,
    async load(apiKey) {
      const { createOpenAI } = await import("@ai-sdk/openai");
      const openai = createOpenAI({ apiKey });
      return {
        // The default call surface is the Responses API — exactly what
        // tools.webSearch rides on.
        model: (modelId) => openai(modelId),
        webSearch: () => openai.tools.webSearch() as unknown as Tool,
      };
    },
  },
  {
    id: "anthropic",
    label: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
    keysUrl: "https://console.anthropic.com/settings/keys",
    models: ["claude-sonnet-5-5", "claude-haiku-4-5", "claude-opus-5-5"],
    supportsWebSearch: () => true,
    async load(apiKey) {
      const { createAnthropic } = await import("@ai-sdk/anthropic");
      const anthropic = createAnthropic({ apiKey });
      return {
        model: (modelId) => anthropic(modelId),
        // Server-side web search bills per search, not per token.
        webSearch: () => anthropic.tools.webSearch_20250305({ maxUses: 2 }) as unknown as Tool,
      };
    },
  },
  {
    id: "google",
    label: "Google Gemini",
    envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    keysUrl: "https://aistudio.google.com/apikey",
    models: ["gemini-3.8-flash", "gemini-2.5-pro", "gemini-3.5-flash-lite"],
    supportsWebSearch: () => true,
    async load(apiKey) {
      const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
      const google = createGoogleGenerativeAI({ apiKey });
      return {
        model: (modelId) => google(modelId),
        // Gemini grounding (googleSearch) as the server-side search tool.
        webSearch: () => google.tools.googleSearch({}) as unknown as Tool,
      };
    },
  },
  {
    id: "xai",
    label: "xAI Grok",
    envKey: "XAI_API_KEY",
    keysUrl: "https://console.x.ai",
    models: ["grok-4.7", "grok-4.5", "grok-4.3"],
    supportsWebSearch: () => true,
    async load(apiKey) {
      const { createXai } = await import("@ai-sdk/xai");
      const xai = createXai({ apiKey });
      return {
        model: (modelId) => xai(modelId),
        webSearch: () => xai.tools.webSearch() as unknown as Tool,
      };
    },
  },
  {
    id: "mistral",
    label: "Mistral",
    envKey: "MISTRAL_API_KEY",
    keysUrl: "https://console.mistral.ai/api-keys",
    models: ["mistral-large-latest", "mistral-small-latest", "ministral-8b-latest"],
    supportsWebSearch: () => false,
    async load(apiKey) {
      const { createMistral } = await import("@ai-sdk/mistral");
      const mistral = createMistral({ apiKey });
      return { model: (modelId) => mistral(modelId), webSearch: () => null };
    },
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    envKey: "DEEPSEEK_API_KEY",
    keysUrl: "https://platform.deepseek.com/api_keys",
    models: ["deepseek-flash", "deepseek-v4-pro"],
    supportsWebSearch: () => false,
    async load(apiKey) {
      const { createDeepSeek } = await import("@ai-sdk/deepseek");
      const deepseek = createDeepSeek({ apiKey });
      return { model: (modelId) => deepseek(modelId), webSearch: () => null };
    },
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
    keysUrl: "https://openrouter.ai/keys",
    // Any model id on openrouter.ai/models works via the wizard's custom input.
    models: [
      "openai/gpt-4o-mini",
      "openai/gpt-5.5",
      "anthropic/claude-sonnet-5.5",
      "google/gemini-3.8-flash",
      "meta-llama/llama-3.3-70b-instruct",
      "deepseek/deepseek-flash",
    ],
    supportsWebSearch: () => true,
    async load(apiKey) {
      const { createOpenRouter } = await import("@openrouter/ai-sdk-provider");
      const openrouter = createOpenRouter({ apiKey });
      return {
        model: (modelId) => openrouter(modelId),
        // OpenRouter server-side web search. Availability is per underlying
        // model — when the model behind the id can't search, the call fails
        // and the generator retries without tools (warned, never fatal).
        webSearch: () => openrouter.tools.webSearch({ maxResults: 5 }) as unknown as Tool,
      };
    },
  },
  {
    id: "together",
    label: "Together.ai",
    envKey: "TOGETHER_API_KEY",
    keysUrl: "https://api.together.xyz/settings/api-keys",
    models: [
      "meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo",
      "deepseek-ai/DeepSeek-V4.1-Flash",
    ],
    supportsWebSearch: () => false,
    async load(apiKey) {
      const { createTogetherAI } = await import("@ai-sdk/togetherai");
      const together = createTogetherAI({ apiKey });
      return { model: (modelId) => together(modelId), webSearch: () => null };
    },
  },
  {
    id: "fireworks",
    label: "Fireworks",
    envKey: "FIREWORKS_API_KEY",
    keysUrl: "https://fireworks.ai/account/api-keys",
    models: [
      "accounts/fireworks/models/llama-v3p3-70b-instruct",
      "accounts/fireworks/models/deepseek-v4p1-flash",
      "accounts/fireworks/models/qwen2p5-72b-instruct",
    ],
    supportsWebSearch: () => false,
    async load(apiKey) {
      const { createFireworks } = await import("@ai-sdk/fireworks");
      const fireworks = createFireworks({ apiKey });
      return { model: (modelId) => fireworks(modelId), webSearch: () => null };
    },
  },
];

export function getProviderSpec(id: string): ProviderSpec | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

/** providerId → env var name, for env parsing in cli/keys.ts. */
export function providerEnvKeys(): Record<string, string> {
  return Object.fromEntries(PROVIDERS.map((p) => [p.id, p.envKey]));
}
