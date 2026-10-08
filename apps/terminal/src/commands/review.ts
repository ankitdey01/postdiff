// `postdiff review` — display a stored draft and record accept/reject.
// Accept-only learning: accept-with-edit distills one global rule (LLM);
// reject templates a rule from --reason (no LLM), then removes the version.
// Clack UI: draft in a bordered note (never `---` markers), versions as log
// lines, one spinner around the accept-path LLM distill.

import * as p from "@clack/prompts";
import {
  loadConfig,
  SdkGenerator,
  getProviderSpec,
  platformDraftFile,
  readReviewState,
  initReview,
  recordVerdict,
  hashContent,
} from "@postdiff/core";
import { resolveDraftDir, readDraft, ensurePlatform, savePreferenceRule, isDevtoolsEnabled, loadDevtoolsTelemetry, devtoolsHint } from "../helpers.js";
import { resolveKeys } from "../keys.js";
import type { CommandContext, PostdiffCommand } from "../router.js";
import type { ReviewState } from "@postdiff/core";
import { uiIntro, uiOutro, isInteractive } from "../ui.js";

function showDraft(platform: Parameters<typeof platformDraftFile>[0], sha: string, draftBody: string, state: ReviewState): void {
  const latest = state.versions[state.versions.length - 1];
  p.note(draftBody.trimEnd() || "(empty)", `${platformDraftFile(platform)} @ ${sha.slice(0, 8)} [${latest?.status ?? "pending"}]`);
  for (const [i, v] of state.versions.entries()) {
    p.log.step(`v${i + 1} [${v.status}]${v.reason ? ` — ${v.reason}` : ""}`);
  }
  p.log.message(`versions: ${state.versions.length}, decided: ${latest?.decidedAt ?? "never"}`);
}

