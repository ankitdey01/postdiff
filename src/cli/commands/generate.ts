// `postdiff generate` — thin CLI wrapper; all logic lives in core/generation/index.ts.
// Clack UI: one intro/outro per run, one spinner for the pre-stream phases
// (context → Jev gate → filter). The spinner stops before the token stream
// starts — writing chunks while a gutter is live is what broke the vertical
// lines — and the finished draft renders in a bordered note.

import * as p from "@clack/prompts";
import { generatePipeline } from "../../index.js";
import type { CommandContext, PostdiffCommand } from "../router.js";
import { ensurePlatform, isDevtoolsEnabled, loadDevtoolsTelemetry, devtoolsHint } from "../helpers.js";
import { resolveKeys } from "../keys.js";
import { uiIntro, uiOutro } from "../ui.js";

async function run(ctx: CommandContext): Promise<void> {
  uiIntro("generate");
  const picked = await ensurePlatform(ctx.opts);
  if (picked === undefined) {
    p.cancel("cancelled — nothing drafted.");
    process.exitCode = 1;
    return;
  }
  // Conflicting flags (error already logged): stop here. A benign missing
  // platform falls through as null so the pipeline still runs the
  // significance gate — the `no-platform` result reports it.
  if (picked === null && process.exitCode === 1) {
    uiOutro("nothing drafted.");
    return;
  }
  const earlyPlatform = picked;

  const devtools = isDevtoolsEnabled(ctx.opts);
  const telemetry = await loadDevtoolsTelemetry(devtools);

  const keys = resolveKeys();
  const spin = p.spinner();
  spin.start("loading context…");
  let spinLive = true;
  const stopSpin = (msg: string) => {
    if (spinLive) {
      spin.stop(msg);
      spinLive = false;
    }
  };
  const failSpin = (msg: string) => {
    if (spinLive) {
      spin.error(msg);
      spinLive = false;
    }
  };
  const warnings: string[] = [];

  let result: Awaited<ReturnType<typeof generatePipeline>>;
  try {
    result = await generatePipeline(
      {
        cwd: ctx.cwd,
        shaOrHead: ctx.positional[0] ?? "HEAD",
        platform: earlyPlatform,
        force: ctx.opts["force"] === true,
        web: ctx.opts["web"] === true,
        fresh: ctx.opts["fresh"] === true,
        jevKey: keys.typesafeKey,
        providerKeys: keys.providerKeys,
        telemetry,
      },
      (chunk) => process.stdout.write(chunk),
      (event) => {
        if (event.kind === "gen-model-warning") {
          warnings.push(event.message);
          return;
        }
        if (event.kind === "drafting") {
          // Stream owns stdout from here — park the spinner first.
          stopSpin("context ready — drafting…");
          for (const w of warnings.splice(0)) p.log.warn(w);
          p.log.step(`${event.message} (${earlyPlatform})`);
          return;
        }
        if (event.kind === "review-superseded") {
          warnings.push(event.message);
          return;
        }
        if (spinLive) spin.message(event.message);
        else p.log.step(event.message);
      },
    );
  } catch (err) {
    failSpin("failed.");
    p.log.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    uiOutro("nothing drafted.");
    return;
  }

  // Map structured result → exit code + display
  switch (result.status) {
    case "empty-diff":
      failSpin("no diff to judge.");
      p.log.warn(`Commit ${result.sha} has no diff — nothing to judge.`);
      uiOutro("nothing drafted.");
      return;
    case "missing-jev-key":
      failSpin("setup incomplete.");
      p.log.error("Missing TYPESAFE_API_KEY. Run `postdiff setup` or re-run with --force.");
      process.exitCode = 1;
      uiOutro("nothing drafted.");
      return;
    case "not-significant":
      failSpin("not significant.");
      p.log.warn(`Commit ${result.sha.slice(0, 8)} judged not significant — nothing drafted (meta: ${result.metaDir}).`);
      process.exitCode = 2;
      uiOutro("nothing drafted.");
      return;
    case "no-platform":
      stopSpin("significance passed.");
      p.log.message("No platform requested — add --blog, --x, or --linkedin to draft.");
      uiOutro("nothing drafted.");
      return;
    case "missing-gen-key":
      failSpin("setup incomplete.");
      p.log.error(`Missing ${result.envKey} (provider: ${result.provider}). Run \`postdiff setup\` to save it.`);
      process.exitCode = 1;
      uiOutro("nothing drafted.");
      return;
    case "unknown-provider":
      failSpin("setup incomplete.");
      p.log.error(`Unknown generation provider "${result.provider}" in config — run \`postdiff setup\`.`);
      process.exitCode = 1;
      uiOutro("nothing drafted.");
      return;
    case "filter-empty":
      failSpin("filter empty.");
      p.log.warn(`no file scored >= 0.1 — nothing worth including, skipping ${result.sha.slice(0, 8)}.`);
      process.exitCode = 2;
      uiOutro("nothing drafted.");
      return;
    case "summary-failed":
      failSpin("summary failed.");
      p.log.error(`${result.reason} — retry, or re-run with --fresh to rebuild the brief.`);
      process.exitCode = 1;
      uiOutro("nothing drafted.");
      return;
    case "empty-draft":
      failSpin("draft came back empty.");
      p.log.error(
        `No draft written — model returned no text (finishReason=${result.draft.finishReason}, raw=${result.draft.rawFinishReason ?? "null"}, steps=${result.draft.steps}, tokens=${result.draft.inputTokens ?? "?"}/${result.draft.outputTokens ?? "?"}). See gen-${result.draft.platform}.json.`,
      );
      process.exitCode = 1;
      uiOutro("nothing drafted.");
      return;
    case "ok":
      stopSpin(`draft ready (${result.draft.model}, ${(result.draft.ms / 1000).toFixed(1)}s).`);
      process.stdout.write("\n");
      p.note(result.draft.body.trimEnd() || "(empty)", `draft · ${result.draftPath}`);
      for (const w of warnings.splice(0)) p.log.warn(w);
      if (result.prevReviewSuperseded) p.log.warn("previous review superseded — new draft needs review.");
      p.log.success(`draft saved → ${result.draftPath}`);
      if (devtools) p.log.message(devtoolsHint());
      uiOutro("run `postdiff review` to accept it.");
      return;
  }
}

export const command: PostdiffCommand = {
  name: "generate",
  description: "Jev gate, then draft one platform (default HEAD)",
  args: [{ name: "sha", description: "commit to use (default HEAD)" }],
  options: [
    { flags: "--force", description: "skip the Jev gate" },
    { flags: "--fresh", description: "rebuild the cached change brief before drafting" },
    { flags: "--web", description: "allow server-side web search while drafting (off by default; warns + falls back when unsupported)" },
    { flags: "--blog", description: "draft the blog post" },
    { flags: "--x", description: "draft the X post" },
    { flags: "--linkedin", description: "draft the LinkedIn post" },
    { flags: "--devtools", description: "capture this run for AI SDK DevTools (local .devtools/, never committed)" },
  ],
  run,
};
