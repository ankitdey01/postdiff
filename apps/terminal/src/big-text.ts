// big-text: a banner in a hand-made five-row block font with a drop shadow
// drawn in double lines, and a glint that sweeps across now and then.
// Ported from the provided snippet (minus the `../types.ts` import).
// Setup shows it with the text "postdiff".

export type BigTextFrame = (t: number) => string;

export interface BigTextOptions {
  [key: string]: unknown;
  text: string;
}

const BIG_TEXT_COLS = 66;
const BIG_TEXT_ROWS = 8;

// Five rows each, # is ink. Widths vary, so I is one pixel and M is five.
const FONT: Record<string, string> = {
  A: ".##.|#..#|####|#..#|#..#", B: "###.|#..#|###.|#..#|###.", C: ".###|#...|#...|#...|.###",
  D: "###.|#..#|#..#|#..#|###.", E: "####|#...|###.|#...|####", F: "####|#...|###.|#...|#...",
  G: ".###|#...|#.##|#..#|.###", H: "#..#|#..#|####|#..#|#..#", I: "#|#|#|#|#",
  J: "...#|...#|...#|#..#|.##.", K: "#..#|#.#.|##..|#.#.|#..#", L: "#...|#...|#...|#...|####",
  M: "#...#|##.##|#.#.#|#...#|#...#", N: "#...#|##..#|#.#.#|#..##|#...#", O: ".##.|#..#|#..#|#..#|.##.",
  P: "###.|#..#|###.|#...|#...", Q: ".##.|#..#|#..#|#.#.|.#.#", R: "###.|#..#|###.|#.#.|#..#",
  S: ".###|#...|.##.|...#|###.", T: "#####|..#..|..#..|..#..|..#..", U: "#..#|#..#|#..#|#..#|.##.",
  V: "#...#|#...#|#...#|.#.#.|..#..", W: "#...#|#...#|#.#.#|##.##|#...#", X: "#...#|.#.#.|..#..|.#.#.|#...#",
  Y: "#...#|.#.#.|..#..|..#..|..#..", Z: "####|...#|..#.|.#..|####",
  0: "###|#.#|#.#|#.#|###", 1: ".#.|##.|.#.|.#.|###", 2: "###|..#|###|#..|###", 3: "###|..#|.##|..#|###",
  4: "#.#|#.#|###|..#|..#", 5: "###|#..|###|..#|###", 6: "###|#..|###|#.#|###", 7: "###|..#|..#|..#|..#",
  8: "###|#.#|###|#.#|###", 9: "###|#.#|###|..#|###",
  ".": ".|.|.|.|#", ",": ".|.|.|#|#", "!": "#|#|#|.|#", "?": "###|..#|.##|...|.#.", "'": "#|#|.|.|.",
  ":": ".|#|.|#|.", "-": "...|...|###|...|...", "+": "...|.#.|###|.#.|...", "=": "...|###|...|###|...",
  "/": "..#|..#|.#.|#..|#..", _: "...|...|...|...|###", " ": "..",
};

// Shadow cells by which neighbours they join: up 1, down 2, left 4, right 8.
const JOIN = " ║║║═╝╗╣═╚╔╠═╩╦╬";
const U = 1, D = 2, L = 4, R = 8;

export function createBigTextFrame({ text = "postdiff" }: Partial<BigTextOptions> = {}): BigTextFrame {
  const cols = BIG_TEXT_COLS;
  const rows = BIG_TEXT_ROWS;
  const glyphs = [...String(text).toUpperCase()].map((ch) => FONT[ch]).filter(Boolean).map((g) => g.split("|"));
  // Each pixel is two columns by one row, so it is square; one column narrower if it would not fit.
  const span = (s: number) => glyphs.reduce((w, g) => w + g[0].length * s + 2, -1);
  const s = span(2) <= cols - 2 ? 2 : 1;
  const x0 = Math.max(0, Math.floor((cols - span(s)) / 2));
  const y0 = Math.floor((rows - 6) / 2);

  const ink = new Uint8Array(cols * rows);
  let x = x0;
  for (const g of glyphs) {
    g.forEach((line, y) => {
      for (let i = 0; i < line.length; i++)
        if (line[i] === "#") for (let k = 0; k < s; k++) if (x + i * s + k < cols) ink[(y0 + y) * cols + x + i * s + k] = 1;
    });
    x += g[0].length * s + 2;
  }
  const at = (c: number, r: number) => (c >= 0 && c < cols && r >= 0 && r < rows ? ink[r * cols + c] : 0);

  // The shadow is the letters' outline moved half a cell right and down, so
  // each empty cell draws the outline edges that meet at its top left corner.
  const grid: (string | null)[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (at(c, r)) {
        grid.push(null);
        continue;
      }
      const a = at(c - 1, r - 1), b = at(c, r - 1), d = at(c - 1, r);
      const edges = (a !== b ? U : 0) | (d ? D : 0) | (a !== d ? L : 0) | (b ? R : 0);
      // Where two letters touch only at that corner, the shadow turns down and right.
      grid.push(JOIN[edges === 15 ? D | R : edges]);
    }
  }

  const SWEEP = 2.4, PERIOD = 3.2;
  const left = x0 - 2, right = x0 + span(s) + 9;
  return (t) => {
    // The glint crosses at an even pace, then rests out of sight. Frame 0 is at rest.
    const u = (((t - 0.5) % PERIOD) + PERIOD) % PERIOD / SWEEP;
    const pos = u < 1 ? left + (right - left) * u : -99;
    const lines: string[] = [];
    for (let r = 0; r < rows; r++) {
      let line = "";
      for (let c = 0; c < cols; c++) {
        const g = grid[r * cols + c];
        if (g !== null) {
          line += g;
          continue;
        }
        const d = Math.abs(c + 1.2 * r - pos);
        // Ink is a dense shade on a dark page so the glint can be brighter.
        line += d < 2.4 ? "█" : "▓";
      }
      lines.push(line);
    }
    return lines.join("\n");
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Display the "postdiff" banner. On a capable TTY the glint sweeps across
 * once (~3s at 12fps), rewriting the same 8-line block in place via
 * cursor-up + erase (no full-screen clear, so nothing scrolls or flashes),
 * and the resting frame is left on screen; otherwise one static frame is
 * printed. Raw stdout only — call before `p.intro()` so the Clack gutter
 * never overlaps the art.
 */
export async function showBigText(text = "postdiff"): Promise<void> {
  const frame = createBigTextFrame({ text });
  const width = process.stdout.columns ?? BIG_TEXT_COLS;
  const at = (t: number): string =>
    frame(t)
      .split("\n")
      .map((l) => l.slice(0, width))
      .join("\n");
  const resting = at(0);
  const rows = resting.split("\n").length;
  if (!process.stdout.isTTY || process.env["TERM"] === "dumb") {
    process.stdout.write(resting + "\n");
    return;
  }
  const FPS = 12;
  const frames = Math.round(3.0 * FPS); // one glint sweep, then rest
  process.stdout.write("\x1b[?25l");
  try {
    process.stdout.write(resting + "\n");
    for (let i = 0; i < frames; i++) {
      await sleep(1000 / FPS);
      process.stdout.write(`\x1b[${rows}A\x1b[J` + at(i / FPS) + "\n");
    }
    process.stdout.write(`\x1b[${rows}A\x1b[J` + resting + "\n");
  } finally {
    process.stdout.write("\x1b[?25h");
  }
}
