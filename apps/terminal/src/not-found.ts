// not-found: a 404 page for unknown commands. Block digits with a double-line
// shadow, a small ghost drifting to and fro beneath them, and a line of copy.
// Adapted from the provided snippet: "page" swapped for "command" throughout.

export type Frame = (t: number) => string;

export interface NotFoundOptions {
  [key: string]: unknown;
  code: string;
  title: string;
  message: string;
}

export const NOT_FOUND_COLS = 60;
export const NOT_FOUND_ROWS = 21;
const FPS = 15;
const ANIMATION_SECONDS = 2;

// A 3x5 font, each font column drawn 4 cells wide and the rows 2,1,2,1,2
// cells tall, so a digit is 12x8 and strokes are as thick across as down.
const FONT: Record<string, string> = {
  "0": "###,#.#,#.#,#.#,###",
  "1": "##.,.#.,.#.,.#.,###",
  "2": "###,..#,###,#..,###",
  "3": "###,..#,###,..#,###",
  "4": "#.#,#.#,###,..#,..#",
  "5": "###,#..,###,..#,###",
  "6": "###,#..,###,#.#,###",
  "7": "###,..#,..#,..#,..#",
  "8": "###,#.#,###,#.#,###",
  "9": "###,#.#,###,..#,###",
};
const RH = [2, 1, 2, 1, 2];
const DW = 12;
const DH = 8;
const GAP = 4;
const TOP = 1; // first row of the digits

// The ghost in square pixels, two to a cell, top half and bottom half.
const BODY = [
  "..####..",
  ".######.",
  "########",
  "########",
  "########",
  "########",
  "########",
  "########",
  "########",
];
const HEMS = [".##..##.", "#..##..#"];
const GW = 8;
const EYES = [1, 5]; // left column of each eye hole, two wide and four tall
const PERIOD = 9; // seconds for one trip there and back

const DEFAULTS = {
  code: "404",
  title: "command not found",
  message: "the command you asked for has moved or never existed",
} satisfies NotFoundOptions;

export function createNotFoundFrame({
  code = DEFAULTS.code,
  title = DEFAULTS.title,
  message = DEFAULTS.message,
}: Partial<NotFoundOptions> = {}): Frame {
  const cols = NOT_FOUND_COLS;
  const rows = NOT_FOUND_ROWS;
  const base: string[] = new Array(cols * rows).fill(" ");
  const face = new Uint8Array(cols * rows);

  let digits = String(code ?? "").replace(/[^0-9]/g, "").slice(0, 3).split("");
  if (!digits.length) digits = ["4", "0", "4"];
  const width = digits.length * DW + (digits.length - 1) * GAP + 1;
  const x0 = Math.floor((cols - width) / 2);
  digits.forEach((d, i) => {
    const rowsOf = FONT[d].split(",");
    let r = TOP;
    rowsOf.forEach((bits, fr) => {
      for (let k = 0; k < RH[fr]; k++, r++)
        for (let fc = 0; fc < 3; fc++)
          if (bits[fc] === "#")
            for (let c = 0; c < 4; c++) face[r * cols + x0 + i * (DW + GAP) + fc * 4 + c] = 1;
    });
  });

  // The shadow is the face moved one cell down and right, traced in double lines.
  const at = (r: number, c: number): boolean =>
    r >= 0 && c >= 0 && r < rows && c < cols && face[r * cols + c] === 1;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (at(r, c)) {
        base[r * cols + c] = "█";
        continue;
      }
      const L = at(r, c - 1);
      const U = at(r - 1, c);
      const UL = at(r - 1, c - 1);
      base[r * cols + c] = L && U ? "╔" : L ? (UL ? "║" : "╗") : U ? (UL ? "═" : "╚") : UL ? "╝" : " ";
    }

  const put = (r: number, s: string) => {
    s = String(s).slice(0, cols);
    const c0 = Math.floor((cols - s.length) / 2);
    for (let i = 0; i < s.length; i++) base[r * cols + c0 + i] = s[i];
  };
  put(TOP + DH + 9, title);
  put(TOP + DH + 10, message);

  // The ghost's resting top in half rows. It bobs a half row either way and
  // always leaves a clear row under the digits' shadow.
  const BAND = (TOP + DH + 2) * 2 + 1;
  const px = new Uint8Array(cols * rows * 2);
  const out: string[] = new Array(cols * rows);

  return (t) => {
    const ph = (t / PERIOD) * Math.PI * 2;
    const gx = Math.round(cols / 2 - GW / 2 + 18 * Math.sin(ph));
    const gy = BAND + Math.round(Math.sin((t / 1.5) * Math.PI * 2));
    const look = Math.cos(ph) >= 0 ? 1 : 0; // 1 heading right

    px.fill(0);
    const shape = BODY.concat(HEMS[Math.floor(t * 4) % 2]);
    shape.forEach((line, y) => {
      for (let x = 0; x < GW; x++) if (line[x] === "#") px[(gy + y) * cols + gx + x] = 1;
    });
    // Eye holes sit on whole cells, so each shows a clear white cell above a
    // pupil: one half block in the bottom corner it is heading toward.
    const ey = ((gy + 3) >> 1) << 1;
    for (const ex of EYES) {
      const e = gx + ex;
      for (let y = 0; y < 4; y++) px[(ey + y) * cols + e] = px[(ey + y) * cols + e + 1] = 0;
      px[(ey + 3) * cols + e + look] = 1;
    }

    for (let k = 0; k < cols * rows; k++) {
      const r = (k / cols) | 0;
      const c = k % cols;
      const a = px[2 * r * cols + c];
      const b = px[(2 * r + 1) * cols + c];
      out[k] = a && b ? "█" : a ? "▀" : b ? "▄" : base[k];
    }
    const lines: string[] = [];
    for (let r = 0; r < rows; r++) lines.push(out.slice(r * cols, (r + 1) * cols).join(""));
    return lines.join("\n");
  };
}

