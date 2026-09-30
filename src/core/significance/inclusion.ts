// Engine: Jev per-file inclusion filter (stage 2). ONE systemOne call, one
// Noul question per file section. Secrets (apiKey) passed in, never read here.

import { TypeSafeClient } from "@typesafe-ai/sdk";
import { IS_INCLUDE_CRITERIA, IS_INCLUDE_INSTRUCTIONS } from "../prompts.js";
import { splitDiffSections } from "../source/ignore.js";
import { withTimeout } from "../async.js";

export { IS_INCLUDE_CRITERIA, IS_INCLUDE_INSTRUCTIONS } from "../prompts.js";

/** Relaxation ladder: 0.5, then -0.1 per empty round, down to this floor. Below it → skip. */
export const INCLUDE_THRESHOLD_START = 0.5;
export const INCLUDE_THRESHOLD_MIN = 0.1;
export const INCLUDE_THRESHOLD_STEP = 0.1;

/** Per-file section text cap for the Jev question (kept output is never cut). */
export const MAX_INCLUDE_SECTION_CHARS = 4_000;

/** Defensive chunking: max per-file questions per systemOne call. */
export const MAX_INCLUDE_QUESTIONS_PER_CALL = 30;

const INCLUSION_TIMEOUT_MS = 30_000;

export interface InclusionJudge {
  judgeFiles(sections: { path: string; diff: string }[]): Promise<Record<number, number>>;
}

interface InclusionQuestion {
  type: "noul";
  instructions: { file: { path: string; diff: string }; question: string };
  criteria: { true: string; false: string };
}

/** Live Jev inclusion judge: ONE systemOne call, one Noul question per file section. */
export class JevInclusionJudge implements InclusionJudge {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = "jev-latest"
  ) {}

  async judgeFiles(sections: { path: string; diff: string }[]): Promise<Record<number, number>> {
    const client = new TypeSafeClient({ apiKey: this.apiKey });
    const out: Record<number, number> = {};
    for (let c = 0; c < sections.length; c += MAX_INCLUDE_QUESTIONS_PER_CALL) {
      const chunk = sections.slice(c, c + MAX_INCLUDE_QUESTIONS_PER_CALL);
      const questions: Record<string, InclusionQuestion> = {};
      chunk.forEach((s, k) => {
        const text = s.diff.length > MAX_INCLUDE_SECTION_CHARS ? s.diff.slice(0, MAX_INCLUDE_SECTION_CHARS) + "\n... [section cut: judge budget]" : s.diff;
        questions[`include_file_${c + k}`] = {
          type: "noul",
          instructions: { file: { path: s.path, diff: text }, question: IS_INCLUDE_INSTRUCTIONS },
          criteria: { true: IS_INCLUDE_CRITERIA.true, false: IS_INCLUDE_CRITERIA.false },
        };
      });
      const response = await client.systemOne({
        state: { files: sections.map((s) => s.path) },
        questions,
        model: this.model,
      });
      chunk.forEach((_, k) => {
        const noul = response.answers?.[`include_file_${c + k}`]?.noul;
        if (typeof noul !== "number" || Number.isNaN(noul)) throw new Error(`Jev returned no noul for file index ${c + k}`);
        out[c + k] = noul;
      });
    }
    return out;
  }
}

export interface FileInclusion {
  path: string;
  noul: number | null;
  kept: boolean;
}

export interface FilteredDiff {
  /** Kept sections in original order (ignored placeholders included verbatim). Empty when nothing passed. */
  filtered: string;
  /** Threshold that admitted the keep-list. Null on force-through or empty-stop. */
  thresholdUsed: number | null;
  keptFiles: number;
  droppedFiles: number;
  forcedReason?: string;
  perFile: FileInclusion[];
}

/**
 * Stage 2: trim the shaped diff to the files Jev deems worth including.
 * One Jev call (chunked past 30 files). Errors force-include everything —
 * a hung API degrades to today's full diff, never to hollowed-out fiction.
 * Empty keep-list relaxes the threshold 0.5 → 0.1 in 0.1 steps (pure code,
 * no re-call); still empty below 0.1 → empty filtered (caller skips).
 */
export async function filterShapedDiff(
  shapedDiff: string,
  opts: { threshold?: number; judge?: InclusionJudge }
): Promise<FilteredDiff> {
  const start = opts.threshold ?? INCLUDE_THRESHOLD_START;
  const sections = splitDiffSections(shapedDiff);
  const judgeable = sections.filter((s) => !s.ignored);
  const perFile = (keptIdx: Set<number>, nouls: Map<number, number | null>): FileInclusion[] =>
    sections.map((s, i) => {
      if (s.ignored) return { path: s.path, noul: null, kept: true };
      return { path: s.path, noul: nouls.get(i) ?? null, kept: keptIdx.has(i) };
    });

  if (judgeable.length === 0) {
    return { filtered: shapedDiff, thresholdUsed: start, keptFiles: 0, droppedFiles: 0, perFile: perFile(new Set(), new Map()) };
  }
  if (!opts.judge) throw new Error("No inclusion judge provided (set TYPESAFE_API_KEY to filter, or send the full diff)");

  const nouls = new Map<number, number | null>();
  try {
    const raw = await withTimeout(
      opts.judge.judgeFiles(judgeable.map((s) => ({ path: s.path, diff: s.section }))),
      INCLUSION_TIMEOUT_MS
    );
    // judgeFiles answers in judgeable order; map back to section indexes.
    let k = 0;
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].ignored) continue;
      nouls.set(i, raw[k] ?? null);
      k++;
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    const all = new Set(sections.map((_, i) => i));
    return {
      filtered: shapedDiff,
      thresholdUsed: null,
      keptFiles: judgeable.length,
      droppedFiles: 0,
      forcedReason: `inclusion Jev error, full diff kept: ${reason}`,
      perFile: perFile(all, nouls),
    };
  }

  const at = (t: number): Set<number> => {
    const keep = new Set<number>();
    nouls.forEach((n, i) => {
      if (n === null || n >= t) keep.add(i);
    });
    return keep;
  };
  // Null noul (missing answer) force-includes that file — same policy as errors.
  let threshold = start;
  let keep = at(threshold);
  while (keep.size === 0 && threshold - INCLUDE_THRESHOLD_STEP >= INCLUDE_THRESHOLD_MIN - 1e-9) {
    threshold = Math.round((threshold - INCLUDE_THRESHOLD_STEP) * 10) / 10;
    keep = at(threshold);
  }
  if (keep.size === 0) {
    return { filtered: "", thresholdUsed: null, keptFiles: 0, droppedFiles: judgeable.length, perFile: perFile(keep, nouls) };
  }
  const keptSections = sections.filter((s, i) => s.ignored || keep.has(i)).map((s) => s.section);
  return {
    filtered: keptSections.join("\n"),
    thresholdUsed: threshold,
    keptFiles: keep.size,
    droppedFiles: judgeable.length - keep.size,
    perFile: perFile(keep, nouls),
  };
}
