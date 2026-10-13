// `postdiff plugin` — manage custom skill plugins per platform.
// Layout: ~/.postdiff/plugins/<platform>/<skill-name>.md (one file per
// skill, e.g. plugins/blog/blog-seo-check.md). Generation concatenates every
// file in the platform folder. Subcommands: create | delete | view.
// Clack UI: skills in bordered notes, outcomes as log lines, `select` /
// `text` / `multiline` fallbacks when flags or args are missing on a TTY.

import { join } from "node:path";
import * as p from "@clack/prompts";
import {
  getPostdiffHome,
  ensurePluginFiles,
  listPluginSkills,
  readPluginSkill,
  writePluginSkill,
  deletePluginSkill,
  parseSkillName,
  sanitizeSkillName,
  PLUGIN_PLATFORMS,
} from "@postdiff/core";
import type { CommandContext, PostdiffCommand } from "../router.js";
import type { PluginPlatform } from "@postdiff/core";
import { singleFlag } from "../helpers.js";
import { uiIntro, uiOutro, isInteractive, showNote, promptLongText } from "../ui.js";

function pluginHome(): string {
  return join(getPostdiffHome(), "plugins");
}

/** Reads --blog/--x/--linkedin (commander rejects anything else). */
function platformFromOpts(ctx: CommandContext): PluginPlatform | null {
  const pick = singleFlag(ctx.opts, ["blog", "x", "linkedin"]);
  if (!pick) return null;
  if (process.exitCode === 1) return null;
  return pick as PluginPlatform;
}

async function ensurePlatform(ctx: CommandContext): Promise<PluginPlatform | null | undefined> {
  const direct = platformFromOpts(ctx);
  if (direct) return direct;
  if (process.exitCode === 1) return null;
  if (!isInteractive()) return null;
  const picked = await p.select({
    message: "Which platform?",
    options: PLUGIN_PLATFORMS.map((pl) => ({ value: pl, label: `--${pl}` })),
  });
  if (p.isCancel(picked)) return undefined;
  return picked as PluginPlatform;
}

/**
 * Skill content for `create`: `postdiff plugin create --blog <name> "<skill>"`,
 * a lone `"<skill>"` arg (name parsed from its frontmatter later), or an
 * interactive multiline paste. Null = missing and non-interactive.
 */
async function ensureSkillBody(args: string[]): Promise<string | null | undefined> {
  // create with explicit name: [name, ...skill]
  const body = args.length >= 2 ? args.slice(1).join(" ") : args.length === 1 ? args[0] : "";
  if (body.trim()) return body;
  if (!isInteractive()) return null;
  const pasted = await promptLongText(
    "Paste the skill file (.md with frontmatter)",
    "---\nname: my-skill\ndescription: >\n  What this skill does…\n---\n\n# Skill instructions…",
  );
  if (p.isCancel(pasted)) return undefined;
  return pasted.trim();
}

/**
 * Skill name for `create`: explicit first arg, else the `name:` parsed from
 * the pasted skill file offered as the editable default, else a prompt.
 */
async function ensureSkillName(args: string[], skillBody: string): Promise<string | null | undefined> {
  const explicit = args.length >= 2 ? args[0].trim() : "";
  if (explicit && sanitizeSkillName(explicit)) return explicit;
  if (!isInteractive()) {
    const parsed = parseSkillName(skillBody);
    return parsed ?? null;
  }
  const parsed = parseSkillName(skillBody);
  const asked = await p.text({
    message: "Skill name (file: plugins/<platform>/<name>.md)",
    initialValue: parsed ?? "",
    placeholder: parsed ?? "my-skill",
    validate: (v) => {
      if (!v || !v.trim()) return "Name is required.";
      if (!sanitizeSkillName(v)) return "Use letters, numbers, dashes (e.g. blog-seo-check).";
      return undefined;
    },
  });
  if (p.isCancel(asked)) return undefined;
  return (asked as string).trim();
}

/** Skill name for `delete`/`view`: arg, else a picker over existing skills. */
async function ensureExistingName(
  dir: string,
  platform: PluginPlatform,
  args: string[],
  action: string,
): Promise<string | null | undefined> {
  if (args[0]?.trim()) return args[0].trim();
  if (!isInteractive()) return null;
  const names = await listPluginSkills(dir, platform);
  if (names.length === 0) return null;
  const picked = await p.select({
    message: `Which ${platform} skill to ${action}?`,
    options: names.map((n) => ({ value: n, label: `${n}.md` })),
  });
  if (p.isCancel(picked)) return undefined;
  return picked as string;
}

async function showSkill(dir: string, platform: PluginPlatform, name: string): Promise<void> {
  showNote(await readPluginSkill(dir, platform, name), `${platform}/${sanitizeSkillName(name)}.md`);
}

