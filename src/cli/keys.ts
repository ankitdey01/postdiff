// CLI: the single key-resolution point. Precedence: real env > cwd/.env >
// ~/.postdiff/.env (written by `postdiff setup`). Commands never read
// process.env directly — they call resolveKeys().

import { readFile } from "node:fs/promises";
import { getEnvPath } from "../index.js";

const KNOWN_KEYS = ["TYPESAFE_API_KEY", "GROQ_KEY", "TRACT_DEVTOOLS"] as const;

type KnownKey = (typeof KNOWN_KEYS)[number];

/** Extracts KEY=VALUE pairs (supports `export KEY=...` and quotes). */
function parseEnvText(raw: string): Array<[KnownKey, string]> {
  const pairs: Array<[KnownKey, string]> = [];
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*["']?([^"'\r\n]+)["']?\s*$/);
    if (!m) continue;
    const key = m[1] as KnownKey;
    if ((KNOWN_KEYS as readonly string[]).includes(key)) pairs.push([key, m[2].trim()]);
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
  groqKey: string;
}

/** Reads the already-bootstrapped keys out of process.env. */
export function resolveKeys(): ResolvedKeys {
  return {
    typesafeKey: process.env["TYPESAFE_API_KEY"] ?? "",
    groqKey: process.env["GROQ_KEY"] ?? "",
  };
}
