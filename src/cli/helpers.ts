// Shared CLI helpers: single-select flags + draft-dir resolution.
// One implementation for all commands — no per-file copies. CLI-only.

import { join } from "node:path";
import { readFile } from "node:fs/promises";
import type { Telemetry } from "ai";
import { getRepoSlug, getTractHome, resolveSha, appendPreferenceRule, platformPreferenceFile, MAX_PREFERENCE_RULES } from "../index.js";
import type { Platform } from "../index.js";

/** Names of the flags set to true, restricted to an allow-list. */
export function selectedFlags(opts: Record<string, unknown>, allowed: readonly string[]): string[] {
  return allowed.filter((name) => opts[name] === true);
}

/**
 * Single-select flag reader shared by voice/preferences/reference.
 * Returns null + exitCode=1 on conflict, null (no exit) when nothing selected.
 */
export function singleFlag(opts: Record<string, unknown>, allowed: readonly string[]): string | null {
  const pick = selectedFlags(opts, allowed);
  if (pick.length === 0) return null;
  if (pick.length > 1) {
    console.error(`One file at a time — pass one of ${allowed.map((p) => `--${p}`).join(", ")} (got ${pick.map((p) => `--${p}`).join(", ")}).`);
    process.exitCode = 1;
    return null;
  }
  return pick[0] as string;
}

const PLATFORMS = ["blog", "x", "linkedin"] as const;

/**
 * Single-platform selector shared across generate/publish/review.
 * Returns null + exitCode=1 on conflict, null (no exit) when nothing selected.
 */
export function requestedPlatform(opts: Record<string, unknown>): Platform | null {
  const want = selectedFlags(opts, PLATFORMS);
  if (want.length === 0) return null;
  if (want.length > 1) {
    console.error(`One platform at a time — pass one of --blog, --x, --linkedin (got ${want.map((p) => `--${p}`).join(", ")}).`);
    process.exitCode = 1;
    return null;
  }
  return want[0] as Platform;
}

/** Saves a global preference rule and prints the result. Shared by review accept+reject. */
export async function savePreferenceRule(platform: Platform, rule: string): Promise<void> {
  const home = getTractHome();
  const file = platformPreferenceFile(platform);
  const res = await appendPreferenceRule(join(home, "preferences"), file, rule);
  if (res === "appended") {
    console.log(`platform rule saved to preferences/${file}`);
    return;
  }
  if (res === "appended-rotated") {
    console.log(`platform rule saved (oldest rule rotated out at cap ${MAX_PREFERENCE_RULES})`);
    return;
  }
  console.log(`platform rule already known — skipped`);
}

/** sha dir for a commit (default HEAD): ~/.postdiff/repos/<slug>/<sha>/ */
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
