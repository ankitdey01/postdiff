// `tract publish` — copy an approved draft to the clipboard. Copy-only by
// design (no platform APIs, no browser tabs in v1). Thin interface over the
// core gate: all draft/review/hash decisions live in core/publish.

import clipboardy from "clipboardy";
import { platformDraftFile, preparePublish } from "../../index.js";
import { resolveDraftDir, readDraft, requestedPlatform } from "../helpers.js";
import type { CommandContext, TractCommand } from "../router.js";

async function run(ctx: CommandContext): Promise<void> {
  const platform = requestedPlatform(ctx.opts);
  if (platform === null) {
    if (process.exitCode !== 1) console.error("Pick a platform: --blog, --x, or --linkedin.");
    process.exitCode = 1;
    return;
  }

  const { dir, sha } = await resolveDraftDir(ctx.cwd, ctx.positional[0]);
  // Gate throws user-facing errors; main() prints the message and exits 1.
  const { file, body } = await preparePublish(dir, platform, await readDraft(dir, platformDraftFile(platform)), sha.slice(0, 8));

  if (platform === "x" && body.trim().length > 280) {
    console.warn(`warning: ${body.trim().length} chars exceeds X's 280 — trim before pasting.`);
  }
  try {
    await clipboardy.write(body);
  } catch (err) {
    console.error(`Couldn't reach the clipboard: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
    return;
  }
  console.log(`copied ${file} (${body.length} chars) — paste wherever you like.`);
}

export const command: TractCommand = {
  name: "publish",
  description: "copy an approved draft to the clipboard",
  args: [{ name: "sha", description: "commit to publish (default HEAD)" }],
  options: [
    { flags: "--blog", description: "publish the blog draft" },
    { flags: "--x", description: "publish the X draft" },
    { flags: "--linkedin", description: "publish the LinkedIn draft" },
  ],
  run,
};
