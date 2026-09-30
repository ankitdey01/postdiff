// Engine: full generate pipeline — context → significance → filter → draft →
// persist → review init. Orchestration only; the model wrapper lives in
// generator.ts. UI-agnostic: no stdout, no process.exitCode. Emits structured
// events via `onEvent` and streaming text via `onChunk`; returns a
// discriminated result the caller maps to its own output surface.

import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import { loadOrGatherCommitContext, saveCommitContext } from "../source/context.js";
import { getRepoSlug, getTractHome, loadConfig, saveMeta, hashDiff, type DraftMeta } from "../store.js";
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
import { GroqGenerator, platformDraftFile } from "./generator.js";
import type { DraftResult, GeneratorOptions } from "./generator.js";
import type { Platform } from "../../shared/types.js";
import type { Telemetry } from "ai";

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
  const opts: GeneratorOptions = input.telemetry.length > 0 ? { telemetry: input.telemetry } : {};
  const draft = await new GroqGenerator(input.groqKey, config.genModel, opts).generateStream(
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
