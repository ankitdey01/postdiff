// Shared CLI helpers: single-select flags + draft-dir resolution.
// One implementation for all commands — no per-file copies. CLI-only.

import { join } from "node:path";
import { readFile } from "node:fs/promises";
import type { Telemetry } from "ai";
import * as p from "@clack/prompts";
import { getRepoSlug, getPostdiffHome, resolveSha, appendPreferenceRule, platformPreferenceFile, MAX_PREFERENCE_RULES } from "../index.js";
import { isInteractive } from "./ui.js";
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
    p.log.error(`One file at a time — pass one of ${allowed.map((x) => `--${x}`).join(", ")} (got ${pick.map((x) => `--${x}`).join(", ")}).`);
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
    p.log.error(`One platform at a time — pass one of --blog, --x, --linkedin (got ${want.map((x) => `--${x}`).join(", ")}).`);
    process.exitCode = 1;
    return null;
  }
  return want[0] as Platform;
}

/**
 * Flag-first platform resolver with an interactive fallback: `--blog/--x/--linkedin`
 * win when passed; on a TTY with no flag we `select` instead of erroring.
 * Returns the platform, null when unavailable (conflict already reported, or
 * non-TTY with no flag — caller prints its own usage error), undefined when
 * the user cancelled the picker.
 */
export async function ensurePlatform(opts: Record<string, unknown>): Promise<Platform | null | undefined> {
  const direct = requestedPlatform(opts);
  if (direct) return direct;
  if (process.exitCode === 1) return null; // conflicting flags — error already set
  if (!isInteractive()) return null;
  const picked = await p.select({
    message: "Which platform?",
    options: [
      { value: "x", label: "X" },
      { value: "linkedin", label: "LinkedIn" },
      { value: "blog", label: "Blog" },
    ],
  });
  if (p.isCancel(picked)) return undefined;
  return picked as Platform;
}

/** Saves a global preference rule and reports the result. Shared by review accept+reject. */
export async function savePreferenceRule(platform: Platform, rule: string): Promise<void> {
  const home = getPostdiffHome();
  const file = platformPreferenceFile(platform);
  const res = await appendPreferenceRule(join(home, "preferences"), file, rule);
  if (res === "appended") {
    p.log.success(`platform rule saved to preferences/${file}`);
    return;
  }
  if (res === "appended-rotated") {
    p.log.warn(`platform rule saved (oldest rule rotated out at cap ${MAX_PREFERENCE_RULES})`);
    return;
  }
  p.log.message(`platform rule already known — skipped`);
}

/** sha dir for a commit (default HEAD): ~/.postdiff/repos/<slug>/<sha>/ */
export async function resolveDraftDir(cwd: string, shaOrHead?: string): Promise<{ dir: string; sha: string }> {
  const sha = await resolveSha(cwd, shaOrHead ?? "HEAD");
  const slug = await getRepoSlug(cwd);
  return { dir: join(getPostdiffHome(), "repos", slug, sha), sha };
}

/** Draft text, or null when it was never generated. */
export async function readDraft(dir: string, file: string): Promise<string | null> {
  try {
    return await readFile(join(dir, file), "utf8");
  } catch {
    return null;
  }
}

/** DevTools capture is opt-in: --devtools flag or POSTDIFF_DEVTOOLS=1. Off by default. */
export function isDevtoolsEnabled(opts: Record<string, unknown>): boolean {
  return opts["devtools"] === true || process.env["POSTDIFF_DEVTOOLS"] === "1";
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
