// `tract generate` — thin CLI wrapper; all logic lives in core/generation/index.ts.

import { generatePipeline } from "../../index.js";
import type { CommandContext, TractCommand } from "../router.js";
import { requestedPlatform, isDevtoolsEnabled, loadDevtoolsTelemetry, devtoolsHint } from "../helpers.js";

async function run(ctx: CommandContext): Promise<void> {
  const earlyPlatform = requestedPlatform(ctx.opts);
  if (earlyPlatform === null && process.exitCode === 1) return;

  const devtools = isDevtoolsEnabled(ctx.opts);
  const telemetry = await loadDevtoolsTelemetry(devtools);

  const result = await generatePipeline(
    {
      cwd: ctx.cwd,
      shaOrHead: ctx.positional[0] ?? "HEAD",
      platform: earlyPlatform,
      force: ctx.opts["force"] === true,
      jevKey: process.env["TYPESAFE_API_KEY"] ?? "",
      groqKey: process.env["GROQ_KEY"] ?? "",
      telemetry,
    },
    (chunk) => process.stdout.write(chunk),
    (event) => {
      if (event.kind === "gen-model-warning") {
        console.warn(event.message);
      } else {
        console.log(event.message);
      }
    },
  );

  // Map structured result → exit code + display
  switch (result.status) {
    case "empty-diff":
      console.log(`Commit ${result.sha} has no diff — nothing to judge.`);
      return;
    case "missing-jev-key":
      console.error("Missing TYPESAFE_API_KEY. Set it or re-run with --force.");
      process.exitCode = 1;
      return;
    case "not-significant":
      process.exitCode = 2;
      return;
    case "no-platform":
      console.log("No platform requested — add --blog, --x, or --linkedin to draft.");
      return;
    case "missing-groq-key":
      console.error("Missing GROQ_KEY. Add it to .env to draft.");
      process.exitCode = 1;
      return;
    case "filter-empty":
      console.log(`no file scored >= 0.1 — nothing worth including, skipping ${result.sha.slice(0, 8)}.`);
      process.exitCode = 2;
      return;
    case "empty-draft":
      console.error(
        `No draft written — model returned no text (finishReason=${result.draft.finishReason}, raw=${result.draft.rawFinishReason ?? "null"}, steps=${result.draft.steps}, tokens=${result.draft.inputTokens ?? "?"}/${result.draft.outputTokens ?? "?"}). See gen-${result.draft.platform}.json.`,
      );
      process.exitCode = 1;
      return;
    case "ok":
      process.stdout.write("\n");
      console.log(`draft (${result.draft.model}, ${(result.draft.ms / 1000).toFixed(1)}s): ${result.draftPath}`);
      if (devtools) console.log(devtoolsHint());
      return;
  }
}

export const command: TractCommand = {
  name: "generate",
  description: "Jev gate, then draft one platform (default HEAD)",
  args: [{ name: "sha", description: "commit to use (default HEAD)" }],
  options: [
    { flags: "--force", description: "skip the Jev gate" },
    { flags: "--blog", description: "draft the blog post" },
    { flags: "--x", description: "draft the X post" },
    { flags: "--linkedin", description: "draft the LinkedIn post" },
    { flags: "--devtools", description: "capture this run for AI SDK DevTools (local .devtools/, never committed)" },
  ],
  run,
};
