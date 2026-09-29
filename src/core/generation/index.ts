// Engine: draft generation. Own thin interface; Vercel AI SDK + Groq underneath.
import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import { loadOrGatherCommitContext, saveCommitContext } from "../context/index.js";
import { getRepoSlug, getTractHome, loadConfig, saveMeta, hashDiff, type DraftMeta } from "../store/index.js";
import { JevSignificanceJudge, JevInclusionJudge, judgeSignificance, filterShapedDiff, type SignificanceResult } from "../significance/index.js";
import { readVoiceFile } from "../voice/index.js";
import { readReferenceFile, platformReferenceFile } from "../reference/index.js";
import { readPreferenceFile, splitPreferenceRules, platformPreferenceFile } from "../preferences/index.js";
import { readReviewState, initReview } from "../review/index.js";
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

  private get provider() {
    return this.apiKey ? createGroq({ apiKey: this.apiKey }) : groq;
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
    const { system, prompt } = assemblePrompt(input.platform, input.context, input.voiceDefault, input.voicePlatform, input.reference, input.globalPreferences);
    const started = Date.now();
    // Note: no toolChoice — browser_search is provider-executed, so the model
    // never emits an SDK-visible tool call; `required` would always throw.
    // textStream yields deltas live; the promise-likes below resolve once the
    // stream is fully consumed.
    const result = streamText({
      model: this.provider(this.model),
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
    const result = await generateText({
      model: this.provider(this.model),
      system,
      prompt,
      telemetry: this.telemetryFor("complete"),
    });
    return result.text.trim();
  }

  async summarizeAccept(oldContent: string, newContent: string): Promise<string> {
    const system = PREFERENCE_SYSTEM;
    const prompt = ["OLD DRAFT (what the model wrote):", oldContent, "", "NEW DRAFT (the author's edited version):", newContent].join("\n");
    try {
      const result = await generateText({
        model: this.provider(this.model),
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

/* ── generate pipeline: full significance → filter → draft → persist ── */

/** Inputs the caller (CLI, TUI, extension) supplies. Secrets are explicit. */
export interface PipelineInput {
  cwd: string;
  shaOrHead: string;
  platform: Platform | null;
  force: boolean;
  jevKey: string;
  groqKey: string;
  /** Telemetry integrations (DevTools etc.). Empty = off. */
  telemetry: Telemetry[];
}

/** Structured events emitted during the pipeline so the caller can render. */
export interface PipelineEvent {
  kind:
    | "context-loaded"
    | "significance-judged"
    | "meta-saved"
    | "filter-cached"
    | "filter-ran"
    | "filter-skipped"
    | "preferences-loaded"
    | "gen-model-warning"
    | "drafting"
    | "review-superseded";
  message: string;
  data?: Record<string, unknown>;
}

/** Discriminated result union. Caller checks `status` to decide exit code / display. */
export type PipelineResult =
  | { status: "empty-diff"; sha: string }
  | { status: "missing-jev-key" }
  | { status: "not-significant"; significance: SignificanceResult; sha: string; metaDir: string }
  | { status: "no-platform"; significance: SignificanceResult; sha: string; metaDir: string }
  | { status: "missing-groq-key" }
  | { status: "filter-empty"; sha: string; metaDir: string }
  | { status: "empty-draft"; draft: DraftResult; metaDir: string; genPayloadPath: string }
  | { status: "ok"; draft: DraftResult; draftPath: string; metaDir: string; prevReviewSuperseded: boolean };

/**
 * Full generate pipeline: context → Jev significance → inclusion filter → LLM draft → persist → review init.
 *
 * UI-agnostic: no stdout, no process.exitCode, no chalk. Emits structured
 * events via `onEvent` and streaming text via `onChunk`; returns a
 * discriminated result the caller maps to its own output surface.
 */
export async function generatePipeline(
  input: PipelineInput,
  onChunk: (chunk: string) => void,
  onEvent?: (event: PipelineEvent) => void,
): Promise<PipelineResult> {
  const emit = onEvent ?? (() => {});

  // 1. Context
  const { context, source } = await loadOrGatherCommitContext(input.cwd, input.shaOrHead);
  emit({ kind: "context-loaded", message: `context: ${source} — ${context.sha.slice(0, 8)}` });

  if (!context.shapedDiff.trim()) {
    return { status: "empty-diff", sha: context.sha };
  }

  // 2. Significance gate
  const config = await loadConfig();
  if (!input.force && !input.jevKey) {
    return { status: "missing-jev-key" };
  }
  const sigResult = await judgeSignificance(
    { diff: context.shapedDiff, commitMessage: context.commitMessage, filesChanged: context.filesChanged },
    { threshold: config.threshold, force: input.force, judge: input.jevKey ? new JevSignificanceJudge(input.jevKey, config.jevModel) : undefined },
  );

  const slug = await getRepoSlug(input.cwd);
  const baseMeta: DraftMeta = {
    sha: context.sha,
    diffHash: hashDiff(context.shapedDiff),
    noul: sigResult.noul,
    threshold: sigResult.threshold,
    verdict: sigResult.verdict,
    forced: sigResult.forced,
    forcedReason: sigResult.forcedReason,
    model: config.jevModel,
    includeThreshold: null,
    keptFiles: 0,
    droppedFiles: 0,
    at: new Date().toISOString(),
  };
  const dir = await saveMeta(slug, context.sha, baseMeta);

  emit({ kind: "significance-judged", message: formatSignificance(sigResult, context.sha, input.force), data: { forced: sigResult.forced, forcedReason: sigResult.forcedReason } });
  emit({ kind: "meta-saved", message: `meta: ${dir}` });

  if (sigResult.verdict === "fail") {
    return { status: "not-significant", significance: sigResult, sha: context.sha, metaDir: dir };
  }

  // 3. Platform check
  if (input.platform === null) {
    return { status: "no-platform", significance: sigResult, sha: context.sha, metaDir: dir };
  }
  const platform = input.platform;

  if (!input.groqKey) {
    return { status: "missing-groq-key" };
  }

  // 4. Load voice, reference, preferences, previous review
  const home = getTractHome();
  if (!config.genModel.includes("gpt-oss")) {
    emit({ kind: "gen-model-warning", message: `warning: genModel "${config.genModel}" is not gpt-oss — browser search is silently inactive.` });
  }
  const [voiceDefault, voicePlatform, prevReview, globalRulesRaw, reference] = await Promise.all([
    readVoiceFile(join(home, "voice"), "voice.md"),
    readVoiceFile(join(home, "voice"), platformDraftFile(platform)),
    readReviewState(dir, platform),
    readPreferenceFile(join(home, "preferences"), platformPreferenceFile(platform)),
    readReferenceFile(join(home, "reference"), platformReferenceFile(platform)),
  ]);
  const globalPreferences = splitPreferenceRules(globalRulesRaw);
  if (globalPreferences.length > 0) {
    emit({ kind: "preferences-loaded", message: `applying ${globalPreferences.length} platform taste rule(s).` });
  }

  // 5. Stage 2 inclusion filter
  let genDiff = context.shapedDiff;
  if (context.filteredShapedDiff !== null) {
    genDiff = context.filteredShapedDiff;
    emit({ kind: "filter-cached", message: `filter: cached (${genDiff.length} chars)` });
  } else if (input.jevKey) {
    const inclusion = await filterShapedDiff(context.shapedDiff, {
      judge: new JevInclusionJudge(input.jevKey, config.jevModel),
    });
    if (inclusion.forcedReason) {
      emit({ kind: "filter-ran", message: `warning: ${inclusion.forcedReason}` });
    }
    if (!inclusion.filtered.trim()) {
      await saveMeta(slug, context.sha, { ...baseMeta, keptFiles: 0, droppedFiles: inclusion.droppedFiles, at: new Date().toISOString() });
      return { status: "filter-empty", sha: context.sha, metaDir: dir };
    }
    genDiff = inclusion.filtered;
    emit({ kind: "filter-ran", message: `filter: kept ${inclusion.keptFiles}/${inclusion.keptFiles + inclusion.droppedFiles} files (threshold=${inclusion.thresholdUsed})` });
    if (!inclusion.forcedReason) {
      await saveCommitContext(home, slug, { ...context, filteredShapedDiff: inclusion.filtered });
    }
    await saveMeta(slug, context.sha, {
      ...baseMeta,
      includeThreshold: inclusion.thresholdUsed,
      keptFiles: inclusion.keptFiles,
      droppedFiles: inclusion.droppedFiles,
      at: new Date().toISOString(),
    });
  } else {
    emit({ kind: "filter-skipped", message: "(no TYPESAFE_API_KEY — skipping per-file filter, full diff to generation)" });
  }

  // 6. Generate draft
  const genContext = { ...context, shapedDiff: genDiff };
  emit({ kind: "drafting", message: `drafting ${platform} (streaming) —` });
  const draft = await new GroqGenerator(input.groqKey, config.genModel, { telemetry: input.telemetry }).generateStream(
    { platform, context: genContext, voiceDefault, voicePlatform, reference, globalPreferences },
    onChunk,
  );

  // 7. Persist draft + gen metadata
  const genPayload = {
    platform,
    model: draft.model,
    ms: draft.ms,
    inputTokens: draft.inputTokens,
    outputTokens: draft.outputTokens,
    finishReason: draft.finishReason,
    rawFinishReason: draft.rawFinishReason,
    steps: draft.steps,
    warnings: draft.warnings,
    at: new Date().toISOString(),
  };

  const genJsonPath = join(dir, `gen-${platform}.json`);
  if (!draft.body.trim()) {
    await writeFile(genJsonPath, JSON.stringify({ ...genPayload, error: "empty draft — no text in final step" }, null, 2) + "\n", "utf8");
    return { status: "empty-draft", draft, metaDir: dir, genPayloadPath: genJsonPath };
  }

  const draftText = draft.body.endsWith("\n") ? draft.body : draft.body + "\n";
  const draftPath = join(dir, platformDraftFile(platform));
  await Promise.all([
    writeFile(draftPath, draftText, "utf8"),
    writeFile(genJsonPath, JSON.stringify(genPayload, null, 2) + "\n", "utf8"),
  ]);

  // 8. Init review lineage
  await initReview(dir, platform, draftText);
  const prevReviewSuperseded = prevReview !== null && prevReview.versions.some((v) => v.status !== "pending");
  if (prevReviewSuperseded) {
    emit({
      kind: "review-superseded",
      message: `previous review (${prevReview!.versions[prevReview!.versions.length - 1]?.status}) superseded — new draft needs review.`,
    });
  }

  return { status: "ok", draft, draftPath, metaDir: dir, prevReviewSuperseded };
}

function formatSignificance(r: SignificanceResult, sha: string, force: boolean): string {
  const prefix = force ? "(--force: Jev gate bypassed) " : "";
  const warn = r.forced && r.forcedReason && !force ? `warning: ${r.forcedReason}\n` : "";
  const score = r.noul === null ? "" : ` (noul=${r.noul.toFixed(3)} ${r.verdict === "pass" ? ">=" : "<"} ${r.threshold})`;
  const label = r.verdict === "pass" ? "significant" : "not significant";
  return `${warn}${prefix}${label}${score} — ${sha.slice(0, 8)}`;
}