async function run(ctx: CommandContext): Promise<void> {
  uiIntro("review");
  const platform = await ensurePlatform(ctx.opts);
  if (platform === undefined) {
    p.cancel("cancelled — nothing recorded.");
    process.exitCode = 1;
    return;
  }
  if (platform === null) {
    if (process.exitCode !== 1) {
      p.log.error("Pick a platform: --blog, --x, or --linkedin (or run interactively).");
      process.exitCode = 1;
    }
    uiOutro("nothing recorded.");
    return;
  }
  let accept = ctx.opts["accept"] === true;
  let reject = ctx.opts["reject"] === true;
  if (accept && reject) {
    p.log.error("Pick one: --accept or --reject, not both.");
    process.exitCode = 1;
    uiOutro("nothing recorded.");
    return;
  }

  const { dir, sha } = await resolveDraftDir(ctx.cwd, ctx.positional[0]);
  const draftBody = await readDraft(dir, platformDraftFile(platform));
  if (draftBody === null) {
    p.log.error(`No ${platform} draft for ${sha.slice(0, 8)} — generate one first.`);
    process.exitCode = 1;
    uiOutro("nothing recorded.");
    return;
  }

  let state = await readReviewState(dir, platform);
  if (!state) state = await initReview(dir, platform, draftBody);

  if (!accept && !reject) {
    // Flags win when passed; otherwise ask on a TTY instead of bouncing the
    // user back to re-type the command.
    showDraft(platform, sha, draftBody, state);
    if (!isInteractive()) {
      uiOutro("re-run with --accept or --reject [--reason].");
      return;
    }
    const verdict = await p.select({
      message: "Verdict?",
      options: [
        { value: "view", label: "Just viewing", hint: "leave the draft as-is" },
        { value: "accept", label: "Accept", hint: "approve this version" },
        { value: "reject", label: "Reject", hint: "drop this version" },
      ],
    });
    if (p.isCancel(verdict) || verdict === "view") {
      if (p.isCancel(verdict)) {
        p.cancel("cancelled — nothing recorded.");
        process.exitCode = 1;
        return;
      }
      uiOutro("nothing recorded.");
      return;
    }
    accept = verdict === "accept";
    reject = verdict === "reject";
  }

  let reasonArg: unknown = ctx.opts["reason"];
  if (reasonArg === undefined && isInteractive() && (accept || reject)) {
    // Flags still win: only ask when --reason was absent and a verdict came
    // from the picker (or flags) on a TTY. Empty submit = no reason.
    const typed = await p.text({
      message: "Reason? (optional — accept: stored on version; reject: builds the rule)",
      placeholder: "leave empty for none",
    });
    if (p.isCancel(typed)) {
      p.cancel("cancelled — nothing recorded.");
      process.exitCode = 1;
      return;
    }
    reasonArg = typed.trim() || undefined;
  }
  const reason = typeof reasonArg === "string" ? reasonArg : undefined;
  if (reject) {
    // Distill the reason into a clean rule when a provider key is available;
    // otherwise the trimmed reason is stored verbatim — reject stays key-free.
    // Distillation never fails the verdict: any error falls back silently.
    let summarizer: SdkGenerator | undefined;
    let telemetry: Awaited<ReturnType<typeof loadDevtoolsTelemetry>> = [];
    if (reason) {
      const rConfig = await loadConfig();
      const rSpec = getProviderSpec(rConfig.models.provider);
      const rKey = rSpec ? resolveKeys().providerKeys[rSpec.envKey] ?? "" : "";
      if (rSpec && rKey) {
        telemetry = await loadDevtoolsTelemetry(isDevtoolsEnabled(ctx.opts));
        summarizer = new SdkGenerator(rConfig.models.provider, rKey, rConfig.models.genModel, { telemetry });
      }
    }
    const spin = summarizer ? p.spinner() : null;
    spin?.start("rejecting — distilling your reason into a taste rule…");
    const outcome = await recordVerdict({ dir, platform, fileContent: draftBody, accept: false, reason, summarizer });
    spin?.stop("verdict recorded.");
    if (outcome.kind === "accepted") return; // Unreachable: accept:false never yields accepted.
    if (outcome.kind === "rejected-kept") {
      p.log.warn(`rejected ${platformDraftFile(platform)} (accepted version kept — edit abandoned)`);
    } else {
      p.log.warn(`rejected ${platformDraftFile(platform)}${outcome.fileDeleted ? " (version removed, no versions left)" : " (version removed)"}`);
    }
    if (outcome.globalRule) await savePreferenceRule(platform, outcome.globalRule);
    uiOutro("verdict recorded.");
    return;
  }

  // Accept path: the LLM fires only when the on-disk text moved, so the key
  // is required only then.
  const latest = state.versions[state.versions.length - 1];
  const moved = latest ? hashContent(draftBody) !== latest.hash : true;
  const config = await loadConfig();
  const providerSpec = getProviderSpec(config.models.provider);
  const envKey = providerSpec?.envKey ?? "GEN_KEY";
  const genKey = resolveKeys().providerKeys[envKey] ?? "";
  if (moved && !providerSpec) {
    p.log.error(`Unknown generation provider "${config.models.provider}" in config — run \`postdiff setup\`.`);
    process.exitCode = 1;
    uiOutro("nothing recorded.");
    return;
  }
  if (moved && !genKey) {
    p.log.error(`Missing ${envKey} (provider: ${config.models.provider}). Run \`postdiff setup\` (or revert your edit first).`);
    process.exitCode = 1;
    uiOutro("nothing recorded.");
    return;
  }
  const devtools = isDevtoolsEnabled(ctx.opts);
  const telemetry = await loadDevtoolsTelemetry(devtools);
  const spin = moved ? p.spinner() : null;
  spin?.start("accepting — distilling your edit into a taste rule…");
  let outcome: Awaited<ReturnType<typeof recordVerdict>>;
  try {
    outcome = await recordVerdict({
      dir,
      platform,
      fileContent: draftBody,
      accept: true,
      reason,
      summarizer: new SdkGenerator(config.models.provider, genKey, config.models.genModel, { telemetry }),
    });
  } catch (err) {
    spin?.stop("failed.");
    p.log.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    uiOutro("nothing recorded.");
    return;
  }
  if (outcome.kind !== "accepted") {
    spin?.stop("verdict recorded.");
    uiOutro("nothing recorded.");
    return;
  }
  spin?.stop("verdict recorded.");
  if (devtools && outcome.snapshot) p.log.message(devtoolsHint());
  p.log.success(`accepted ${platformDraftFile(platform)}${outcome.snapshot ? " (text had changed — snapshotted + rule distilled)" : ""}`);
  if (outcome.state.versions[outcome.state.versions.length - 1]?.reason) {
    p.log.message(`reason: ${outcome.state.versions[outcome.state.versions.length - 1]?.reason}`);
  }
  if (outcome.globalRule) await savePreferenceRule(platform, outcome.globalRule);
  uiOutro("verdict recorded.");
}

export const command: PostdiffCommand = {
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
