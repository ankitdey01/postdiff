// Shared Clack UI surface for every command.
//
// Why this exists: Clack draws its own gutter (│ ◆ ◇ └). Any `console.*`
// write while a prompt/spinner gutter is live — or manual `---` markers
// instead of `note`/`box` — produces the broken vertical lines reported in
// the UI pass. So: every command pairs one `intro` with one `outro` and
// renders everything in between with `p.log.*`, `p.note`, `p.spinner`,
// `p.select`/`p.text`/`p.multiline`. `console.*` is reserved for two cases
// only: `--json` machine output and post-spinner streaming chunks.
//
// Engine stays UI-agnostic: this module is CLI-only, core/ never imports it.
import * as p from "@clack/prompts";

/** Open a command session: `┌  postdiff <cmd>`. Pair with exactly one `uiOutro`. */
export function uiIntro(cmd: string): void {
  p.intro(`postdiff ${cmd}`);
}

/** Close a command session. Called exactly once per run (success or failure). */
export function uiOutro(message: string): void {
  p.outro(message);
}

/** True when we may interactively prompt (missing flags → select/text). */
export function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

/** Render file/config content in a bordered box instead of `---` markers. */
export function showNote(body: string, title: string): void {
  p.note(body.trimEnd() || "(empty)", title);
}

/** Error + session close for fatal command failures (sets exitCode 1). */
export function fail(message: string): void {
  p.log.error(message);
  process.exitCode = 1;
}

export { p };
