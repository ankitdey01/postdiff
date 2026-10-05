#!/usr/bin/env node
// CLI entry point. First-run setup check, then bootstrap (~/.postdiff, .env),
// then runs the program. All env/console/process access lives in cli/ — never
// inside core/.

import { readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureTractHome, getConfigPath } from "../index.js";
import { runProgram } from "./router.js";
import { runSetupWizard } from "./commands/setup.js";
import { bootstrapEnv } from "./keys.js";

/**
 * First-run sentinel: config.json missing + a command that needs API keys +
 * an interactive terminal → run the setup wizard before anything else.
 * `--help`/`-h` and every other command never hijack. Nothing is written on
 * cancel; the command itself then surfaces the missing-key error.
 */
async function maybeFirstRunSetup(argv: string[]): Promise<void> {
  const invoked = argv[2] ?? "";
  if (invoked !== "generate" && invoked !== "review") return;
  if (argv.includes("--help") || argv.includes("-h")) return;
  if (!process.stdout.isTTY) return;
  try {
    await stat(getConfigPath());
    return; // config exists — setup already done
  } catch {
    // No config.json → first run.
  }
  await runSetupWizard();
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
  // ensureTractHome() would create config.json and defeat the first-run check.
  await bootstrapEnv(cwd);
  await maybeFirstRunSetup(process.argv);
  await ensureTractHome();

  await runProgram(process.argv, cwd, await readVersion());
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
