// Plugin skills: user-pasted custom skill `.md` files per platform, one file
// per skill: ~/.postdiff/plugins/<platform>/<skill-name>.md
// (e.g. plugins/blog/blog-seo-check.md). Generation concatenates every file
// in the platform folder and treats them as skills to follow while drafting.
// V1: static files only.

import { join, basename } from "node:path";
import { mkdir, readFile, writeFile, unlink, readdir, stat } from "node:fs/promises";
import { SAMPLE_SEPARATOR, splitEntries } from "./samplefile.js";

export { SAMPLE_SEPARATOR };

export const PLUGIN_PLATFORMS = ["blog", "x", "linkedin"] as const;
export type PluginPlatform = (typeof PLUGIN_PLATFORMS)[number];

/** Platform dir under the plugins home (`<home>/blog`). */
export function platformPluginDir(pluginHome: string, platform: PluginPlatform): string {
  return join(pluginHome, platform);
}

/**
 * Parses the skill name from a pasted skill file's frontmatter:
 * `---\nname: my-skill\n...---`. Returns null when absent.
 */
export function parseSkillName(content: string): string | null {
  const fm = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return null;
  const nameMatch = fm[1].match(/^name\s*:\s*(.+?)\s*$/m);
  if (!nameMatch) return null;
  const raw = nameMatch[1].trim().replace(/^['"]|['"]$/g, "").trim();
  return raw || null;
}

/** Filename-safe form of a skill name (`Blog SEO!` -> `blog-seo`). Empty when nothing usable. */
export function sanitizeSkillName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

/**
 * Pre-creates the 3 platform folders. Migrates the retired flat layout
 * (`plugins/blog.md` holding separator-joined skills) into individual files
 * once, then deletes the legacy file — so old installs keep their skills.
 */
export async function ensurePluginFiles(pluginHome: string): Promise<void> {
  await mkdir(pluginHome, { recursive: true });
  for (const platform of PLUGIN_PLATFORMS) {
    await mkdir(join(pluginHome, platform), { recursive: true });
  }
  await migrateLegacyFlatFiles(pluginHome);
}

async function migrateLegacyFlatFiles(pluginHome: string): Promise<void> {
  for (const platform of PLUGIN_PLATFORMS) {
    const legacyPath = join(pluginHome, `${platform}.md`);
    let content: string;
    try {
      const st = await stat(legacyPath);
      if (!st.isFile()) continue;
      content = await readFile(legacyPath, "utf8");
    } catch {
      continue;
    }
    try {
      if (content.trim()) {
        const entries = splitEntries(content);
        const items = entries.length > 0 ? entries : [content.trim()];
        for (let i = 0; i < items.length; i++) {
          const entry = items[i];
          const parsed = parseSkillName(entry);
          let base = (parsed ? sanitizeSkillName(parsed) : "") || `skill-${i + 1}`;
          base = await uniqueSkillName(join(pluginHome, platform), base);
          await writeFile(join(pluginHome, platform, `${base}.md`), `${entry.trim()}\n`, "utf8");
        }
      }
    } finally {
      await unlink(legacyPath).catch(() => {});
    }
  }
}

async function uniqueSkillName(dir: string, base: string): Promise<string> {
  let candidate = base;
  for (let n = 2; ; n++) {
    try {
      await stat(join(dir, `${candidate}.md`));
      candidate = `${base}-${n}`;
    } catch {
      return candidate;
    }
  }
}

/** Sorted skill names (without `.md`) for a platform. Empty when none. */
export async function listPluginSkills(pluginHome: string, platform: PluginPlatform): Promise<string[]> {
  try {
    const files = await readdir(join(pluginHome, platform));
    return files
      .filter((f) => f.toLowerCase().endsWith(".md"))
      .map((f) => basename(f, ".md"))
      .sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return [];
    throw err;
  }
}

/** Reads one skill file. Throws when missing. */
export async function readPluginSkill(pluginHome: string, platform: PluginPlatform, name: string): Promise<string> {
  const safe = sanitizeSkillName(name);
  if (!safe) throw new Error("Invalid plugin name — use letters, numbers, dashes.");
  try {
    return await readFile(join(pluginHome, platform, `${safe}.md`), "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      throw new Error(`No plugin "${safe}" for --${platform}.`);
    }
    throw err;
  }
}

/**
 * Writes (creates or overwrites) one skill file. Returns the final file-safe
 * name used. Overwrites unconditionally — no confirm (same rule as voice).
 */
export async function writePluginSkill(
  pluginHome: string,
  platform: PluginPlatform,
  name: string,
  skill: string,
): Promise<string> {
  const trimmed = skill.trim();
  if (!trimmed) throw new Error("Nothing to write — skill is empty.");
  const safe = sanitizeSkillName(name);
  if (!safe) throw new Error("Invalid plugin name — use letters, numbers, dashes (e.g. blog-seo-check).");
  await mkdir(join(pluginHome, platform), { recursive: true });
  await writeFile(join(pluginHome, platform, `${safe}.md`), `${trimmed}\n`, "utf8");
  return safe;
}

/** Deletes one skill file. Throws when missing. */
export async function deletePluginSkill(pluginHome: string, platform: PluginPlatform, name: string): Promise<string> {
  const safe = sanitizeSkillName(name);
  if (!safe) throw new Error("Invalid plugin name — use letters, numbers, dashes.");
  try {
    await unlink(join(pluginHome, platform, `${safe}.md`));
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      throw new Error(`No plugin "${safe}" for --${platform}.`);
    }
    throw err;
  }
  return safe;
}

/**
 * Concatenated content of EVERY skill file in the platform folder (sorted),
 * joined with the shared entry separator. Empty string when no skills.
 * This is what generation passes to the model.
 */
export async function readPluginSkills(pluginHome: string, platform: PluginPlatform): Promise<string> {
  const names = await listPluginSkills(pluginHome, platform);
  const parts: string[] = [];
  for (const name of names) {
    try {
      const content = await readFile(join(pluginHome, platform, `${name}.md`), "utf8");
      if (content.trim()) parts.push(content.trim());
    } catch {
      continue;
    }
  }
  return parts.join(SAMPLE_SEPARATOR);
}
