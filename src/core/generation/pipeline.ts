// Engine: full generate pipeline — context → significance → filter → summary
// → draft → persist → review init. Orchestration only; the model wrapper lives in
// generator.ts. UI-agnostic: no stdout, no process.exitCode. Emits structured
// events via `onEvent` and streaming text via `onChunk`; returns a
// discriminated result the caller maps to its own output surface.

import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import { loadOrGatherCommitContext, saveCommitContext, cleanText } from "../source/context.js";
import { readFileAtCommit } from "../source/git.js";
import { getRepoSlug, getPostdiffHome, loadConfig, saveMeta, hashDiff, type DraftMeta } from "../store.js";
import {
  JevSignificanceJudge,
  judgeSignificance,
  type SignificanceResult,
} from "../significance/gate.js";
import { JevInclusionJudge, filterShapedDiff } from "../significance/inclusion.js";
import { readVoiceFile } from "../profile/voice.js";
import { readReferenceFile, platformReferenceFile } from "../profile/reference.js";
import { readPreferenceFile, splitPreferenceRules, platformPreferenceFile } from "../profile/preferences.js";
import { readReviewState, initReview } from "../delivery/review.js";
import { SdkGenerator, platformDraftFile } from "./generator.js";
import { getProviderSpec } from "./providers.js";
import { MIN_SUMMARY_CHARS, SUMMARY_SCHEMA, hashSummaryInput, loadSummary, renderSummary, saveSummary } from "../summary/summary.js";
import type { DraftResult, GeneratorOptions } from "./generator.js";
import type { Platform } from "../../shared/types.js";
import type { Telemetry } from "ai";

