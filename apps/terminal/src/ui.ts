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
import type { Readable, Writable } from "node:stream";
import { styleText } from "node:util";
import { MultiLinePrompt, settings, wrapTextWithPrefix } from "@clack/core";
import * as p from "@clack/prompts";
import { S_BAR, S_BAR_END, symbol } from "@clack/prompts";

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

/**
 * Paste-safe long-text prompt for voice/reference/plugin pastes and the
 * preferences rule.
 *
 * Why not bare `p.multiline` / `p.text`: the default multiline submits on a
 * double-Enter, so any blank line (`\n\n`) inside a paste submits early and
 * only the opening lines are kept; `p.text` submits on the first newline and
 * keeps only line 1. With `showSubmit: true` Enter always inserts a newline
 * and submit is Tab → Enter, so blank lines survive the paste.
 *
 * The frame is the stock `@clack/prompts` multiline frame (same gutter,
 * cursor, `[ submit ]` button) plus one dim hint line under the button, so
 * users who missed the message up top still see how to submit after pasting.
 * Stock `p.multiline` hardcodes its frame, hence the `@clack/core`
 * `MultiLinePrompt` with a copied render — keep it in sync with the
 * installed `@clack/prompts` multiline render when upgrading.
 *
 * `streams` is a headless-test seam only (lets a harness drive the prompt
 * with in-memory streams); callers never pass it.
 */
export function promptLongText(
  message: string,
  placeholder: string,
  streams?: { input?: Readable; output?: Writable },
): ReturnType<typeof p.multiline> {
  const title = `${message} — Tab then Enter to submit, empty skips`;
  const output = streams?.output;
  const prompt = new MultiLinePrompt({
    placeholder,
    showSubmit: true,
    input: streams?.input,
    output,
    render() {
      const withGuide = settings.withGuide;
      const head = `${withGuide ? `${styleText("gray", S_BAR)}\n` : ""}${symbol(this.state)}  ${title}\n`;
      const ghost =
        placeholder.length > 0
          ? styleText("inverse", placeholder.slice(0, 1)) + styleText("dim", placeholder.slice(1))
          : styleText(["inverse", "hidden"], "_");
      const content = this.userInput ? this.userInputWithCursor : ghost;
      const submitted = this.value ?? "";
      const submitRow = `\n  ${styleText(this.focused === "submit" ? "cyan" : "dim", "[ submit ]")}`;
      const hintRow = `\n  ${styleText("dim", "Tab then Enter to submit")}`;
      switch (this.state) {
        case "error": {
          const prefix = `${styleText("yellow", S_BAR)}  `;
          const body = withGuide ? wrapTextWithPrefix(output, content, prefix) : content;
          return `${head}${body}\n${styleText("yellow", S_BAR_END)}  ${styleText("yellow", this.error)}${submitRow}${hintRow}\n`;
        }
        case "submit": {
          const prefix = `${styleText("gray", S_BAR)}  `;
          const body = withGuide
            ? wrapTextWithPrefix(output, submitted, prefix, undefined, undefined, (line) => styleText("dim", line))
            : submitted
              ? styleText("dim", submitted)
              : "";
          return `${head}${body}`;
        }
        case "cancel": {
          const prefix = `${styleText("gray", S_BAR)}  `;
          const body = withGuide
            ? wrapTextWithPrefix(output, submitted, prefix, undefined, undefined, (line) =>
                styleText(["strikethrough", "dim"], line),
              )
            : submitted
              ? styleText(["strikethrough", "dim"], submitted)
              : "";
          return `${head}${body}`;
        }
        default: {
          const prefix = withGuide ? `${styleText("cyan", S_BAR)}  ` : "";
          const end = withGuide ? styleText("cyan", S_BAR_END) : "";
          const body = withGuide ? wrapTextWithPrefix(output, content, prefix) : content;
          return `${head}${body}\n${end}${submitRow}${hintRow}\n`;
        }
      }
    },
  });
  // `.prompt()` also resolves `undefined` on abort-signal — we never pass a
  // signal, so narrow to the stock `p.multiline` result like its wrapper does.
  return prompt.prompt() as ReturnType<typeof p.multiline>;
}

/** Error + session close for fatal command failures (sets exitCode 1). */
export function fail(message: string): void {
  p.log.error(message);
  process.exitCode = 1;
}

export { p };
