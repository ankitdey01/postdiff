#!/usr/bin/env node
// CLI entry point. First-run setup check, then bootstrap (~/.postdiff, .env),
// then runs the program. All env/console/process access lives in cli/ — never
// inside core/.

import { readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as p from "@clack/prompts";
import { ensurePostdiffHome, getConfigPath } from "../index.js";
import { runProgram } from "./router.js";
import { runSetupWizard } from "./commands/setup.js";
import { bootstrapEnv } from "./keys.js";

/**
 * First-run sentinel: config.json missing + a command that needs API keys +
 * an interactive terminal → run the setup wizard before anything else.
 * `--help`/`-h` and every other command never hijack. Nothing is written on
 * cancel; the command itself then surfaces the missing-key error.
 * Returns true when the wizard completed and saved (caller must re-bootstrap
 * env — the keys were written to disk after the first bootstrap ran).
 */
async function maybeFirstRunSetup(argv: string[]): Promise<boolean> {
  const invoked = argv[2] ?? "";
  if (invoked !== "generate" && invoked !== "review") return false;
  if (argv.includes("--help") || argv.includes("-h")) return false;
  if (!process.stdout.isTTY) return false;
  try {
    await stat(getConfigPath());
    return false; // config exists — setup already done
  } catch {
    // No config.json → first run.
  }
  return runSetupWizard();
}

async function readVersion(): Promise<string> {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    return (
      (JSON.parse(await readFile(join(here, "..", "..", "package.json"), "utf8")) as { version?: string }).version ?? "0.0.0"
    );
  } catch {
    // Standalone runs outside the repo — version stays unknown.
    return "0.0.0";
  }
}

async function main(): Promise<void> {
  const cwd = process.cwd();

  // Keys first: the first-run wizard reads them via resolveKeys(), and
  // ensurePostdiffHome() would create config.json and defeat the first-run check.
  await bootstrapEnv(cwd);
  const didSetup = await maybeFirstRunSetup(process.argv);
  if (didSetup) {
    // The wizard wrote ~/.postdiff/.env after the first bootstrap, so
    // process.env is stale — reload, otherwise generate/review immediately
    // fail with "missing key" for keys just saved. Real env still wins.
    await bootstrapEnv(cwd);
  }
  await ensurePostdiffHome();

  await runProgram(process.argv, cwd, await readVersion());
}

main().catch((err) => {
  // Last-resort surface: commands render their own failures with log.error +
  // outro; only truly unexpected throws land here. Clack (not console) keeps
  // the gutter intact even this late.
  p.log.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
