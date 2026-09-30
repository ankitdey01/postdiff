// Engine: publish readiness — the draft-first gate. UI-agnostic: takes a dir,
// decides, returns copyable text or throws. Clipboard/console/process stay in
// cli/ (same split as review: core judges, interfaces act).

import type { Platform } from "../../shared/types.js";
import { platformDraftFile } from "../generation/generator.js";
import { hashContent, readReviewState } from "./review.js";

export interface PublishReady {
  file: `${Platform}.md`;
  body: string;
}

/**
 * Enforces the draft-first gate: draft exists, review state exists, latest
 * version accepted, file hash-matched to it. Returns the exact text to copy.
 * Throws user-facing errors otherwise (callers surface message + exit 1).
 */
export async function preparePublish(
  dir: string,
  platform: Platform,
  fileContent: string | null,
  sha8: string
): Promise<PublishReady> {
  const file = platformDraftFile(platform);
  if (fileContent === null) {
    throw new Error(`No ${platform} draft for ${sha8} — generate one first.`);
  }
  // No auto-init here: a missing review state means "never reviewed", not "pending".
  const state = await readReviewState(dir, platform);
  if (!state) {
    throw new Error(`No review state for ${sha8} — review --${platform} --accept first.`);
  }
  const latest = state.versions[state.versions.length - 1];
  if (!latest || latest.status !== "accepted") {
    throw new Error(`Not accepted (status: ${latest?.status ?? "none"}) — review --${platform} --accept first.`);
  }
  if (hashContent(fileContent) !== latest.hash) {
    throw new Error(
      `Draft changed since accept (${latest.hash} vs file ${hashContent(fileContent)}) — review --${platform} --accept first.`
    );
  }
  return { file, body: fileContent };
}
