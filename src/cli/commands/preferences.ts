// `postdiff preferences` — manage global platform taste rules (~/.postdiff/preferences/).
// Distilled automatically at review verdicts; curated by hand here.

import { join } from "node:path";
import {
  getTractHome,
  appendPreferenceRule,
  overwritePreferenceFile,
  clearPreferenceFile,
  readPreferenceFile,
  ensurePreferenceFiles,
  resolvePreferenceFile,
  PREFERENCE_FILES,
} from "../../index.js";
import type { CommandContext, TractCommand } from "../router.js";
import type { PreferenceFile } from "../../index.js";
import { singleFlag } from "../helpers.js";

function preferencesDir(): string {
  return join(getTractHome(), "preferences");
}

/** Reads --blog/--x/--linkedin (commander rejects anything else). */
function platformFromOpts(ctx: CommandContext): PreferenceFile | null {
  const pick = singleFlag(ctx.opts, ["blog", "x", "linkedin"]);
  if (!pick) return null;
  return resolvePreferenceFile(`--${pick}`);
}

async function showFile(dir: string, file: PreferenceFile): Promise<void> {
  console.log(`--- ${file} ---`);
  console.log((await readPreferenceFile(dir, file)) || "(empty)");
}

async function run(ctx: CommandContext): Promise<void> {
  const sub = ctx.positional[0];
  const dir = preferencesDir();
  await ensurePreferenceFiles(dir);

  if (sub === "view") {
    const file = platformFromOpts(ctx);
    if (process.exitCode === 1) return;
    if (file) {
      await showFile(dir, file);
      return;
    }
    for (const f of PREFERENCE_FILES) {
      await showFile(dir, f);
    }
    return;
  }

  if (sub === "add" || sub === "create" || sub === "remove") {
    const file = platformFromOpts(ctx);
    if (process.exitCode === 1) return;
    if (!file) {
      console.error(`Specify a file: --blog, --x, or --linkedin. e.g. postdiff preferences ${sub} --x "<rule>"`);
      process.exitCode = 1;
      return;
    }
    if (sub === "remove") {
      await clearPreferenceFile(dir, file);
      console.log(`cleared ${file}`);
      return;
    }
    const rule = ctx.positional.slice(1).join(" ");
    if (sub === "add") {
      const res = await appendPreferenceRule(dir, file, rule);
      if (res === "appended") {
        console.log(`appended to ${file}`);
      } else if (res === "appended-rotated") {
        console.log(`appended to ${file} (oldest rule rotated out at cap)`);
      } else {
        console.log(`already in ${file} — skipped`);
      }
      return;
    }
    await overwritePreferenceFile(dir, file, rule);
    console.log(`overwrote ${file}`);
    return;
  }

  console.log('Usage: postdiff preferences [add|create|remove|view] [--blog|--x|--linkedin] ["<rule>"]');
  process.exitCode = 1;
}

export const command: TractCommand = {
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
