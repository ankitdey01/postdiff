// Engine: draft generation. Owns the thin Generator interface; the Vercel AI
// SDK sits underneath with the transport picked from the provider registry in
// providers.ts. Secrets (apiKey) passed in, never read here. Single-stage:
// full context in.

import { generateText, Output, streamText, type Telemetry, type Tool } from "ai";
import { z } from "zod";
import { getProviderSpec, type ProviderRuntime } from "./providers.js";
import type { CommitContext } from "../source/context.js";
import type { Platform } from "../shared/types.js";
import { assemblePrompt } from "./assemble.js";
import { platformSpec } from "./platforms.js";
import { PREFERENCE_SYSTEM, REJECT_RULE_SYSTEM, SUMMARY_SYSTEM } from "../prompts.js";
import { SummarySchema, type CommitSummary } from "../summary/summary.js";

export interface SummaryInput {
  commitMessage: string;
  previousCommitMessage: string | null;
  /** Filtered diff (post Stage-2 inclusion) — the only diff the summarizer reads. */
  diff: string;
  readme: string | null;
  /** Filename list for scope grounding. */
  files: string[];
}

export interface GenerateInput {
  platform: Platform;
  context: CommitContext;
  /** Rendered change brief — the ONLY change record the writer sees. */
  summary: string;
  voiceDefault: string;
  voicePlatform: string;
  reference: string;
  /** Platform taste rules learned across commits (~/.postdiff/preferences/). */
  globalPreferences: string[];
  /** Repo README at the commit, if present. Null = absent, section omitted. */
  readme?: string | null;
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
  /**
   * Web-search outcome: off (flag absent or unsupported), on (tool attached
   * and the call succeeded), fallback (tool attached but the call failed, so
   * the draft was retried without it — see webError).
   */
  webSearch: "off" | "on" | "fallback";
  /** Underlying error when webSearch is fallback. Null otherwise. */
  webError: string | null;
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
   * Once-per-sha change brief builder: structured factual summary of the
   * filtered diff. No voice, no tools, no web search — facts only.
   */
  buildSummary(input: SummaryInput): Promise<CommitSummary>;
  /**
   * Accept-path rule distiller: one style-only rule for the global
   * preferences file, 50 words / 300 chars max. Empty when nothing generalizes.
   */
  summarizeAccept(oldContent: string, newContent: string): Promise<string>;
  /**
   * Reject-path rule distiller: turns a messy free-form complaint into ONE
   * clean imperative style rule for the global preferences file. Falls back
   * to the trimmed reason when distillation fails — the verdict never fails
   * because of this call.
   */
  distillReject(reason: string): Promise<string>;
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

const RejectRuleSchema = z.object({
  rule: z
    .string()
    .max(MAX_RULE_CHARS)
    .describe("ONE reusable imperative style rule distilled from the user's complaint (voice, structure, rhythm, length). 50 words or less, plain text, no markdown. No facts, names, numbers, or commit specifics. Empty string when nothing generalizes."),
});

export interface GeneratorOptions {
  /** Per-call telemetry integrations (e.g. DevTools capture). Empty/undefined = off. */
  telemetry?: Telemetry[];
  /**
   * Attach the provider's server-side web-search tool as `browser_search`.
   * Off unless explicitly true (--web). Providers/models without a search
   * tool silently stay tool-free; the pipeline warns about that, not here.
   */
  webSearch?: boolean;
}

export class SdkGenerator implements Generator {
  private runtimePromise?: Promise<ProviderRuntime>;

  constructor(
    /** Provider id from the registry (providers.ts), e.g. "groq". */
    private readonly providerId: string,
    private readonly apiKey: string,
    private readonly model: string,
    private readonly opts: GeneratorOptions = {}
  ) {}

  /** Resolved provider runtime, memoized per generator instance. */
  private runtime(): Promise<ProviderRuntime> {
    this.runtimePromise ??= (async () => {
      const spec = getProviderSpec(this.providerId);
      if (!spec) throw new Error(`Unknown generation provider "${this.providerId}" — run \`postdiff setup\`.`);
      return spec.load(this.apiKey);
    })();
    return this.runtimePromise;
  }

  /** Per-call telemetry passthrough. Undefined = SDK default (off unless globally registered). */
  private telemetryFor(functionId: string): { functionId: string; integrations: Telemetry[] } | undefined {
    if (!this.opts.telemetry || this.opts.telemetry.length === 0) return undefined;
    return { functionId, integrations: this.opts.telemetry };
  }

  async generate(input: GenerateInput): Promise<DraftResult> {
    return this.generateStream(input, () => {});
  }

