// `postdiff context` — inspect the generation-ready context for a commit (no LLM).
// Clack UI outside `--json` (machine output stays bare `console.log` so pipes
// never see gutter lines): header facts as log lines, the file list in one
// bordered note.

import * as p from "@clack/prompts";
import { loadOrGatherCommitContext } from "@postdiff/core";
import { getPostdiffHome, getRepoSlug } from "@postdiff/core";
import { loadSummary, renderSummary } from "@postdiff/core";
import type { CommandContext, PostdiffCommand } from "../router.js";
import { uiIntro, uiOutro } from "../ui.js";

async function run(ctx: CommandContext): Promise<void> {
  const shaOrHead = ctx.positional[0];
  const asJson = ctx.opts["json"] === true;
  const { context: c, source } = await loadOrGatherCommitContext(ctx.cwd, shaOrHead ?? "HEAD");
  const home = getPostdiffHome();
  const slug = await getRepoSlug(ctx.cwd);
  const summary = await loadSummary(home, slug, c.sha);

  if (asJson) {
    console.log(JSON.stringify({ ...c, summary: summary?.summary ?? null }, null, 2));
    return;
  }

  uiIntro("context");
  const firstLine = (m: string | null) => (m === null || m === "" ? "(none)" : m.split("\n")[0]);
  p.log.info(`commit ${c.sha.slice(0, 8)} (${source})`);
  p.log.message(`message: ${firstLine(c.commitMessage)}`);
  p.log.message(`previous: ${c.previousSha === null ? "(none — root commit)" : `${c.previousSha.slice(0, 8)} — ${firstLine(c.previousCommitMessage)}`}`);
  p.log.message(
    summary ? `summary: built (${renderSummary(summary.summary).length} chars, ${summary.model})` : "summary: missing — run generate first",
  );
  const shown = c.filteredShapedDiff ?? c.shapedDiff;
  const which = c.filteredShapedDiff ? `filtered (from ${c.shapedDiff.length} shaped)` : "shaped (unfiltered — run generate first)";
  p.log.message(`diff: ${shown.length} chars ${which}${c.diffTruncated ? " (truncated)" : ""} | files: ${c.files.length} | content: ${c.totalContentChars} chars`);
  const rows = c.files.map((f) => {
    const detail = f.included ? `${f.chars} chars${f.truncated ? " (truncated)" : ""}` : `omitted: ${f.omittedReason}`;
    return `${f.status} ${f.path} (${detail})`;
  });
  p.note(rows.join("\n") || "(no files)", "files");
  uiOutro("context ready.");
}

export const command: PostdiffCommand = {
  name: "context",
  description: "show generation-ready context for a commit (no LLM)",
  args: [{ name: "sha", description: "commit to inspect (default HEAD)" }],
  options: [{ flags: "--json", description: "emit machine-readable JSON" }],
  run,
};
