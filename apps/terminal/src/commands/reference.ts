// `postdiff reference` — manage real-post examples per platform (~/.postdiff/reference/).
// Mirrors `voice`: add appends, create overwrites, remove clears, view shows.
// Clack UI: examples in bordered notes, outcomes as log lines, `select` /
// `multiline` fallbacks when flags or text are missing on a TTY.

import { join } from "node:path";
import * as p from "@clack/prompts";
import {
  getPostdiffHome,
  appendReferenceExample,
  overwriteReferenceExample,
  clearReferenceFile,
  readReferenceFile,
  ensureReferenceFiles,
  platformReferenceFile,
  REFERENCE_FILES,
} from "@postdiff/core";
import type { CommandContext, PostdiffCommand } from "../router.js";
import type { ReferenceFile } from "@postdiff/core";
import { singleFlag } from "../helpers.js";
import { uiIntro, uiOutro, isInteractive, showNote } from "../ui.js";

function referenceDir(): string {
  return join(getPostdiffHome(), "reference");
}

/** Reads --blog/--x/--linkedin (commander rejects anything else). */
function platformFromOpts(ctx: CommandContext): ReferenceFile | null {
  const pick = singleFlag(ctx.opts, ["blog", "x", "linkedin"]);
  if (!pick) return null;
  return platformReferenceFile(pick as "blog" | "x" | "linkedin");
}

async function ensureFile(ctx: CommandContext): Promise<ReferenceFile | null | undefined> {
  const file = platformFromOpts(ctx);
  if (file) return file;
  if (process.exitCode === 1) return null;
  if (!isInteractive()) return null;
  const picked = await p.select({
    message: "Which reference file?",
    options: REFERENCE_FILES.map((f) => ({ value: f, label: f })),
  });
  if (p.isCancel(picked)) return undefined;
  return picked as ReferenceFile;
}

async function showFile(dir: string, file: ReferenceFile): Promise<void> {
  showNote(await readReferenceFile(dir, file), file);
}

async function ensureExample(ctx: CommandContext): Promise<string | null | undefined> {
  const example = ctx.positional.slice(1).join(" ");
  if (example.trim()) return example;
  if (!isInteractive()) return null;
  // No `showSubmit`: that flag disables double-Enter-to-submit and traps the
  // user in newline-insertion. Double-Enter submits, empty skips.
  const pasted = await p.multiline({
    message: "Paste the real post — Enter twice to submit, empty skips",
    placeholder: "Your real post…",
  });
  if (p.isCancel(pasted)) return undefined;
  return pasted.trim();
}

async function run(ctx: CommandContext): Promise<void> {
  uiIntro("reference");
  let sub = ctx.positional[0];
  const dir = referenceDir();
  await ensureReferenceFiles(dir);

  if (sub !== "view" && sub !== "add" && sub !== "create" && sub !== "remove") {
    // Flags/args win when passed; on a TTY offer the action picker instead of
    // usage-erroring outright.
    if (!isInteractive()) {
      p.log.error('Usage: postdiff reference [add|create|remove|view] [--blog|--x|--linkedin] ["<post>"]');
      process.exitCode = 1;
      uiOutro("nothing changed.");
      return;
    }
    const picked = await p.select({
      message: "What do you want to do?",
      options: [
        { value: "view", label: "View", hint: "show example file(s)" },
        { value: "add", label: "Add", hint: "append an example" },
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
        message: "Which reference file?",
        options: [{ value: "__all__", label: "All files" }, ...REFERENCE_FILES.map((f) => ({ value: f, label: f }))],
      });
      if (p.isCancel(picked)) {
        p.cancel("cancelled — nothing shown.");
        process.exitCode = 1;
        return;
      }
      if (picked !== "__all__") {
        await showFile(dir, picked as ReferenceFile);
        uiOutro("done.");
        return;
      }
    }
    for (const f of REFERENCE_FILES) {
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
      p.log.error(`Specify a file: --blog, --x, or --linkedin. e.g. postdiff reference ${sub} --x "<post>"`);
      process.exitCode = 1;
      uiOutro("nothing changed.");
      return;
    }
    if (sub === "remove") {
      await clearReferenceFile(dir, file);
      p.log.success(`cleared ${file}`);
      uiOutro("done.");
      return;
    }
    const example = await ensureExample(ctx);
    if (example === undefined) {
      p.cancel("cancelled — nothing changed.");
      process.exitCode = 1;
      return;
    }
    if (example === null) {
      p.log.error(`Nothing to save — pass "<post>" or run interactively. e.g. postdiff reference ${sub} --x "<post>"`);
      process.exitCode = 1;
      uiOutro("nothing changed.");
      return;
    }
    if (!example) {
      p.log.warn("empty post — nothing changed.");
      uiOutro("nothing changed.");
      return;
    }
    if (sub === "add") {
      const res = await appendReferenceExample(dir, file, example);
      if (res === "appended") p.log.success(`appended to ${file}`);
      else p.log.warn(`already in ${file} — skipped`);
      uiOutro("done.");
      return;
    }
    await overwriteReferenceExample(dir, file, example);
    p.log.success(`overwrote ${file}`);
    uiOutro("done.");
    return;
  }
}

export const command: PostdiffCommand = {
  name: "reference",
  description: "manage real-post examples (add/create/remove/view)",
  args: [
    { name: "sub", description: "add | create | remove | view" },
    { name: "example", description: "pasted real post (add/create)", variadic: true },
  ],
  options: [
    { flags: "--blog", description: "blog.md" },
    { flags: "--x", description: "x.md" },
    { flags: "--linkedin", description: "linkedin.md" },
  ],
  run,
};
