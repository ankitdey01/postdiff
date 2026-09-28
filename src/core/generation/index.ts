// Engine: draft generation. Own thin interface; Vercel AI SDK + Groq underneath.
// Secrets (apiKey) passed in, never read here. Single-stage: full context in.

import { generateText, Output, streamText, type Telemetry } from "ai";
import { z } from "zod";
import { createGroq, groq, type GroqLanguageModelChatOptions } from "@ai-sdk/groq";
import type { CommitContext } from "../context/index.js";
import type { Platform } from "../../shared/types.js";
import { assemblePrompt } from "./assemble.js";
import { platformSpec } from "./platforms.js";
import { PREFERENCE_SYSTEM } from "../prompts.js";

export interface GenerateInput {
  platform: Platform;
  context: CommitContext;
  voiceDefault: string;
  voicePlatform: string;
  reference: string;
  /** Platform taste rules learned across commits (~/.tract/preferences/). */
  globalPreferences: string[];
}

export interface DraftResult {
  platform: Platform;
  body: string;
  model: string;
  ms: number;
  inputTokens: number | null;
  outputTokens: number | null;
  /** Unified stop reason from the SDK final step: stop | length | content-filter | tool-calls | error | other. */
  finishReason: string;
  /** Raw provider stop reason (e.g. model limit reached). Null when the provider sends none. */
  rawFinishReason: string | null;
  /** Number of SDK steps taken (browse + text). Lets empty drafts be told apart from short ones. */
  steps: number;
  /** Provider warnings for all steps (e.g. unsupported settings). Empty when none. */
  warnings: unknown[];
}

export interface Generator {
  generate(input: GenerateInput): Promise<DraftResult>;
  /**
   * Same as generate, but each text delta is pushed to onChunk as it arrives
   * so the caller (CLI) can display it live. Engine stays UI-agnostic: it
   * never writes to stdout itself. Files are still the caller's job, after.
   */
  generateStream(input: GenerateInput, onChunk: (chunk: string) => void): Promise<DraftResult>;
  /** Raw single-shot text call (no tools): small jobs. */
  complete(system: string, prompt: string): Promise<string>;
  /**
   * Accept-path rule distiller: one style-only rule for the global
   * preferences file, 50 words / 300 chars max. Empty when nothing generalizes.
   */
  summarizeAccept(oldContent: string, newContent: string): Promise<string>;
}

/** Cap for a distilled global rule: 50 words, 300 chars, whichever binds first. */
export const MAX_RULE_WORDS = 50;
export const MAX_RULE_CHARS = 300;

/** First-50-words-then-300-chars truncation, so over-long returns never bloat the file. */
export function truncateRule(rule: string): string {
  const words = rule.trim().split(/\s+/).filter(Boolean).slice(0, MAX_RULE_WORDS).join(" ");
  return words.slice(0, MAX_RULE_CHARS).trim();
}

const AcceptRuleSchema = z.object({
  rule: z
    .string()
    .max(MAX_RULE_CHARS)
    .describe("ONE reusable style rule for this platform learned from the edit (voice, structure, rhythm, length). 50 words or less, plain text, no markdown. No facts, names, numbers, or commit specifics. Empty string when nothing generalizes."),
});

export interface GeneratorOptions {
  /** Per-call telemetry integrations (e.g. DevTools capture). Empty/undefined = off. */
  telemetry?: Telemetry[];
}

export class GroqGenerator implements Generator {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly opts: GeneratorOptions = {}
  ) {}

  /** Per-call telemetry passthrough. Undefined = SDK default (off unless globally registered). */
  private telemetryFor(functionId: string): { functionId: string; integrations: Telemetry[] } | undefined {
    if (!this.opts.telemetry || this.opts.telemetry.length === 0) return undefined;
    return { functionId, integrations: this.opts.telemetry };
  }

  async generate(input: GenerateInput): Promise<DraftResult> {
    return this.generateStream(input, () => {});
  }

  async generateStream(input: GenerateInput, onChunk: (chunk: string) => void): Promise<DraftResult> {
    const provider = this.apiKey ? createGroq({ apiKey: this.apiKey }) : groq;
    const { system, prompt } = assemblePrompt(input.platform, input.context, input.voiceDefault, input.voicePlatform, input.reference, input.globalPreferences);
    const started = Date.now();
    // Note: no toolChoice — browser_search is provider-executed, so the model
    // never emits an SDK-visible tool call; `required` would always throw.
    // textStream yields deltas live; the promise-likes below resolve once the
    // stream is fully consumed.
    const result = streamText({
      model: provider(this.model),
      system,
      prompt,
      tools: { browser_search: groq.tools.browserSearch({}) },
      telemetry: this.telemetryFor(`generate-${input.platform}`),
      // Browse sessions bill as input tokens (observed 600k+ on high effort).
      // Low effort keeps search useful without torching the daily quota.
      providerOptions: {
        groq: { reasoningEffort: "medium" } satisfies GroqLanguageModelChatOptions,
      },
    });
    for await (const delta of result.textStream) onChunk(delta);
    const [text, usage, finishReason, rawFinishReason, warnings, steps] = await Promise.all([
      result.text,
      result.usage,
      result.finishReason,
      result.rawFinishReason,
      result.warnings,
      result.steps,
    ]);
    return {
      platform: input.platform,
      body: text.trim(),
      model: this.model,
      ms: Date.now() - started,
      inputTokens: usage?.inputTokens ?? null,
      outputTokens: usage?.outputTokens ?? null,
      finishReason,
      rawFinishReason: rawFinishReason ?? null,
      steps: steps.length,
      warnings: warnings ?? [],
    };
  }

  async complete(system: string, prompt: string): Promise<string> {
    const provider = this.apiKey ? createGroq({ apiKey: this.apiKey }) : groq;
    const result = await generateText({
      model: provider(this.model),
      system,
      prompt,
      telemetry: this.telemetryFor("complete"),
    });
    return result.text.trim();
  }

  async summarizeAccept(oldContent: string, newContent: string): Promise<string> {
    const provider = this.apiKey ? createGroq({ apiKey: this.apiKey }) : groq;
    const system = PREFERENCE_SYSTEM;
    const prompt = ["OLD DRAFT (what the model wrote):", oldContent, "", "NEW DRAFT (the author's edited version):", newContent].join("\n");
    try {
      const result = await generateText({
        model: provider(this.model),
        system,
        prompt,
        output: Output.object({ schema: AcceptRuleSchema }),
        telemetry: this.telemetryFor("summarize-accept"),
      });
      return truncateRule(result.output.rule);
    } catch {
      // Schema path unsupported — degrade to raw text, truncated the same way.
      const fallback = await this.complete(system, prompt);
      return truncateRule(fallback);
    }
  }
}

export function platformDraftFile(platform: Platform): `${Platform}.md` {
  return platformSpec(platform).file;
}
