/**
 * Paste regression test for promptLongText() (apps/terminal/src/ui.ts).
 *
 * Prerequisite: `npm run build` (imports the compiled helper from
 * apps/terminal/dist/ui.js, which is gitignored build output).
 *
 * Method: drives the REAL shipped prompt with in-memory streams. Pastes are
 * written as BULK bytes (like a real terminal paste: LF, CRLF as sent by
 * Windows/PowerShell pastes, and lone-CR), then Tab + Enter submits
 * (showSubmit mode). Run: `node scripts/verify-paste-fix.mjs`.
 *
 * What it proves:
 *  - the old default `p.multiline` truncates a lone-CR paste at the first
 *    blank line (the reported "keeps only the opening lines" glitch), so the
 *    harness is sensitive to the bug;
 *  - the new helper keeps every pasted line, in order, for all three paste
 *    byte flavors (no truncation), preserves LF/lone-CR pastes exactly, and
 *    still treats empty submit as "" (callers skip on "").
 */
import { PassThrough } from "node:stream";
import { emitKeypressEvents } from "node:readline";
import * as p from "@clack/prompts";
import { promptLongText } from "../apps/terminal/dist/ui.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function streams() {
  const input = new PassThrough();
  const output = new PassThrough();
  let captured = "";
  output.on("data", (chunk) => {
    captured += chunk.toString("utf8");
  });
  emitKeypressEvents(input); // make the fake stdin emit keypress like a TTY
  return { input, output, rendered: () => captured.replace(/\x1b\[[0-9;]*m/g, "") };
}

async function pasteAndSubmit(promptFn, pasteBytes, submitKeys) {
  const { input, output, rendered } = streams();
  const pending = promptFn(input, output);
  await sleep(50);
  input.write(pasteBytes); // bulk paste, one write like a terminal paste
  await sleep(300);
  for (const k of submitKeys) {
    input.write(k);
    await sleep(150);
  }
  const result = await pending;
  input.destroy();
  output.destroy();
  return { result, rendered: rendered() };
}

const oldMultiline = (input, output) =>
  p.multiline({ message: "old", placeholder: "ph", input, output });
const newHelper = (input, output) =>
  promptLongText("Paste the sample", "Your voice sample markdown…", { input, output });

const VOICE_LF =
  "# Voice\n\nI write short sentences.\n\nSecond paragraph here.\nThird line.\n";
const toCRLF = (s) => s.replace(/\n/g, "\r\n");
const toCR = (s) => s.replace(/\n/g, "\r");

let failures = 0;
function check(name, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}`);
  if (!ok) {
    failures++;
    console.log("  expected:", JSON.stringify(expected));
    console.log("  actual:  ", JSON.stringify(actual));
  }
}
/** Every non-empty source line must survive, in order (i.e. no truncation). */
function checkKeepsAllLines(name, actual, source) {
  const lines = source.split(/\r\n|\r|\n/).filter((l) => l.length > 0);
  let pos = -1;
  const missing = [];
  for (const line of lines) {
    const at = actual.indexOf(line, pos + 1);
    if (at <= pos) missing.push(line);
    else pos = at;
  }
  const ok = typeof actual === "string" && missing.length === 0;
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}`);
  if (!ok) {
    failures++;
    console.log("  missing lines:", JSON.stringify(missing));
    console.log("  actual:", JSON.stringify(actual));
  }
}

// 1. OLD behavior must show the glitch (lone-CR paste truncates at blank line).
const oldCR = await pasteAndSubmit(oldMultiline, toCR(VOICE_LF), ["\r", "\r"]);
console.log("old/default + lone-CR paste captured:", JSON.stringify(oldCR.result));
check("old multiline truncates lone-CR paste (glitch present)", oldCR.result, "# Voice");

// 2. OLD behavior with CRLF (windows paste): observe what happens.
const oldCRLF = await pasteAndSubmit(oldMultiline, toCRLF(VOICE_LF), ["\r", "\r"]);
console.log("old/default + CRLF paste captured:", JSON.stringify(oldCRLF.result));

// 3. NEW helper: LF paste preserved exactly.
const newLF = await pasteAndSubmit(newHelper, VOICE_LF, ["\t", "\r"]);
check("new helper preserves LF paste exactly", newLF.result, VOICE_LF);

// 3b. NEW helper: footer hint renders below the `[ submit ]` button.
{
  const buttonAt = newLF.rendered.indexOf("[ submit ]");
  const hintAt = newLF.rendered.lastIndexOf("Tab then Enter to submit");
  const ok = buttonAt !== -1 && hintAt > buttonAt;
  console.log(`${ok ? "PASS" : "FAIL"} — footer hint renders below the submit button`);
  if (!ok) {
    failures++;
    console.log("  rendered tail:", JSON.stringify(newLF.rendered.slice(-200)));
  }
}

// 4. NEW helper: CRLF (windows) paste keeps every line — no truncation.
// NOTE: clack inserts one \n per \r and one per \n, so a CRLF paste stores
// doubled line breaks (pre-existing clack artifact, also present before this
// fix — old code did the same). What matters here: nothing is declined.
const newCRLF = await pasteAndSubmit(newHelper, toCRLF(VOICE_LF), ["\t", "\r"]);
checkKeepsAllLines("new helper keeps all lines of CRLF paste", newCRLF.result, VOICE_LF);

// 5. NEW helper: lone-CR paste preserved exactly.
const newCR = await pasteAndSubmit(newHelper, toCR(VOICE_LF), ["\t", "\r"]);
check("new helper preserves lone-CR paste exactly", newCR.result, VOICE_LF);

// 6. NEW helper: empty submit (Tab+Enter, no paste) -> "" so callers skip.
const newEmpty = await pasteAndSubmit(newHelper, "", ["\t", "\r"]);
check("new helper empty submit returns empty string", newEmpty.result, "");

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