/** Inputs the caller (CLI, TUI, extension) supplies. Secrets are explicit. */
export interface PipelineInput {
  cwd: string;
  shaOrHead: string;
  platform: Platform | null;
  force: boolean;
  /** Opt-in web search (--web). Off = prompt and tool stay search-free. */
  web: boolean;
  /** Rebuild the cached change brief even on cache hit (--fresh). */
  fresh: boolean;
  jevKey: string;
  /** Resolved provider API keys, keyed by env var name (GROQ_KEY, OPENAI_API_KEY, …). */
  providerKeys: Record<string, string>;
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
    | "summary-building"
    | "summary-cached"
    | "summary-built"
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
  | { status: "missing-gen-key"; provider: string; envKey: string }
  | { status: "unknown-provider"; provider: string }
  | { status: "filter-empty"; sha: string; metaDir: string }
  | { status: "summary-failed"; reason: string; sha: string; metaDir: string }
  | { status: "empty-draft"; draft: DraftResult; metaDir: string; genPayloadPath: string }
  | { status: "ok"; draft: DraftResult; draftPath: string; metaDir: string; prevReviewSuperseded: boolean };

/**
 * Full generate pipeline: context → Jev significance → inclusion filter →
 * change-brief summary → summary-only LLM draft → persist → review init.
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
    { diff: context.shapedDiff, commitMessage: context.commitMessage, filesChanged: context.filesChanged },      { threshold: config.models.threshold, force: input.force, judge: input.jevKey ? new JevSignificanceJudge(input.jevKey, config.models.jevModel) : undefined },
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
    model: config.models.jevModel,
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

  // 4. Resolve the configured provider and its key
  const providerId = config.models.provider;
  const providerSpec = getProviderSpec(providerId);
  if (!providerSpec) {
    return { status: "unknown-provider", provider: providerId };
  }
  const genKey = input.providerKeys[providerSpec.envKey] ?? "";
  if (!genKey) {
    return { status: "missing-gen-key", provider: providerId, envKey: providerSpec.envKey };
  }

  // 5. Load voice, reference, preferences, previous review
  const home = getPostdiffHome();
  // Web search is strictly opt-in (--web). Off by default: no tool, no
  // search instruction in the prompt. Requested but unsupported → visible
  // warning, draft without it. Requested and supported → tool attached; a
  // mid-call web failure retries tool-free (warned at the end, never fatal).
  const webSupported = providerSpec.supportsWebSearch(config.models.genModel);
  const webActive = input.web && webSupported;
  if (input.web && !webSupported) {
    emit({
      kind: "gen-model-warning",
      message: `warning: --web requested but web search is unavailable for ${providerId}/${config.models.genModel} — drafting without it.`,
    });
  }
  const [voiceDefault, voicePlatform, prevReview, globalRulesRaw, reference, readme] = await Promise.all([
    readVoiceFile(join(home, "voice"), "voice.md"),
    readVoiceFile(join(home, "voice"), platformDraftFile(platform)),
    readReviewState(dir, platform),
    readPreferenceFile(join(home, "preferences"), platformPreferenceFile(platform)),
    readReferenceFile(join(home, "reference"), platformReferenceFile(platform)),
    loadReadmeAtCommit(input.cwd, context.sha),
  ]);
  const globalPreferences = splitPreferenceRules(globalRulesRaw);
  if (globalPreferences.length > 0) {
    emit({ kind: "preferences-loaded", message: `applying ${globalPreferences.length} platform taste rule(s).` });
  }

  // 6. Stage 2 inclusion filter
  let genDiff = context.shapedDiff;
  if (context.filteredShapedDiff !== null) {
    genDiff = context.filteredShapedDiff;
    emit({ kind: "filter-cached", message: `filter: cached (${genDiff.length} chars)` });
  } else if (input.jevKey) {
    const inclusion = await filterShapedDiff(context.shapedDiff, {
      judge: new JevInclusionJudge(input.jevKey, config.models.jevModel),
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

  // 7. Resolve the cached change brief (built once per sha, always used).
  // Writer never sees the raw diff — only this brief.
  const generator = new SdkGenerator(providerId, genKey, config.models.genModel, {
    ...(input.telemetry.length > 0 ? { telemetry: input.telemetry } : {}),
  });
  const summaryInputHash = hashSummaryInput({ diff: genDiff, commitMessage: context.commitMessage, readme });
  let brief: string;
  try {
    if (!input.fresh) {
      const cached = await loadSummary(home, slug, context.sha);
      if (cached && cached.inputHash === summaryInputHash) {
        brief = renderSummary(cached.summary);
        emit({ kind: "summary-cached", message: `summary: cached (${brief.length} chars)` });
      } else {
        brief = await buildAndSaveBrief(cached ? true : false);
      }
    } else {
      brief = await buildAndSaveBrief(true);
    }
  } catch (err) {
    return { status: "summary-failed", reason: err instanceof Error ? err.message : String(err), sha: context.sha, metaDir: dir };
  }

  async function buildAndSaveBrief(stale: boolean): Promise<string> {
    emit({ kind: "summary-building", message: input.fresh ? "rebuilding change brief (--fresh)…" : stale ? "change brief stale — rebuilding…" : "building change brief…" });
    let built;
    try {
      built = await generator.buildSummary({
        commitMessage: context.commitMessage,
        previousCommitMessage: context.previousCommitMessage,
        diff: genDiff,
        readme,
        files: context.filesChanged,
      });
    } catch (err) {
      throw new Error(`summary failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    const rendered = renderSummary(built);
    if (rendered.length < MIN_SUMMARY_CHARS) {
      throw new Error(`summary failed: brief too short (${rendered.length} chars)`);
    }
    await saveSummary(home, slug, {
      schema: SUMMARY_SCHEMA,
      sha: context.sha,
      createdAt: new Date().toISOString(),
      model: `${providerId}/${config.models.genModel}`,
      inputHash: summaryInputHash,
      summary: built,
    });
    emit({ kind: "summary-built", message: `summary: ${input.fresh || stale ? "rebuilt" : "built"} (${rendered.length} chars)` });
    return rendered;
  }

  // 8. Generate draft from the brief (summary-only — no raw diff in prompt).
  emit({ kind: "drafting", message: `drafting ${platform} (streaming${webActive ? ", web search on" : ""}) —` });
  const opts: GeneratorOptions = { webSearch: webActive, ...(input.telemetry.length > 0 ? { telemetry: input.telemetry } : {}) };
  const draftGenerator = webActive ? new SdkGenerator(providerId, genKey, config.models.genModel, opts) : generator;
  const draft = await draftGenerator.generateStream(
    { platform, context, summary: brief, voiceDefault, voicePlatform, reference, globalPreferences, readme },
    onChunk,
  );
  if (draft.webSearch === "fallback") {
    emit({ kind: "gen-model-warning", message: `warning: web search failed (${draft.webError ?? "unknown error"}) — draft completed without it.` });
  }

  // 9. Persist draft + gen metadata
  const genPayload = {
    platform,
    model: draft.model,
    summaryInputHash,
    summaryChars: brief.length,
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

  // 10. Init review lineage
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

/** README budget in the prompt — project context, not the draft subject. */
const MAX_README_CHARS = 3_000;

/**
 * Repo README at the commit (root README.md, readme.md fallback). Null when
 * absent/unreadable — the prompt section is omitted entirely, never filler.
 */
async function loadReadmeAtCommit(cwd: string, sha: string): Promise<string | null> {
  for (const name of ["README.md", "readme.md"]) {
    try {
      const raw = await readFileAtCommit(cwd, sha, name);
      if (raw === null || raw === "too-large") continue;
      const cleaned = cleanText(raw);
      if (!cleaned) continue;
      return cleaned.length > MAX_README_CHARS ? cleaned.slice(0, MAX_README_CHARS) + "\n... [README truncated]" : cleaned;
    } catch {
      continue;
    }
  }
  return null;
}

function formatSignificance(r: SignificanceResult, sha: string, force: boolean): string {
  const prefix = force ? "(--force: Jev gate bypassed) " : "";
  const warn = r.forced && r.forcedReason && !force ? `warning: ${r.forcedReason}\n` : "";
  const score = r.noul === null ? "" : ` (noul=${r.noul.toFixed(3)} ${r.verdict === "pass" ? ">=" : "<"} ${r.threshold})`;
  const label = r.verdict === "pass" ? "significant" : "not significant";
  return `${warn}${prefix}${label}${score} — ${sha.slice(0, 8)}`;
}
