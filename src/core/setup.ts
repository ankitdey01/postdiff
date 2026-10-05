// Engine: first-run/update setup. Pure persistence + key validation — the
// clack prompts live in cli/. Secrets are written to ~/.postdiff/.env (never
// config.json, per PRD §8); config.json holds only user + models. All-or-
// nothing: applySetup is called once with complete answers, so a cancelled
// wizard never leaves a partial install on disk.

import { TypeSafeClient } from "@typesafe-ai/sdk";
import { readFile, rename, writeFile } from "node:fs/promises";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { overwriteVoiceSample } from "./profile/voice.js";
import { overwriteReferenceExample, platformReferenceFile } from "./profile/reference.js";
import { ensureTractHome, getConfigPath, getEnvPath, loadConfig, DEFAULT_CONFIG, CONFIG_VERSION } from "./store.js";
import { withTimeout } from "./async.js";

import type { Platform } from "../shared/types.js";

export interface SetupAnswers {
  name: string;
  typesafeKey: string;
  groqKey: string;
  /** Optional full voice.md content (empty/undefined = leave untouched). */
  voiceMd?: string;
  /** Optional reference example: which platform file it lands in. */
  referencePlatform?: Platform;
  /** Optional reference example content (empty/undefined = leave untouched). */
  referenceMd?: string;
}

export interface SetupResult {
  home: string;
  configPath: string;
  envPath: string;
}

const PING_TIMEOUT_MS = 15_000;

/** Live Jev validation: one trivial noul judgment. Null = key works. */
export async function pingTypesafeKey(apiKey: string): Promise<string | null> {
  try {
    const client = new TypeSafeClient({ apiKey });
    const response = await withTimeout(
      client.systemOne({
        state: { ping: "pong" },
        questions: {
          reachable: {
            type: "noul",
            instructions: "Connection check. Answer immediately from the given state.",
            criteria: { true: "The state is present.", false: "The state is missing." },
          },
        },
        model: DEFAULT_CONFIG.models.jevModel,
      }),
      PING_TIMEOUT_MS,
    );
    if (!response.answers?.reachable) return "Jev returned no answer — is this a valid typesafe.ai key?";
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

/** Live Groq validation: one tiny generation. Null = key works. */
export async function pingGroqKey(apiKey: string, model: string = DEFAULT_CONFIG.models.genModel): Promise<string | null> {
  try {
    await withTimeout(
      generateText({
        model: createGroq({ apiKey })(model),
        prompt: "ping",
        maxOutputTokens: 5,
      }),
      PING_TIMEOUT_MS,
    );
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

/** Rewrites ~/.postdiff/.env, replacing the two known keys and keeping everything else. */
async function writeEnvFile(envPath: string, typesafeKey: string, groqKey: string): Promise<void> {
  let lines: string[] = [];
  try {
    lines = (await readFile(envPath, "utf8")).split(/\r?\n/);
  } catch {
    // No existing file — start fresh.
  }
  const wanted: Array<[string, string]> = [
    ["TYPESAFE_API_KEY", typesafeKey],
    ["GROQ_KEY", groqKey],
  ];
  for (const [key, rawValue] of wanted) {
    const value = rawValue.trim();
    if (/[\r\n]/.test(key) || /[\r\n]/.test(value)) {
      // A newline would smuggle extra lines into the env file; refuse instead.
      throw new Error(`Invalid value for ${key}: keys must be a single line.`);
    }
    const line = `${key}=${value}`;
    const idx = lines.findIndex((l) => l.match(new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=`)));
    if (idx >= 0) lines[idx] = line;
    else lines.push(line);
  }
  const tmp = `${envPath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, lines.join("\n") + "\n", { encoding: "utf8", mode: 0o600 });
  await rename(tmp, envPath);
}

/**
 * Full setup, all-or-nothing: persists the restructured config.json (user +
 * models), the API keys into ~/.postdiff/.env, and optional voice/reference
 * content. Call only once with complete answers — there is no partial write.
 */
export async function applySetup(answers: SetupAnswers): Promise<SetupResult> {
  const home = await ensureTractHome();

  // Preserve any customized models; only the user block is ours to set.
  const current = await loadConfig();
  const config = {
    version: CONFIG_VERSION,
    user: { name: answers.name.trim() },
    models: current.models,
  };
  // Keys first, config.json last: config.json is the first-run sentinel, so it
  // must only appear once both writes succeeded.
  const envPath = getEnvPath();
  await writeEnvFile(envPath, answers.typesafeKey, answers.groqKey);

  const configPath = getConfigPath();
  const tmp = `${configPath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, JSON.stringify(config, null, 2) + "\n", "utf8");
  await rename(tmp, configPath);

  const voice = (answers.voiceMd ?? "").trim();
  if (voice) await overwriteVoiceSample(`${home}/voice`, "voice.md", voice);
  const reference = (answers.referenceMd ?? "").trim();
  if (reference && answers.referencePlatform) {
    await overwriteReferenceExample(`${home}/reference`, platformReferenceFile(answers.referencePlatform), reference);
  }

  return { home, configPath, envPath };
}
