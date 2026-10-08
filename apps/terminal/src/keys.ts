// CLI: the single key-resolution point. Precedence: real env > cwd/.env >
// ~/.postdiff/.env (written by `postdiff setup`). Commands never read
// process.env directly — they call resolveKeys().

import { readFile } from "node:fs/promises";
import { getEnvPath, providerEnvKeys } from "@postdiff/core";

// Every provider key the registry knows about, plus the non-provider keys.
const KNOWN_KEYS: readonly string[] = ["TYPESAFE_API_KEY", "POSTDIFF_DEVTOOLS", ...Object.values(providerEnvKeys())];

/** Extracts KEY=VALUE pairs (supports `export KEY=...` and quotes). */
function parseEnvText(raw: string): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*["']?([^"'\r\n]+)["']?\s*$/);
    if (!m) continue;
    const key = m[1];
    if (KNOWN_KEYS.includes(key)) pairs.push([key, m[2].trim()]);
  }
  return pairs;
}

/**
 * Loads known keys into process.env from cwd/.env, then ~/.postdiff/.env.
 * Real environment variables always win; earlier files win over later ones.
 * No early return: each key is independent.
 */
export async function bootstrapEnv(cwd: string): Promise<void> {
  for (const path of [`${cwd}/.env`, getEnvPath()]) {
    let raw: string;
    try {
      raw = await readFile(path, "utf8");
    } catch {
      continue;
    }
    for (const [key, value] of parseEnvText(raw)) {
      if (process.env[key]) continue;
      process.env[key] = value;
    }
  }
}

export interface ResolvedKeys {
  typesafeKey: string;
  /** Provider API keys keyed by env var name (GROQ_KEY, OPENAI_API_KEY, …). */
  providerKeys: Record<string, string>;
}

/** Reads the already-bootstrapped keys out of process.env. */
export function resolveKeys(): ResolvedKeys {
  const providerKeys: Record<string, string> = {};
  for (const envKey of Object.values(providerEnvKeys())) {
    const value = process.env[envKey];
    if (value) providerKeys[envKey] = value;
  }
  return {
    typesafeKey: process.env["TYPESAFE_API_KEY"] ?? "",
    providerKeys,
  };
}
