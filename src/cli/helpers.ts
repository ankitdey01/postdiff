// Shared CLI helpers: single-select flags + draft-dir resolution.
// One implementation for all commands — no per-file copies. CLI-only.

import { join } from "node:path";
import { readFile } from "node:fs/promises";
import type { Telemetry } from "ai";
import { getRepoSlug, getTractHome, resolveSha } from "../index.js";

/** Names of the flags set to true, restricted to an allow-list. */
export function selectedFlags(opts: Record<string, unknown>, allowed: readonly string[]): string[] {
  return allowed.filter((name) => opts[name] === true);
}

/** sha dir for a commit (default HEAD): ~/.tract/repos/<slug>/<sha>/ */
export async function resolveDraftDir(cwd: string, shaOrHead?: string): Promise<{ dir: string; sha: string }> {
  const sha = await resolveSha(cwd, shaOrHead ?? "HEAD");
  const slug = await getRepoSlug(cwd);
  return { dir: join(getTractHome(), "repos", slug, sha), sha };
}

/** Draft text, or null when it was never generated. */
export async function readDraft(dir: string, file: string): Promise<string | null> {
  try {
    return await readFile(join(dir, file), "utf8");
  } catch {
    return null;
  }
}

/** DevTools capture is opt-in: --devtools flag or TRACT_DEVTOOLS=1. Off by default. */
export function isDevtoolsEnabled(opts: Record<string, unknown>): boolean {
  return opts["devtools"] === true || process.env["TRACT_DEVTOOLS"] === "1";
}

/**
 * Loads the DevTools telemetry integration on demand. Returns [] when disabled
 * so call sites pass it straight through. Dynamic import keeps normal runs
 * free of the devtools package.
 */
export async function loadDevtoolsTelemetry(enabled: boolean): Promise<Telemetry[]> {
  if (!enabled) return [];
  const { DevToolsTelemetry } = await import("@ai-sdk/devtools");
  return [DevToolsTelemetry()];
}

/** Hint printed when a run was captured. Viewer itself runs separately. */
export function devtoolsHint(): string {
  return "devtools: run captured to .devtools/ — inspect with `npx @ai-sdk/devtools@latest` (http://localhost:4983).";
}
