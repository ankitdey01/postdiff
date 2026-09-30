// Engine: review state — version history with per-version verdicts.
// Learnings live ONLY in global preferences/<platform>.md; this file is
// comparison history + audit. Rejected versions are removed, never kept:
// the reason survives as a derived global rule, not as a stored version.

import { createHash } from "node:crypto";
import { join } from "node:path";
import { readFile, rm, writeFile } from "node:fs/promises";
import type { Platform } from "../../shared/types.js";
import type { Generator } from "../generation/generator.js";
import { MAX_RULE_CHARS, truncateRule } from "../generation/generator.js";

export type ReviewStatus = "pending" | "accepted";

export interface ReviewVersion {
  hash: string;
  content: string;
  status: ReviewStatus;
  reason: string | null;
  decidedAt: string | null;
}

export interface ReviewState {
  versions: ReviewVersion[];
}

export function hashContent(content: string): string {
  return createHash("sha1").update(content).digest("hex").slice(0, 12);
}

export function reviewFileName(platform: Platform): `review-${Platform}.json` {
  return `review-${platform}.json`;
}

function reviewPath(dir: string, platform: Platform): string {
  return join(dir, reviewFileName(platform));
}

/** Rejected versions hold no history: the reason is templated into a global rule, then dropped. */
export function rejectRuleFor(reason: string): string {
  return truncateRule(`The user rejects when ${reason.trim()}`.slice(0, MAX_RULE_CHARS));
}

interface LegacyVersion {
  hash?: unknown;
  content?: unknown;
  status?: unknown;
  reason?: unknown;
  decidedAt?: unknown;
}

function toVersion(v: LegacyVersion): ReviewVersion | null {
  if (typeof v.hash !== "string" || typeof v.content !== "string") return null;
  const status = v.status === "accepted" ? "accepted" : "pending";
  return {
    hash: v.hash,
    content: v.content,
    status,
    reason: typeof v.reason === "string" ? v.reason : null,
    decidedAt: typeof v.decidedAt === "string" ? v.decidedAt : null,
  };
}

export async function readReviewState(dir: string, platform: Platform): Promise<ReviewState | null> {
  try {
    const raw = await readFile(reviewPath(dir, platform), "utf8");
    const parsed = JSON.parse(raw) as { versions?: unknown };
    if (!Array.isArray(parsed.versions)) return null;
    // Legacy shape (top-level status/reason/decidedAt, versions[].preference)
    // is folded in: preference dropped, top-level verdict lands on the latest.
    const versions = (parsed.versions as LegacyVersion[]).map(toVersion).filter((v): v is ReviewVersion => v !== null);
    if (versions.length === 0) return null;
    const legacy = parsed as { status?: unknown; reason?: unknown; decidedAt?: unknown };
    const last = versions[versions.length - 1];
    if (last && last.status === "pending" && (legacy.status === "accepted" || legacy.status === "rejected")) {
      if (legacy.status === "accepted") {
        last.status = "accepted";
        last.reason = typeof legacy.reason === "string" ? legacy.reason : null;
        last.decidedAt = typeof legacy.decidedAt === "string" ? legacy.decidedAt : null;
      }
      // Legacy "rejected" top-level verdicts are dropped: rejected text is not history.
    }
    return { versions };
  } catch {
    return null;
  }
}

async function writeReviewState(dir: string, platform: Platform, state: ReviewState): Promise<void> {
  await writeFile(reviewPath(dir, platform), JSON.stringify(state, null, 2) + "\n", "utf8");
}

/** Fresh lineage: first snapshot, pending. Also the regenerate reset. */
export async function initReview(dir: string, platform: Platform, draftBody: string): Promise<ReviewState> {
  const state: ReviewState = {
    versions: [{ hash: hashContent(draftBody), content: draftBody, status: "pending", reason: null, decidedAt: null }],
  };
  await writeReviewState(dir, platform, state);
  return state;
}

export interface VerdictInput {
  dir: string;
  platform: Platform;
  /** Current on-disk draft text. */
  fileContent: string;
  accept: boolean;
  reason?: string;
  /** Accept-with-edit only. Reject never touches it, so callers omit it there. */
  summarizer?: Generator;
}

export type VerdictOutcome =
  | { kind: "accepted"; state: ReviewState; snapshot: boolean; globalRule: string }
  | { kind: "rejected-removed"; removed: boolean; fileDeleted: boolean; globalRule: string }
  | { kind: "rejected-kept"; globalRule: string };

/**
 * Accept-only learning. Accept snapshots + distills (LLM, only on changed
 * text). Reject never snapshots and never calls the LLM: reasoned rejects
 * template a rule. Only a pending version is removed — accepted history is
 * never deleted by a reject; the on-disk edit is simply abandoned.
 */
export async function recordVerdict(input: VerdictInput): Promise<VerdictOutcome> {
  const state = await readReviewState(input.dir, input.platform);
  if (!state) throw new Error("No review state — generate a draft first.");
  const latest = state.versions[state.versions.length - 1];
  if (!latest) throw new Error("No review state — generate a draft first.");
  if (!input.accept) return rejectVerdict(state, input);
  return acceptVerdict(state, input, latest);
}

async function rejectVerdict(state: ReviewState, input: VerdictInput): Promise<VerdictOutcome> {
  const latest = state.versions[state.versions.length - 1];
  const reason = input.reason?.trim() || null;
  const globalRule = reason ? rejectRuleFor(reason) : "";
  if (!latest || latest.status !== "pending") return { kind: "rejected-kept", globalRule };
  // Drop the pending version; no snapshot of on-disk edits ever happens here.
  state.versions.pop();
  if (state.versions.length === 0) {
    await rm(reviewPath(input.dir, input.platform), { force: true });
    return { kind: "rejected-removed", removed: true, fileDeleted: true, globalRule };
  }
  await writeReviewState(input.dir, input.platform, state);
  return { kind: "rejected-removed", removed: true, fileDeleted: false, globalRule };
}

async function acceptVerdict(state: ReviewState, input: VerdictInput, latest: ReviewVersion): Promise<VerdictOutcome> {
  const reason = input.reason?.trim() || null;
  const at = new Date().toISOString();
  const currentHash = hashContent(input.fileContent);
  if (currentHash === latest.hash) {
    latest.status = "accepted";
    latest.reason = reason;
    latest.decidedAt = at;
    await writeReviewState(input.dir, input.platform, state);
    return { kind: "accepted", state, snapshot: false, globalRule: "" };
  }

  if (!input.summarizer) throw new Error("summarizer required to distill an edited accept.");
  const globalRule = await input.summarizer.summarizeAccept(latest.content, input.fileContent);
  state.versions.push({ hash: currentHash, content: input.fileContent, status: "accepted", reason, decidedAt: at });
  await writeReviewState(input.dir, input.platform, state);
  return { kind: "accepted", state, snapshot: true, globalRule };
}
