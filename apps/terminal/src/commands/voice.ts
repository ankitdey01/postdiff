// `postdiff voice` — manage the global voice profile (~/.postdiff/voice/).
// Clack UI: file contents in bordered notes, outcomes as log lines. When the
// file flag (or the sample text) is missing on an interactive terminal we
// prompt with `select` / `multiline` instead of erroring outright.

import { join } from "node:path";
import * as p from "@clack/prompts";
import {
  getPostdiffHome,
  appendVoiceSample,
  overwriteVoiceSample,
  clearVoiceFile,
  readVoiceFile,
  resolveVoiceFile,
  ensureVoiceFiles,
  VOICE_FILES,
} from "@postdiff/core";
import type { CommandContext, PostdiffCommand } from "../router.js";
import type { VoiceFile } from "@postdiff/core";
import { singleFlag } from "../helpers.js";
import { uiIntro, uiOutro, isInteractive, showNote } from "../ui.js";

function voiceDir(): string {
  return join(getPostdiffHome(), "voice");
}

/** Reads --voice/--blog/--x/--linkedin (commander rejects anything else). */
function platformFromOpts(ctx: CommandContext): VoiceFile | null {
  const pick = singleFlag(ctx.opts, ["voice", "blog", "x", "linkedin"]);
  if (!pick) return null;
  return resolveVoiceFile(`--${pick}`);
}

/** Missing flag → interactive `select`, else null (caller errors for pipes). */
async function ensureFile(ctx: CommandContext): Promise<VoiceFile | null | undefined> {
  const file = platformFromOpts(ctx);
  if (file) return file;
  if (process.exitCode === 1) return null; // conflicting flags — error already set
  if (!isInteractive()) return null;
  const picked = await p.select({
    message: "Which voice file?",
    options: VOICE_FILES.map((f) => ({ value: f, label: f })),
  });
  if (p.isCancel(picked)) return undefined; // user aborted the picker
  return picked as VoiceFile;
}

async function showFile(dir: string, file: VoiceFile): Promise<void> {
  showNote(await readVoiceFile(dir, file), file);
}

/** Missing sample text → interactive `multiline`; "" = skip, undefined = aborted. */
async function ensureSample(ctx: CommandContext): Promise<string | null | undefined> {
  const sample = ctx.positional.slice(1).join(" ");
  if (sample.trim()) return sample;
  if (!isInteractive()) return null;
  // No `showSubmit`: that flag disables double-Enter-to-submit and traps the
  // user in newline-insertion. Double-Enter submits, empty skips.
  const pasted = await p.multiline({
    message: "Paste the sample — Enter twice to submit, empty skips",
    placeholder: "Your voice sample markdown…",
  });
  if (p.isCancel(pasted)) return undefined;
  return pasted.trim();
}

async function run(ctx: CommandContext): Promise<void> {
  uiIntro("voice");
  let sub = ctx.positional[0];
  const dir = voiceDir();
  await ensureVoiceFiles(dir);

  if (sub !== "view" && sub !== "add" && sub !== "create" && sub !== "remove") {
    // Flags/args win when passed; on a TTY offer the action picker instead of
    // usage-erroring outright.
    if (!isInteractive()) {
      p.log.error("Usage: postdiff voice [add|create|remove|view] [--voice|--blog|--x|--linkedin] [\"<sample>\"]");
      process.exitCode = 1;
      uiOutro("nothing changed.");
      return;
    }
    const picked = await p.select({
      message: "What do you want to do?",
      options: [
        { value: "view", label: "View", hint: "show voice file(s)" },
        { value: "add", label: "Add", hint: "append a sample" },
        { value: "create", label: "Create", hint: "overwrite a file" },
        { value: "remove", label: "Remove", hint: "clear a file" },
      ],
    });
    if (p.isCancel(picked)) {
      p.cancel("cancelled — nothing changed.");
      process.exitCode = 1;
      return;
    }
    sub = picked;
  }

  if (sub === "view") {
    const direct = platformFromOpts(ctx);
    if (process.exitCode === 1) {
      uiOutro("nothing shown.");
      return;
    }
    if (direct) {
      await showFile(dir, direct);
      uiOutro("done.");
      return;
    }
    if (isInteractive()) {
      const picked = await p.select({
        message: "Which voice file?",
        options: [{ value: "__all__", label: "All files" }, ...VOICE_FILES.map((f) => ({ value: f, label: f }))],
      });
      if (p.isCancel(picked)) {
        p.cancel("cancelled — nothing shown.");
        process.exitCode = 1;
        return;
      }
      if (picked !== "__all__") {
        await showFile(dir, picked as VoiceFile);
        uiOutro("done.");
        return;
      }
    }
    for (const f of VOICE_FILES) {
      await showFile(dir, f);
    }
    uiOutro("done.");
    return;
  }

  if (sub === "add" || sub === "create" || sub === "remove") {
    const file = await ensureFile(ctx);
    if (file === undefined) {
      p.cancel("cancelled — nothing changed.");
      process.exitCode = 1;
      return;
    }
    if (!file) {
      p.log.error(`Specify a file: --voice, --blog, --x, or --linkedin. e.g. postdiff voice ${sub} --blog "<sample>"`);
      process.exitCode = 1;
      uiOutro("nothing changed.");
      return;
    }
    if (sub === "remove") {
      await clearVoiceFile(dir, file);
      p.log.success(`cleared ${file}`);
      uiOutro("done.");
      return;
    }
    const sample = await ensureSample(ctx);
    if (sample === undefined) {
      p.cancel("cancelled — nothing changed.");
      process.exitCode = 1;
      return;
    }
    if (sample === null) {
      p.log.error(`Nothing to save — pass "<sample>" or run interactively. e.g. postdiff voice ${sub} --blog "<sample>"`);
      process.exitCode = 1;
      uiOutro("nothing changed.");
      return;
    }
    if (!sample) {
      p.log.warn("empty sample — nothing changed.");
      uiOutro("nothing changed.");
      return;
    }
    if (sub === "add") {
      const res = await appendVoiceSample(dir, file, sample);
      if (res === "appended") p.log.success(`appended to ${file}`);
      else p.log.warn(`already in ${file} — skipped`);
      uiOutro("done.");
      return;
    }
    await overwriteVoiceSample(dir, file, sample);
    p.log.success(`overwrote ${file}`);
    uiOutro("done.");
    return;
  }
}

export const command: PostdiffCommand = {
  name: "voice",
  description: "manage voice samples (add/create/remove/view)",
  args: [
    { name: "sub", description: "add | create | remove | view" },
    { name: "sample", description: "pasted sample (add/create)", variadic: true },
  ],
  options: [
    { flags: "--voice", description: "the default voice.md" },
    { flags: "--blog", description: "blog.md" },
    { flags: "--x", description: "x.md" },
    { flags: "--linkedin", description: "linkedin.md" },
  ],
  run,
};