  async generateStream(input: GenerateInput, onChunk: (chunk: string) => void): Promise<DraftResult> {
    const started = Date.now();
    const runtime = await this.runtime();
    // Opt-in only: the tool attaches when --web was passed AND the
    // provider/model actually has a server-side search. (Registry keeps
    // supportsWebSearch consistent with webSearch, so null here just means
    // off — no warning from this layer.)
    // Note: no toolChoice — browser_search is provider-executed, so the model
    // never emits an SDK-visible tool call; `required` would always throw.
    const searchTool = this.opts.webSearch === true ? runtime.webSearch(this.model) : null;
    const webAttached = searchTool !== null;
    const { system, prompt } = assemblePrompt(
      input.platform,
      input.context,
      input.voiceDefault,
      input.voicePlatform,
      input.reference,
      input.globalPreferences,
      { webSearch: webAttached, readme: input.readme ?? null, summary: input.summary },
    );
    // TextStream yields deltas live and the promise-likes below resolve once
    // the stream is fully consumed.
    try {
      const draft = await this.runStream(input, runtime, system, prompt, searchTool, onChunk, started);
      return { ...draft, webSearch: webAttached ? "on" : "off", webError: null };
    } catch (err) {
      if (!webAttached) throw err;
      // Web path failed (unsupported model behind the id, provider outage,
      // quota…) — retry once without tools so the user still gets a draft.
      // The pipeline turns webError into a visible warning. Note: chunks
      // already streamed before the failure stay on screen, so the terminal
      // may show a partial fragment followed by the complete retry — the
      // saved draft and closing note always carry the final text only.
      const webError = err instanceof Error ? err.message : String(err);
      const draft = await this.runStream(input, runtime, system, prompt, null, onChunk, started);
      return { ...draft, webSearch: "fallback", webError };
    }
  }

  private async runStream(
    input: GenerateInput,
    runtime: ProviderRuntime,
    system: string,
    prompt: string,
    searchTool: Tool | null,
    onChunk: (chunk: string) => void,
    started: number,
  ): Promise<Omit<DraftResult, "webSearch" | "webError">> {
    const result = streamText({
      model: runtime.model(this.model),
      system,
      prompt,
      tools: searchTool ? { browser_search: searchTool } : undefined,
      telemetry: this.telemetryFor(`generate-${input.platform}`),
      providerOptions: runtime.providerOptions,
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
    const result = await generateText({
      model: (await this.runtime()).model(this.model),
      system,
      prompt,
      telemetry: this.telemetryFor("complete"),
    });
    return result.text.trim();
  }

  async buildSummary(input: SummaryInput): Promise<CommitSummary> {
    const prompt = [
      `Commit message: ${input.commitMessage || "(empty)"}`,
      input.previousCommitMessage ? `Previous commit message: ${input.previousCommitMessage.split("\n")[0]}` : "Previous commit: none (root commit).",
      "",
      ...(input.readme ? ["Project context (README.md):", input.readme, ""] : []),
      "Changed files:",
      input.files.length > 0 ? input.files.map((f) => `- ${f}`).join("\n") : "(none)",
      "",
      "Diff:",
      input.diff || "(empty diff)",
    ].join("\n");
    const attempt = async (): Promise<CommitSummary> => {
      const result = await generateText({
        model: (await this.runtime()).model(this.model),
        system: SUMMARY_SYSTEM,
        prompt,
        // Detailed brief needs room: without an explicit cap the provider
        // default truncates mid-JSON and schema validation fails on the
        // missing tail fields (userImpact, storyHooks, …).
        maxOutputTokens: 10000,
        output: Output.object({ schema: SummarySchema }),
        telemetry: this.telemetryFor("build-summary"),
      });
      return result.output;
    };
    try {
      return await attempt();
    } catch {
      // Transient failure (schema path unsupported, overload…) — one retry,
      // then the pipeline hard-fails so a bad brief never poisons drafts.
      return await attempt();
    }
  }

  async summarizeAccept(oldContent: string, newContent: string): Promise<string> {
    const system = PREFERENCE_SYSTEM;
    const prompt = ["OLD DRAFT (what the model wrote):", oldContent, "", "NEW DRAFT (the author's edited version):", newContent].join("\n");
    try {
      const result = await generateText({
        model: (await this.runtime()).model(this.model),
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

  async distillReject(reason: string): Promise<string> {
    const system = REJECT_RULE_SYSTEM;
    const prompt = ["USER COMPLAINT (free-form, may be vague or misspelled):", reason].join("\n");
    try {
      const result = await generateText({
        model: (await this.runtime()).model(this.model),
        system,
        prompt,
        output: Output.object({ schema: RejectRuleSchema }),
        telemetry: this.telemetryFor("distill-reject"),
      });
      const rule = truncateRule(result.output.rule);
      // Model found nothing generalizable — keep the author's own words.
      return rule || truncateRule(reason.trim());
    } catch {
      // Schema path unsupported or call failed — author's words, verbatim.
      try {
        const fallback = await this.complete(system, prompt);
        return truncateRule(fallback) || truncateRule(reason.trim());
      } catch {
        return truncateRule(reason.trim());
      }
    }
  }
}

export function platformDraftFile(platform: Platform): `${Platform}.md` {
  return platformSpec(platform).file;
}

/** Pre-multi-provider name, kept as an alias. Constructor now takes the provider id first. */
export const GroqGenerator = SdkGenerator;