/** Closest known command by edit distance (<=2), for a "did you mean" hint. */
function suggestCommand(unknown: string, known: string[]): string | null {
  const dist = (a: string, b: string): number => {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) dp[0]![j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        dp[i]![j] = Math.min(
          dp[i - 1]![j]! + 1,
          dp[i]![j - 1]! + 1,
          dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
    return dp[a.length]![b.length]!;
  };
  let best: string | null = null;
  let bestD = 3;
  for (const k of known) {
    const d = dist(unknown, k);
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  }
  return best;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Cursor animation is only safe when both ends of the terminal are live.
 * Keeping the stdin check also prevents animation in output-only captures.
 */
function supportsNotFoundAnimation(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY && process.env["TERM"] !== "dumb");
}

/**
 * Render the 404 for an unknown command. "page" copy is swapped for
 * "command": title `command not found`, message names the bad command.
 * On terminals with cursor control support the ghost drifts in place for
 * roughly two seconds; all other output gets one static frame so ANSI
 * control sequences cannot turn animation frames into duplicate output.
 * Raw stdout only.
 */
export async function showNotFound(unknown: string, knownCommands: string[]): Promise<void> {
  const clean = unknown.slice(0, 30);
  const frame = createNotFoundFrame({
    code: "404",
    title: "command not found",
    message: `postdiff ${clean} — no such command`.slice(0, NOT_FOUND_COLS),
  });
  const hint = suggestCommand(clean, knownCommands);
  const footer =
    (hint ? `did you mean \`postdiff ${hint}\`?\n` : "") +
    `available: ${knownCommands.join(", ")}\nrun \`postdiff --help\` for usage.`;

  const width = process.stdout.columns ?? NOT_FOUND_COLS;
  const at = (t: number): string =>
    frame(t)
      .split("\n")
      .map((line) => line.slice(0, width))
      .join("\n");
  const resting = at(0);
  if (!supportsNotFoundAnimation()) {
    process.stdout.write(resting + "\n" + footer + "\n");
    return;
  }

  const rows = resting.split("\n").length;
  const frames = Math.round(ANIMATION_SECONDS * FPS);
  let previous = resting.split("\n");
  const drawChangedLines = (nextFrame: string): void => {
    const next = nextFrame.split("\n");
    let update = "\x1b[s";
    for (let row = 0; row < rows; row++) {
      if (next[row] === previous[row]) continue;
      // The cursor is at the line immediately below the frame. Only redraw
      // changed ghost rows, so the large 404 itself is written once.
      update += `\x1b[${rows - row}A\x1b[2K\r${next[row]}\x1b[u`;
    }
    if (update !== "\x1b[s") process.stdout.write(update);
    previous = next;
  };

  process.stdout.write("\x1b[?25l");
  try {
    process.stdout.write(resting + "\n");
    for (let i = 0; i < frames; i++) {
      await sleep(1000 / FPS);
      drawChangedLines(at(i / FPS));
    }
    drawChangedLines(resting);
  } finally {
    process.stdout.write("\x1b[?25h");
  }
  process.stdout.write(footer + "\n");
}
