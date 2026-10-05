// `postdiff setup` — first-run and update wizard. clack prompts live here
// (cli only); persistence and key pings live in core/setup.ts. Nothing is
// written to disk unless the user completes every step — a cancel mid-way
// leaves the previous install untouched.

import * as p from "@clack/prompts";
import { applySetup, pingGroqKey, pingTypesafeKey, loadConfig, type Platform } from "../../index.js";
import { resolveKeys } from "../keys.js";
import type { CommandContext, TractCommand } from "../router.js";

const TYPESAFE_KEYS_URL = "https://console.typesafe.ai/keys";
const GROQ_KEYS_URL = "https://console.groq.com/keys";

function cancelled(): never {
  p.cancel("Setup cancelled — nothing was saved.");
  throw new SetupAborted();
}

/** Internal control-flow signal: wizard ended early without writing anything. */
class SetupAborted extends Error {
  constructor() {
    super("setup aborted");
  }
}

async function promptRequiredKey(
  label: string,
  url: string,
  ping: (key: string) => Promise<string | null>,
  currentKey: string,
): Promise<string> {
  const hint = currentKey ? " (enter to keep current)" : "";
  for (;;) {
    p.log.info(`Create a key: ${url}`);
    const value = await p.password({ message: `${label}${hint}` });
    if (p.isCancel(value)) cancelled();
    const typed = value.trim();
    if (!typed && currentKey) return currentKey;
    if (!typed) {
      // Nothing to validate — reject locally instead of spending a ping.
      p.log.error(`${label} is required — paste a key to continue.`);
      continue;
    }
    const s = p.spinner();
    s.start(`Validating ${label}…`);
    const err = await ping(typed);
    if (err === null) {
      s.stop(`${label} works.`);
      return typed;
    }
    s.stop(`Validation failed.`);
    p.log.error(err);
  }
}

async function promptOptionalMarkdown(label: string, what: string): Promise<string> {
  const value = await p.multiline({
    message: `${label} (optional — paste content, press Enter twice to submit, or leave empty to skip)`,
    placeholder: `Your ${what} markdown…`,
  });
  if (p.isCancel(value)) cancelled();
  return value.trim();
}

/** Reference examples are per-platform: ask which platform the paste belongs to. */
async function promptReference(): Promise<{ platform: Platform; content: string } | null> {
  const content = await promptOptionalMarkdown("Reference example", "reference");
  if (!content) return null;
  const platform = await p.select({
    message: "Which platform is this reference for?",
    options: [
      { value: "x" as Platform, label: "X" },
      { value: "linkedin" as Platform, label: "LinkedIn" },
      { value: "blog" as Platform, label: "Blog" },
    ],
  });
  if (p.isCancel(platform)) cancelled();
  return { platform, content };
}

/**
 * Runs the full interactive wizard. Resolves true when setup was completed
 * and saved, false when the user cancelled or declined (no writes happened).
 * Throws only on unexpected internal errors.
 */
export async function runSetupWizard(): Promise<boolean> {
  try {
    return await wizard();
  } catch (err) {
    if (err instanceof SetupAborted) return false;
    throw err;
  }
}

async function wizard(): Promise<boolean> {
  const { typesafeKey: currentTypesafe, groqKey: currentGroq } = resolveKeys();
  const currentUser = await loadConfig().then((c) => c.user.name);

  p.intro("postdiff setup");
  p.log.message(
    "Everything stays local:\n" +
      "  name      → ~/.postdiff/config.json\n" +
      "  API keys  → ~/.postdiff/.env (never in config.json)\n" +
      "  voice/reference → ~/.postdiff/{voice,reference}/",
  );

  const name = await p.text({
    message: "Your name (required — used to sign drafts)",
    initialValue: currentUser,
    validate: (v) => (!v || !v.trim() ? "Name is required — it cannot be skipped." : undefined),
  });
  if (p.isCancel(name)) cancelled();

  const typesafeKey = await promptRequiredKey("TYPESAFE_API_KEY (Jev)", TYPESAFE_KEYS_URL, pingTypesafeKey, currentTypesafe);
  const groqKey = await promptRequiredKey("GROQ_KEY", GROQ_KEYS_URL, pingGroqKey, currentGroq);

  const voiceMd = await promptOptionalMarkdown("Voice profile (voice.md)", "voice");
  const reference = await promptReference();

  const proceed = await p.confirm({
    message: `Save this setup${voiceMd || reference ? " (incl. voice/reference)" : ""}?`,
    initialValue: true,
  });
  if (p.isCancel(proceed) || !proceed) cancelled();

  const result = await applySetup({
    name,
    typesafeKey,
    groqKey,
    voiceMd,
    referencePlatform: reference?.platform,
    referenceMd: reference?.content,
  });
  p.outro(`Setup saved — config: ${result.configPath}\nKeys: ${result.envPath}\nTry it: postdiff generate --x`);
  return true;
}

async function run(_ctx: CommandContext): Promise<void> {
  await runSetupWizard();
}

export const command: TractCommand = {
  name: "setup",
  description: "first-run or update setup: name, API keys, optional voice/reference",
  run,
};
