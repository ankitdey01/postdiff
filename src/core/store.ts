// Engine: global ~/.postdiff store. No repo-local .postdiff (locked Q7).

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { join, basename } from "node:path";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import type { Verdict } from "../shared/types.js";
import { ensureVoiceFiles } from "./profile/voice.js";
import { ensureReferenceFiles } from "./profile/reference.js";
import { ensurePreferenceFiles } from "./profile/preferences.js";

export interface PostdiffUser {
  name: string;
}

export interface PostdiffModels {
  jevModel: string;
  threshold: number;
  /** Generation provider id (key into the registry in generation/providers.ts). */
  provider: string;
  genModel: string;
}

export interface PostdiffConfig {
  version: number;
  user: PostdiffUser;
  models: PostdiffModels;
}

export const CONFIG_VERSION = 1;

export const DEFAULT_CONFIG: PostdiffConfig = {
  version: CONFIG_VERSION,
  user: { name: "" },
  models: {
    jevModel: "jev-latest",
    threshold: 0.5,
    provider: "groq",
    genModel: "openai/gpt-oss-20b",
  },
};

export function getPostdiffHome(): string {
  return join(homedir(), ".postdiff");
}

function writeDefaultConfig(path: string): Promise<void> {
  return writeFile(path, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n", "utf8");
}

/** Path to the global config.json — the first-run setup sentinel. */
export function getConfigPath(): string {
  return join(getPostdiffHome(), "config.json");
}

/** Path to the global env file where setup stores API keys. */
export function getEnvPath(): string {
  return join(getPostdiffHome(), ".env");
}

function sha1Hex(s: string, len: number): string {
  return createHash("sha1").update(s).digest("hex").slice(0, len);
}

/** Runs a git command that may fail (null on error). */
function gitQuery(cwd: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    execFile("git", args, { cwd }, (err, stdout) => {
      resolve(err ? null : stdout.trim() || null);
    });
  });
}

/** Namespace drafts per repo inside the global store. */
export async function getRepoSlug(cwd: string): Promise<string> {
  const remote = await gitQuery(cwd, ["remote", "get-url", "origin"]);
  const top = await gitQuery(cwd, ["rev-parse", "--show-toplevel"]);
  const base = top ?? cwd;
  const key = remote ?? base;
  const name = (basename(base) || "repo").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 40);
  return `${name}-${sha1Hex(key, 8)}`;
}

/** Full first-run skeleton: voice + reference + preference files, config, repos dir. */
export async function ensurePostdiffHome(): Promise<string> {
  const home = getPostdiffHome();
  await ensureVoiceFiles(join(home, "voice"));
  await ensureReferenceFiles(join(home, "reference"));
  await ensurePreferenceFiles(join(home, "preferences"));
  await mkdir(join(home, "repos"), { recursive: true });
  const configPath = join(home, "config.json");
  try {
    await readFile(configPath, "utf8");
  } catch {
    await writeDefaultConfig(configPath);
  }
  return home;
}

export async function loadConfig(): Promise<PostdiffConfig> {
  const home = await ensurePostdiffHome();
  const path = join(home, "config.json");
  let parsed: Partial<PostdiffConfig> & Record<string, unknown> = {};
  let corruptOrMissing = false;
  try {
    parsed = JSON.parse(await readFile(path, "utf8")) as Partial<PostdiffConfig> & Record<string, unknown>;
  } catch {
    // Missing or corrupt — fall through to defaults and rewrite.
    corruptOrMissing = true;
  }

  // Legacy flat shape (pre-v1: { jevModel, threshold, genModel }) lifts into `models`.
  const legacy = parsed as { jevModel?: unknown; threshold?: unknown; genModel?: unknown };
  const hasLegacy = !parsed.models && (typeof legacy.jevModel === "string" || typeof legacy.threshold === "number" || typeof legacy.genModel === "string");
  const rawModels = (parsed.models ?? legacy) as Partial<PostdiffModels>;
  const rawUser: Partial<PostdiffUser> = parsed.user ?? {};

  const merged: PostdiffConfig = {
    version: CONFIG_VERSION,
    user: {
      name: typeof rawUser.name === "string" ? rawUser.name : "",
    },
    models: {
      jevModel: typeof rawModels.jevModel === "string" ? rawModels.jevModel : DEFAULT_CONFIG.models.jevModel,
      threshold: typeof rawModels.threshold === "number" ? rawModels.threshold : DEFAULT_CONFIG.models.threshold,
      // Missing provider (pre-registry config) backfills as groq in place —
      // no dedicated migration: loadConfig rewrites the merged shape anyway.
      provider: typeof rawModels.provider === "string" && rawModels.provider ? rawModels.provider : DEFAULT_CONFIG.models.provider,
      genModel: typeof rawModels.genModel === "string" ? rawModels.genModel : DEFAULT_CONFIG.models.genModel,
    },
  };
  // Write only when missing/corrupt, migrating a legacy shape, or backfilling
  // fields; unchanged valid configs are left alone.
  const needsWrite =
    corruptOrMissing ||
    hasLegacy ||
    parsed.version !== merged.version ||
    JSON.stringify(parsed.user) !== JSON.stringify(merged.user) ||
    JSON.stringify(parsed.models) !== JSON.stringify(merged.models);
  if (needsWrite) {
    // Atomic replace so concurrent loads never observe a partial write.
    const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
    await writeFile(tmp, JSON.stringify(merged, null, 2) + "\n", "utf8");
    await rename(tmp, path);
  }
  return merged;
}

export interface DraftMeta {
  sha: string;
  diffHash: string;
  noul: number | null;
  threshold: number;
  verdict: Verdict;
  forced: boolean;
  forcedReason?: string;
  model: string;
  /** Stage-2 inclusion threshold that admitted the keep-list. Null on force-through / empty-stop / unfiltered. */
  includeThreshold: number | null;
  keptFiles: number;
  droppedFiles: number;
  at: string;
}

export function hashDiff(diff: string): string {
  return sha1Hex(diff, 12);
}

export async function saveMeta(slug: string, sha: string, meta: DraftMeta): Promise<string> {
  const dir = join(getPostdiffHome(), "repos", slug, sha);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
  return dir;
}
