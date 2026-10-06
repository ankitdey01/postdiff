// Prompt assembly: deterministic. Template + cached change brief + paired voice.
// No model call here — the writer renders from the brief, never the raw diff.

import type { CommitContext } from "../source/context.js";
import type { Platform } from "../../shared/types.js";
import { REFERENCE_INSTRUCTION, SEARCH_INSTRUCTION } from "../prompts.js";
import { platformSpec } from "./platforms.js";

export interface AssembledPrompt {
  system: string;
  prompt: string;
}

function renderFiles(c: CommitContext): string {
  return c.files
    .map((f) => {
      const label = f.previousPath ? `${f.status} ${f.previousPath} -> ${f.path}` : `${f.status} ${f.path}`;
      return `- ${label}`;
    })
    .join("\n");
}

export function assemblePrompt(
  platform: Platform,
  context: CommitContext,
  voiceDefault: string,
  voicePlatform: string,
  reference: string,
  globalPreferences: string[],
  opts: { webSearch?: boolean; readme?: string | null; summary: string },
): AssembledPrompt {
  const spec = platformSpec(platform);
  const system = [
    spec.systemPrompt,
    "",
    "Author's default voice (always applies):",
    voiceDefault.trim() || "(no default voice samples yet)",
    "",
    `Author's ${platform} voice (applies on top of the default):`,
    voicePlatform.trim() || "(no platform voice samples yet)",
  ].join("\n");

  const readme = opts?.readme?.trim() ? opts.readme.trim() : null;
  const prompt = [
    `Write one ${platform} draft about the change below, as the author in first person (I/we, past tense for what was built).`,
    `Max ${spec.limit}. ${spec.formatNotes}`,
    "",
    `Commit: ${context.sha.slice(0, 8)}`,
    `Message: ${context.commitMessage || "(empty)"}`,
    context.previousCommitMessage ? `Previous commit message: ${context.previousCommitMessage.split("\n")[0]}` : "Previous commit: none (root commit).",
    "",
    ...(readme ? ["Project context (README.md):", readme, ""] : []),
    "Change brief (the full factual record — ground every claim here, never invent beyond it):",
    opts.summary || "(empty brief)",
    "",
    "Changed files:",
    renderFiles(context),
    "",
    "Hard constraints from the author (previously rejected output taught these — must follow; on any conflict with voice samples above, these win):",
    globalPreferences.length > 0 ? globalPreferences.map((p, i) => `${i + 1}. ${p}`).join("\n") : "(none yet)",
    "",
    REFERENCE_INSTRUCTION,
    reference.trim() || "(no reference examples yet)",
    // Only mention browser_search when the tool is actually attached (--web
    // + supported provider/model). Otherwise the model would be instructed
    // to call a tool that doesn't exist.
    ...(opts?.webSearch ? [SEARCH_INSTRUCTION] : []),
  ].join("\n");

  return { system, prompt };
}