async function run(ctx: CommandContext): Promise<void> {
  uiIntro("plugin");
  let sub = ctx.positional[0];
  const dir = pluginHome();
  await ensurePluginFiles(dir);

  if (sub !== "view" && sub !== "create" && sub !== "delete") {
    // Flags/args win when passed; on a TTY offer the action picker instead of
    // usage-erroring outright.
    if (!isInteractive()) {
      p.log.error('Usage: postdiff plugin [create|delete|view] [--blog|--x|--linkedin] [name] ["<skill.md>"]');
      process.exitCode = 1;
      uiOutro("nothing changed.");
      return;
    }
    const picked = await p.select({
      message: "What do you want to do?",
      options: [
        { value: "view", label: "View", hint: "show skill file(s)" },
        { value: "create", label: "Create", hint: "save a skill file" },
        { value: "delete", label: "Delete", hint: "delete a skill file" },
      ],
    });
    if (p.isCancel(picked)) {
      p.cancel("cancelled — nothing changed.");
      process.exitCode = 1;
      return;
    }
    sub = picked as string;
  }

  if (sub === "view") {
    const platform = platformFromOpts(ctx);
    if (process.exitCode === 1) {
      uiOutro("nothing shown.");
      return;
    }
    const nameArg = ctx.positional[1]?.trim() || "";
    if (platform && nameArg) {
      try {
        await showSkill(dir, platform, nameArg);
      } catch (err) {
        p.log.error(err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
        uiOutro("nothing shown.");
        return;
      }
      uiOutro("done.");
      return;
    }
    const platforms: PluginPlatform[] = platform ? [platform] : [...PLUGIN_PLATFORMS];
    if (!platform && !nameArg && isInteractive() && ctx.positional.length <= 1) {
      const picked = await p.select({
        message: "Which platform?",
        options: [
          { value: "__all__", label: "All platforms" },
          ...PLUGIN_PLATFORMS.map((pl) => ({ value: pl, label: `--${pl}` })),
        ],
      });
      if (p.isCancel(picked)) {
        p.cancel("cancelled — nothing shown.");
        process.exitCode = 1;
        return;
      }
      if (picked !== "__all__") {
        platforms.length = 0;
        platforms.push(picked as PluginPlatform);
      }
    }
    let shown = 0;
    for (const pl of platforms) {
      const names = await listPluginSkills(dir, pl);
      if (nameArg) {
        const match = names.find((n) => n === sanitizeSkillName(nameArg));
        if (match) {
          await showSkill(dir, pl, match);
          shown++;
        }
        continue;
      }
      for (const n of names) {
        await showSkill(dir, pl, n);
        shown++;
      }
    }
    if (shown === 0) p.log.warn("no plugin skills yet.");
    uiOutro("done.");
    return;
  }

  if (sub === "delete") {
    const platform = await ensurePlatform(ctx);
    if (platform === undefined) {
      p.cancel("cancelled — nothing changed.");
      process.exitCode = 1;
      return;
    }
    if (!platform) {
      p.log.error('Specify a platform: --blog, --x, or --linkedin. e.g. postdiff plugin delete --blog blog-seo-check');
      process.exitCode = 1;
      uiOutro("nothing changed.");
      return;
    }
    const name = await ensureExistingName(dir, platform, ctx.positional.slice(1), "delete");
    if (name === undefined) {
      p.cancel("cancelled — nothing changed.");
      process.exitCode = 1;
      return;
    }
    if (!name) {
      p.log.error(`Nothing to delete — no ${platform} skills yet, or pass a name. e.g. postdiff plugin delete --${platform} <name>`);
      process.exitCode = 1;
      uiOutro("nothing changed.");
      return;
    }
    try {
      const deleted = await deletePluginSkill(dir, platform, name);
      p.log.success(`deleted ${platform}/${deleted}.md`);
    } catch (err) {
      p.log.error(err instanceof Error ? err.message : String(err));
      process.exitCode = 1;
      uiOutro("nothing changed.");
      return;
    }
    uiOutro("done.");
    return;
  }

  // sub === "create"
  const platform = await ensurePlatform(ctx);
  if (platform === undefined) {
    p.cancel("cancelled — nothing changed.");
    process.exitCode = 1;
    return;
  }
  if (!platform) {
    p.log.error('Specify a platform: --blog, --x, or --linkedin. e.g. postdiff plugin create --blog blog-seo-check "<skill.md>"');
    process.exitCode = 1;
    uiOutro("nothing changed.");
    return;
  }
  const args = ctx.positional.slice(1);
  const skill = await ensureSkillBody(args);
  if (skill === undefined) {
    p.cancel("cancelled — nothing changed.");
    process.exitCode = 1;
    return;
  }
  if (skill === null) {
    p.log.error(`Nothing to save — pass "<skill.md>" or run interactively. e.g. postdiff plugin create --${platform} my-skill "<skill.md>"`);
    process.exitCode = 1;
    uiOutro("nothing changed.");
    return;
  }
  if (!skill.trim()) {
    p.log.warn("empty skill — nothing changed.");
    uiOutro("nothing changed.");
    return;
  }
  const name = await ensureSkillName(args, skill);
  if (name === undefined) {
    p.cancel("cancelled — nothing changed.");
    process.exitCode = 1;
    return;
  }
  if (!name || !sanitizeSkillName(name)) {
    if (!isInteractive()) {
      p.log.error(`Could not parse a skill name — pass one explicitly. e.g. postdiff plugin create --${platform} my-skill "<skill.md>"`);
      process.exitCode = 1;
      uiOutro("nothing changed.");
      return;
    }
    p.log.warn("empty name — nothing changed.");
    uiOutro("nothing changed.");
    return;
  }
  try {
    const saved = await writePluginSkill(dir, platform, name, skill);
    p.log.success(`saved ${platform}/${saved}.md`);
  } catch (err) {
    p.log.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    uiOutro("nothing changed.");
    return;
  }
  uiOutro("done.");
}

export const command: PostdiffCommand = {
  name: "plugin",
  description: "manage custom skill plugins (create/delete/view)",
  args: [
    { name: "sub", description: "create | delete | view" },
    { name: "name", description: "skill name (create/delete, view filter)" },
    { name: "skill", description: "pasted skill .md file (create)", variadic: true },
  ],
  options: [
    { flags: "--blog", description: "blog skills (plugins/blog/)" },
    { flags: "--x", description: "x skills (plugins/x/)" },
    { flags: "--linkedin", description: "linkedin skills (plugins/linkedin/)" },
  ],
  run,
};
