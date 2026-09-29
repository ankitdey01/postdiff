// `tract review` — display a stored draft and record accept/reject.
// Accept-only learning: accept-with-edit distills one global rule (LLM);
// reject templates a rule from --reason (no LLM), then removes the version.

import {
  loadConfig,
  GroqGenerator,
  platformDraftFile,
  readReviewState,
  initReview,
  recordVerdict,
  hashContent,
} from "../../index.js";
import { resolveDraftDir, readDraft, requestedPlatform, savePreferenceRule, isDevtoolsEnabled, loadDevtoolsTelemetry, devtoolsHint } from "../helpers.js";
import type { CommandContext, TractCommand } from "../router.js";
import type { ReviewState } from "../../index.js";

function showDraft(platform: Parameters<typeof platformDraftFile>[0], sha: string, draftBody: string, state: ReviewState): void {
  const latest = state.versions[state.versions.length - 1];
  console.log(`--- ${platformDraftFile(platform)} @ ${sha.slice(0, 8)} [${latest?.status ?? "pending"}] ---`);
  console.log(draftBody.trimEnd() || "(empty)");
  console.log(`--- versions: ${state.versions.length}, decided: ${latest?.decidedAt ?? "never"} ---`);
  for (const [i, v] of state.versions.entries()) {
    console.log(`v${i + 1} [${v.status}]${v.reason ? ` reason: ${v.reason}` : ""}`);
  }
}

async function run(ctx: CommandContext): Promise<void> {
  const platform = requestedPlatform(ctx.opts);
  if (platform === null) {
    if (process.exitCode !== 1) console.error("Pick a platform: --blog, --x, or --linkedin.");
    process.exitCode = 1;
    return;
  }
  const accept = ctx.opts["accept"] === true;
  const reject = ctx.opts["reject"] === true;
  if (accept && reject) {
    console.error("Pick one: --accept or --reject, not both.");
    process.exitCode = 1;
    return;
  }

  const { dir, sha } = await resolveDraftDir(ctx.cwd, ctx.positional[0]);
  const draftBody = await readDraft(dir, platformDraftFile(platform));
  if (draftBody === null) {
    console.error(`No ${platform} draft for ${sha.slice(0, 8)} — generate one first.`);
    process.exitCode = 1;
    return;
  }

  let state = await readReviewState(dir, platform);
  if (!state) state = await initReview(dir, platform, draftBody);

  if (!accept && !reject) {
    showDraft(platform, sha, draftBody, state);
    return;
  }

  const reasonArg = ctx.opts["reason"];
  const reason = typeof reasonArg === "string" ? reasonArg : undefined;
  if (reject) {
    // No LLM here: reason templates a rule, then the version is dropped.
    const outcome = await recordVerdict({ dir, platform, fileContent: draftBody, accept: false, reason });
    if (outcome.kind === "accepted") return; // Unreachable: accept:false never yields accepted.
    if (outcome.kind === "rejected-kept") {
      console.log(`rejected ${platformDraftFile(platform)} (accepted version kept — edit abandoned)`);
    } else {
      console.log(`rejected ${platformDraftFile(platform)}${outcome.fileDeleted ? " (version removed, no versions left)" : " (version removed)"}`);
    }
    if (outcome.globalRule) await savePreferenceRule(platform, outcome.globalRule);
    return;
  }

  // Accept path: the LLM fires only when the on-disk text moved, so the key
  // is required only then.
  const latest = state.versions[state.versions.length - 1];
  const moved = latest ? hashContent(draftBody) !== latest.hash : true;
  const groqKey = process.env["GROQ_KEY"] ?? "";
  if (moved && !groqKey) {
    console.error("Missing GROQ_KEY. Add it to .env so the accept rule can be distilled (or revert your edit first).");
    process.exitCode = 1;
    return;
  }
  const config = await loadConfig();
  const devtools = isDevtoolsEnabled(ctx.opts);
  const telemetry = await loadDevtoolsTelemetry(devtools);
  const outcome = await recordVerdict({
    dir,
    platform,
    fileContent: draftBody,
    accept: true,
    reason,
    summarizer: new GroqGenerator(groqKey, config.genModel, { telemetry }),
  });
  if (outcome.kind !== "accepted") return;
  if (devtools && outcome.snapshot) console.log(devtoolsHint());
  console.log(`accepted ${platformDraftFile(platform)}${outcome.snapshot ? " (text had changed — snapshotted + rule distilled)" : ""}`);
  if (outcome.state.versions[outcome.state.versions.length - 1]?.reason) {
    console.log(`reason: ${outcome.state.versions[outcome.state.versions.length - 1]?.reason}`);
  }
  if (outcome.globalRule) await savePreferenceRule(platform, outcome.globalRule);
}

export const command: TractCommand = {
  name: "review",
  description: "show a draft and record accept/reject",
  args: [{ name: "sha", description: "commit to review (default HEAD)" }],
  options: [
    { flags: "--blog", description: "review the blog draft" },
    { flags: "--x", description: "review the X draft" },
    { flags: "--linkedin", description: "review the LinkedIn draft" },
    { flags: "--accept", description: "accept the current text" },
    { flags: "--reject", description: "reject the current text" },
    { flags: "--reason <text>", description: "why (accept: stored on version; reject: builds the rule)" },
    { flags: "--devtools", description: "capture the accept-rule call for AI SDK DevTools (local .devtools/)" },
  ],
  run,
};
