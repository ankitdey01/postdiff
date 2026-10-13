// `postdiff setup` — first-run and update wizard. clack prompts live here
// (cli only); persistence and key pings live in core/setup.ts. Nothing is
// written to disk unless the user completes every step — a cancel mid-way
// leaves the previous install untouched.

import * as p from "@clack/prompts";
import { applySetup, pingProviderKey, pingTypesafeKey, loadConfig, PROVIDERS, getProviderSpec, parseSkillName, type Platform, type ProviderSpec } from "@postdiff/core";
import { resolveKeys } from "../keys.js";
import { startBigTextLoop } from "../big-text.js";
import { promptLongText } from "../ui.js";
import type { CommandContext, PostdiffCommand } from "../router.js";

const TYPESAFE_KEYS_URL = "https://console.typesafe.ai/keys";

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
  // One bordered box per key (not per attempt) so the gutter never doubles up.
  p.note(url, `Get a key · ${label}`);
  for (;;) {
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
    s.error(`Validation failed.`);
    p.log.error(err);
  }
}

async function promptOptionalMarkdown(label: string, what: string): Promise<string> {
  // Gated behind a confirm so skipping is one keypress. Paste-safe multiline
  // (see `promptLongText`): blank lines in the paste must not submit early.
  const add = await p.confirm({ message: `Add ${label}? (optional)`, initialValue: false });
  if (p.isCancel(add)) cancelled();
  if (!add) return "";
  const value = await promptLongText(`Paste ${what}`, `Your ${what} markdown…`);
  if (p.isCancel(value)) cancelled();
  return value.trim();
}

/** Sentinel value for the "type any model id" option in the model picker. */
const CUSTOM_MODEL = "__custom__";

/** Provider picker: curated registry, preselecting the currently configured one. */
async function promptProvider(currentId: string): Promise<ProviderSpec> {
  const selected = await p.select({
    message: "Generation provider",
    initialValue: getProviderSpec(currentId)?.id,
    options: PROVIDERS.map((s) => ({ value: s.id, label: s.label, hint: s.envKey })),
  });
  if (p.isCancel(selected)) cancelled();
  const spec = getProviderSpec(selected);
  if (!spec) cancelled();
  return spec;
}

/** Model picker: curated per provider, plus a custom-id escape hatch. */
async function promptModel(spec: ProviderSpec, currentModel: string): Promise<string> {
  const preselect = spec.models.includes(currentModel) ? currentModel : spec.models[0];
  const selected = await p.select({
    message: `Model for ${spec.label}`,
    initialValue: preselect,
    options: [
      ...spec.models.map((m) => ({ value: m, label: m, hint: m === spec.models[0] ? "recommended" : undefined })),
      { value: CUSTOM_MODEL, label: "Custom model id…", hint: "any model id this provider serves" },
    ],
  });
  if (p.isCancel(selected)) cancelled();
  if (selected !== CUSTOM_MODEL) return selected;
  const custom = await p.text({
    message: "Model id",
    initialValue: currentModel.trim() || preselect,
    placeholder: spec.models[0],
    validate: (v) => (!v || !v.trim() ? "Model id is required." : undefined),
  });
  if (p.isCancel(custom)) cancelled();
  return custom.trim();
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
 * Optional plugin skill: paste the whole skill file first, then confirm the
 * file name — pre-filled from the pasted file's `name:` frontmatter.
 */
async function promptPlugin(): Promise<{ platform: Platform; name: string; content: string } | null> {
  const content = await promptOptionalMarkdown("Plugin skill", "plugin skill");
  if (!content) return null;
  const parsed = parseSkillName(content);
  const name = await p.text({
    message: "Plugin skill name (file: plugins/<platform>/<name>.md)",
    initialValue: parsed ?? "",
    placeholder: parsed ?? "my-skill",
    validate: (v) => (!v || !v.trim() ? "Name is required for the plugin skill." : undefined),
  });
  if (p.isCancel(name)) cancelled();
  const platform = await p.select({
    message: "Which platform is this plugin skill for?",
    options: [
      { value: "x" as Platform, label: "X" },
      { value: "linkedin" as Platform, label: "LinkedIn" },
      { value: "blog" as Platform, label: "Blog" },
    ],
  });
  if (p.isCancel(platform)) cancelled();
  return { platform, name: (name as string).trim(), content };
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
  // Looping block-letter banner (raw stdout, uppercase "POSTDIFF"). Returns
  // immediately — the Clack session opens below while the glint keeps
  // sweeping above. Stopped in `finally` so cancel/decline restores cleanly.
  const stopBanner = startBigTextLoop("postdiff");
  try {
    const { typesafeKey: currentTypesafe, providerKeys } = resolveKeys();
    const config = await loadConfig();
    const currentUser = config.user.name;

    p.intro("postdiff setup");
    p.note(
      "name      → ~/.postdiff/config.json\nAPI keys  → ~/.postdiff/.env (never in config.json)\nvoice/reference → ~/.postdiff/{voice,reference}/\nplugins   → ~/.postdiff/plugins/<platform>/<skill>.md",
      "Everything stays local",
    );

    const name = await p.text({
      message: "Your name (required — used to sign drafts)",
      initialValue: currentUser,
      validate: (v) => (!v || !v.trim() ? "Name is required — it cannot be skipped." : undefined),
    });
    if (p.isCancel(name)) cancelled();

    const typesafeKey = await promptRequiredKey("TYPESAFE_API_KEY (Jev)", TYPESAFE_KEYS_URL, pingTypesafeKey, currentTypesafe);

    const providerSpec = await promptProvider(config.models.provider);
    const genModel = await promptModel(providerSpec, config.models.genModel);
    const currentProviderKey = providerKeys[providerSpec.envKey] ?? "";
    const providerKey = await promptRequiredKey(
      providerSpec.envKey,
      providerSpec.keysUrl,
      (key) => pingProviderKey(providerSpec.id, key, genModel),
      currentProviderKey,
    );

    const voiceMd = await promptOptionalMarkdown("Voice profile (voice.md)", "voice");
    const reference = await promptReference();
    const plugin = await promptPlugin();

    const proceed = await p.confirm({
      message: `Save this setup${voiceMd || reference || plugin ? " (incl. voice/reference/plugin)" : ""}?`,
      initialValue: true,
    });
    if (p.isCancel(proceed) || !proceed) cancelled();

    const result = await applySetup({
      name,
      typesafeKey,
      provider: providerSpec.id,
      genModel,
      providerKey,
      voiceMd,
      referencePlatform: reference?.platform,
      referenceMd: reference?.content,
      pluginPlatform: plugin?.platform,
      pluginName: plugin?.name,
      pluginMd: plugin?.content,
    });
    p.outro(`Setup saved — ${providerSpec.label} · ${genModel}\nconfig: ${result.configPath}\nKeys: ${result.envPath}\nTry it: postdiff generate --x`);
    return true;
  } finally {
    stopBanner();
  }
}

async function run(_ctx: CommandContext): Promise<void> {
  await runSetupWizard();
}

export const command: PostdiffCommand = {
  name: "setup",
  description: "first-run or update setup: name, provider/model/key, optional voice/reference/plugin",
  run,
};
