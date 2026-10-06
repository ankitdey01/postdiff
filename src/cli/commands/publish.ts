// `postdiff publish` — copy an approved draft to the clipboard. Copy-only by
// design (no platform APIs, no browser tabs in v1). Thin interface over the
// core gate: all draft/review/hash decisions live in core/publish.
// Clack UI: the copied text previews in a bordered note, outcome as log lines.

import clipboardy from "clipboardy";
import * as p from "@clack/prompts";
import { platformDraftFile, preparePublish } from "../../index.js";
import { resolveDraftDir, readDraft, ensurePlatform } from "../helpers.js";
import type { CommandContext, PostdiffCommand } from "../router.js";
import { uiIntro, uiOutro } from "../ui.js";

async function run(ctx: CommandContext): Promise<void> {
  uiIntro("publish");
  const platform = await ensurePlatform(ctx.opts);
  if (platform === undefined) {
    p.cancel("cancelled — nothing copied.");
    process.exitCode = 1;
    return;
  }
  if (platform === null) {
    if (process.exitCode !== 1) {
      p.log.error("Pick a platform: --blog, --x, or --linkedin (or run interactively).");
      process.exitCode = 1;
    }
    uiOutro("nothing copied.");
    return;
  }

  const { dir, sha } = await resolveDraftDir(ctx.cwd, ctx.positional[0]);
  let file: string;
  let body: string;
  try {
    // Gate throws user-facing errors (unaccepted, stale, missing draft).
    ({ file, body } = await preparePublish(dir, platform, await readDraft(dir, platformDraftFile(platform)), sha.slice(0, 8)));
  } catch (err) {
    p.log.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    uiOutro("nothing copied.");
    return;
  }

  if (platform === "x" && body.trim().length > 280) {
    p.log.warn(`warning: ${body.trim().length} chars exceeds X's 280 — trim before pasting.`);
  }
  p.note(body.trimEnd() || "(empty)", `${file} · preview`);
  try {
    await clipboardy.write(body);
  } catch (err) {
    p.log.error(`Couldn't reach the clipboard: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
    uiOutro("nothing copied.");
    return;
  }
  p.log.success(`copied ${file} (${body.length} chars) — paste wherever you like.`);
  uiOutro("done.");
}

export const command: PostdiffCommand = {
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
