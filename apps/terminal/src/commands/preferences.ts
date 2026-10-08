// `postdiff preferences` — manage global platform taste rules (~/.postdiff/preferences/).
// Distilled automatically at review verdicts; curated by hand here.
// Clack UI: rules in bordered notes, outcomes as log lines, `select` / `text`
// fallbacks when the flag or rule text is missing on a TTY.

import { join } from "node:path";
import * as p from "@clack/prompts";
import {
  getPostdiffHome,
  appendPreferenceRule,
  overwritePreferenceFile,
  clearPreferenceFile,
  readPreferenceFile,
  ensurePreferenceFiles,
  resolvePreferenceFile,
  PREFERENCE_FILES,
} from "@postdiff/core";
import type { CommandContext, PostdiffCommand } from "../router.js";
import type { PreferenceFile } from "@postdiff/core";
import { singleFlag } from "../helpers.js";
import { uiIntro, uiOutro, isInteractive, showNote } from "../ui.js";

function preferencesDir(): string {
  return join(getPostdiffHome(), "preferences");
}

/** Reads --blog/--x/--linkedin (commander rejects anything else). */
function platformFromOpts(ctx: CommandContext): PreferenceFile | null {
  const pick = singleFlag(ctx.opts, ["blog", "x", "linkedin"]);
  if (!pick) return null;
  return resolvePreferenceFile(`--${pick}`);
}

async function ensureFile(ctx: CommandContext): Promise<PreferenceFile | null | undefined> {
  const file = platformFromOpts(ctx);
  if (file) return file;
  if (process.exitCode === 1) return null;
  if (!isInteractive()) return null;
  const picked = await p.select({
    message: "Which preferences file?",
    options: PREFERENCE_FILES.map((f) => ({ value: f, label: f })),
  });
  if (p.isCancel(picked)) return undefined;
  return picked as PreferenceFile;
}

async function showFile(dir: string, file: PreferenceFile): Promise<void> {
  showNote(await readPreferenceFile(dir, file), file);
}

async function ensureRule(ctx: CommandContext): Promise<string | null | undefined> {
  const rule = ctx.positional.slice(1).join(" ");
  if (rule.trim()) return rule;
  if (!isInteractive()) return null;
  const typed = await p.text({
    message: "Type the rule (empty submit skips)",
    placeholder: "e.g. open with the outcome, not the process…",
  });
  if (p.isCancel(typed)) return undefined;
  return typed.trim();
}

async function run(ctx: CommandContext): Promise<void> {
  uiIntro("preferences");
  let sub = ctx.positional[0];
  const dir = preferencesDir();
  await ensurePreferenceFiles(dir);

  if (sub !== "view" && sub !== "add" && sub !== "create" && sub !== "remove") {
    // Flags/args win when passed; on a TTY offer the action picker instead of
    // usage-erroring outright.
    if (!isInteractive()) {
      p.log.error('Usage: postdiff preferences [add|create|remove|view] [--blog|--x|--linkedin] ["<rule>"]');
      process.exitCode = 1;
      uiOutro("nothing changed.");
      return;
    }
    const picked = await p.select({
      message: "What do you want to do?",
      options: [
        { value: "view", label: "View", hint: "show rule file(s)" },
        { value: "add", label: "Add", hint: "append a rule" },
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
        message: "Which preferences file?",
        options: [{ value: "__all__", label: "All files" }, ...PREFERENCE_FILES.map((f) => ({ value: f, label: f }))],
      });
      if (p.isCancel(picked)) {
        p.cancel("cancelled — nothing shown.");
        process.exitCode = 1;
        return;
      }
      if (picked !== "__all__") {
        await showFile(dir, picked as PreferenceFile);
        uiOutro("done.");
        return;
      }
    }
    for (const f of PREFERENCE_FILES) {
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
      p.log.error(`Specify a file: --blog, --x, or --linkedin. e.g. postdiff preferences ${sub} --x "<rule>"`);
      process.exitCode = 1;
      uiOutro("nothing changed.");
      return;
    }
    if (sub === "remove") {
      await clearPreferenceFile(dir, file);
      p.log.success(`cleared ${file}`);
      uiOutro("done.");
      return;
    }
    const rule = await ensureRule(ctx);
    if (rule === undefined) {
      p.cancel("cancelled — nothing changed.");
      process.exitCode = 1;
      return;
    }
    if (rule === null) {
      p.log.error(`Nothing to save — pass "<rule>" or run interactively. e.g. postdiff preferences ${sub} --x "<rule>"`);
      process.exitCode = 1;
      uiOutro("nothing changed.");
      return;
    }
    if (!rule) {
      p.log.warn("empty rule — nothing changed.");
      uiOutro("nothing changed.");
      return;
    }
    if (sub === "add") {
      const res = await appendPreferenceRule(dir, file, rule);
      if (res === "appended") {
        p.log.success(`appended to ${file}`);
      } else if (res === "appended-rotated") {
        p.log.warn(`appended to ${file} (oldest rule rotated out at cap)`);
      } else {
        p.log.warn(`already in ${file} — skipped`);
      }
      uiOutro("done.");
      return;
    }
    await overwritePreferenceFile(dir, file, rule);
    p.log.success(`overwrote ${file}`);
    uiOutro("done.");
    return;
  }
}

export const command: PostdiffCommand = {
  name: "preferences",
  description: "manage global platform taste rules (add/create/remove/view)",
  args: [
    { name: "sub", description: "add | create | remove | view" },
    { name: "rule", description: "hand-written rule (add/create)", variadic: true },
  ],
  options: [
    { flags: "--blog", description: "blog.md" },
    { flags: "--x", description: "x.md" },
    { flags: "--linkedin", description: "linkedin.md" },
  ],
  run,
};
