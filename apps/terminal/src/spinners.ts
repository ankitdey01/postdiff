// Spinners gallery port (frame art) + a dots-only live status for generation.
//
// The art below is the provided gallery verbatim, minus the `../types.ts`
// import: twelve classic loading spinners in a grid, each in a three-row box
// with its name underneath. Generation uses only the "dots" one.

import * as p from "@clack/prompts";

export type SpinnersFrame = (t: number) => string;

export interface SpinnersOptions {
  [key: string]: unknown;
  /** Spinners to show, in this order; empty for all twelve. */
  names: string[];
  labels: boolean;
  speed: number;
}

const spinnersMeta = {
  name: "spinners",
  category: "ui",
  note: "twelve loading spinners side by side, each with its name",
  cols: 66,
  rows: 13,
  fps: 12,
  options: { names: [], labels: true, speed: 1 },
} satisfies { name: string; category: string; note: string; cols: number; rows: number; fps: number; options: SpinnersOptions };

/** A glyph at a column and row of a spinner's picture. */
type Cell = [x: number, y: number, ch: string];
/** A spinner's name, frames a step, and its picture at step i. */
type Spinner = [name: string, frames: number, draw: (i: number) => string[]];

// Quadrant blocks by which of upper left, upper right, lower left, lower
// right are filled.
const QUAD = " ▗▖▄▝▐▞▟▘▚▌▙▀▜▛█";
const quad = (ul: number, ur: number, ll: number, lr: number): string => QUAD[(ul << 3) | (ur << 2) | (ll << 1) | lr];
const ping = (n: number, i: number): number => (i % (2 * n - 2) < n ? i % (2 * n - 2) : 2 * n - 2 - (i % (2 * n - 2))); // 0..n-1..0
const blank = (w: number, h: number): string[][] => Array.from({ length: h }, () => new Array(w).fill(" "));
const rows = (g: string[][]): string[] => g.map((r) => r.join(""));
const plot = (w: number, h: number, cells: Cell[]): string[] => {
  const g = blank(w, h);
  for (const [x, y, ch] of cells) g[y][x] = ch;
  return rows(g);
};

// Each spinner: its name, frames a step at 12 fps, and the picture at step
// i as one to three rows.
const SPINNERS: Spinner[] = [
  ["line", 2, (i) => plot(5, 3, ([
    [[2, 0, "│"], [2, 1, "│"], [2, 2, "│"]],
    [[3, 0, "╱"], [2, 1, "╱"], [1, 2, "╱"]],
    [[0, 1, "─"], [1, 1, "─"], [2, 1, "─"], [3, 1, "─"], [4, 1, "─"]],
    [[1, 0, "╲"], [2, 1, "╲"], [3, 2, "╲"]],
  ] satisfies Cell[][])[i % 4])],
  ["dots", 2, (i) => {
    // Three dots hopping in turn, half a row at a time.
    const g = blank(5, 2);
    for (let d = 0; d < 3; d++) {
      const h = [0, 1, 2, 1, 0, 0, 0][(i - d * 2 + 70) % 7]; // half rows up
      g[h === 2 ? 0 : 1][d * 2] = h === 1 ? "▀" : "▄";
    }
    return rows(g);
  }],
  ["pipe", 2, (i) => {
    // A junction turning, its arms reaching out from the middle.
    const arms = [[1, 1, 0, 1], [1, 1, 0, 0], [1, 1, 1, 0], [1, 0, 1, 0], [1, 0, 1, 1], [0, 0, 1, 1], [0, 1, 1, 1], [0, 1, 0, 1]][i % 8]; // up, left, right, down
    const [u, l, r, d] = arms;
    const hub = "┼├┤│┴└┘╵┬┌┐╷─╶╴ "[((1 - u) << 3) | ((1 - d) << 2) | ((1 - r) << 1) | (1 - l)];
    return plot(5, 3, [[2, 1, hub], ...(u ? [[2, 0, "│"]] satisfies Cell[] : []), ...(d ? [[2, 2, "│"]] satisfies Cell[] : []), ...(l ? [[0, 1, "─"], [1, 1, "─"]] satisfies Cell[] : []), ...(r ? [[3, 1, "─"], [4, 1, "─"]] satisfies Cell[] : [])]);
  }],
  ["arc", 1, (i) => {
    // An arc chasing round a rounded box, stretching and shrinking as it goes.
    const ring: Cell[] = [[0, 0, "╭"], [1, 0, "─"], [2, 0, "─"], [3, 0, "─"], [4, 0, "╮"], [4, 1, "│"], [4, 2, "╯"], [3, 2, "─"], [2, 2, "─"], [1, 2, "─"], [0, 2, "╰"], [0, 1, "│"]];
    const n = 3 + Math.round((ping(8, i) * 4) / 7);
    return plot(5, 3, [...Array(n)].map((_, k) => ring[(i + 12 - k) % 12]));
  }],
  ["bounce", 1, (i) => ["[" + " ".repeat(ping(6, i)) + "o" + " ".repeat(5 - ping(6, i)) + "]"]],
  ["clock", 3, (i) => {
    // One hand from the middle to the rim, a quarter turn a step.
    const g = [[..."╭─────╮"], [..."│     │"], [..."╰─────╯"]];
    const hand = ([[[3, 0, "┬"], [3, 1, "╵"]], [[3, 1, "╶"], [4, 1, "─"], [5, 1, "─"], [6, 1, "┤"]], [[3, 1, "╷"], [3, 2, "┴"]], [[0, 1, "├"], [1, 1, "─"], [2, 1, "─"], [3, 1, "╴"]]] satisfies Cell[][])[i % 4];
    for (const [x, y, ch] of hand) g[y][x] = ch;
    return rows(g);
  }],
  ["bar", 1, (i) => {
    // A bar three rows tall filling and draining in eighths.
    const level = Math.round((ping(12, i + 2) * 24) / 11);
    return [2, 1, 0].map((k) => " ▁▂▃▄▅▆▇█"[Math.max(0, Math.min(8, level - 8 * k))].repeat(3));
  }],
  ["loop", 1, (i) => {
    // A snake of four quadrants running round a three-cell strip.
    const path = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [5, 1], [4, 1], [3, 1], [2, 1], [1, 1], [0, 1]];
    const on = new Set([0, 1, 2, 3].map((k) => path[(i + k) % 12].join()));
    const at = (x: number, y: number): number => (on.has(`${x},${y}`) ? 1 : 0);
    return [[0, 2, 4].map((x) => quad(at(x, 0), at(x + 1, 0), at(x, 1), at(x + 1, 1))).join("")];
  }],
  ["scan", 1, (i) => {
    const head = ping(7, i), dir = i % 12 < 6 ? -1 : 1;
    return [[...Array(7)].map((_, x) => (x === head ? "█" : x === head + dir ? "▓" : x === head + 2 * dir ? "░" : "·")).join("")];
  }],
  ["wave", 1, (i) => [[0, 1, 2, 3, 4, 5, 6].map((x) => "▁▂▃▄▅▆▇█"[Math.round(3.5 + 3.5 * Math.sin(((x - i) * Math.PI) / 4))]).join("")]],
  ["slide", 1, (i) => ["[" + [...Array(8)].map((_, x) => (x - ((i % 10) - 2) >= 0 && x - ((i % 10) - 2) < 3 ? "=" : " ")).join("") + "]"]],
  ["orbit", 1, (i) => {
    const ring = [[1, 0], [2, 0], [3, 0], [4, 1], [3, 2], [2, 2], [1, 2], [0, 1]];
    return plot(5, 3, ring.map(([x, y], k) => [x, y, k === i % 8 ? "o" : k === (i + 7) % 8 ? "°" : "·"]));
  }],
];

export const SPINNER_NAMES = SPINNERS.map((s) => s[0]);

export function createSpinnersFrame({ names = spinnersMeta.options.names, labels = spinnersMeta.options.labels, speed = spinnersMeta.options.speed }: Partial<SpinnersOptions> = {}): SpinnersFrame {
  // filter(Boolean) drops the names that match no spinner.
  const chosen = names && names.length ? names.map((n) => SPINNERS.find((s) => s[0] === n)).filter(Boolean) as Spinner[] : SPINNERS;
  const all = chosen === SPINNERS;
  // Slots eleven columns wide, six to a row; a block is the art's three
  // rows, a blank row and the label.
  const slot = 11, per = all ? 6 : Math.min(6, chosen.length);
  const block = labels || all ? 5 : 3;
  const cols = all ? spinnersMeta.cols : per * slot;
  const height = all ? spinnersMeta.rows : Math.ceil(chosen.length / per) * (block + 1) + 1;

  return (t) => {
    const grid: string[][] = Array.from({ length: height }, () => new Array(cols).fill(" "));
    chosen.forEach(([name, frames, draw], n) => {
      const x0 = (n % per) * slot, y0 = 1 + Math.floor(n / per) * (block + 1);
      const art = draw(Math.floor((t * spinnersMeta.fps * speed) / frames + 1e-3));
      const top = y0 + Math.floor((3 - art.length) / 2);
      art.forEach((line, j) => {
        const left = x0 + Math.floor((slot - [...line].length) / 2);
        [...line].forEach((g, i) => (grid[top + j][left + i] = g));
      });
      if (labels) [...name].forEach((g, i) => (grid[y0 + 4][x0 + Math.floor((slot - name.length) / 2) + i] = g));
    });
    return grid.map((l) => l.join("")).join("\n");
  };
}

export const DOTS_FPS = spinnersMeta.fps;

/** Minimal spinner surface shared by the dots status and clack's spinner. */
export interface StatusSpinner {
  start(msg: string): void;
  message(msg: string): void;
  stop(msg: string): void;
  error(msg: string): void;
}

function asStatusSpinner(s: { start(m: string): void; message(m: string): void; stop(m: string): void; error(m: string): void }): StatusSpinner {
  return s;
}

/**
 * Dots-only live status for generation. Animates the gallery's "dots" art
 * (labels off) above the status message at 12fps on a TTY; off-TTY it
 * degrades to clack's own spinner, which already handles CI output.
 */
export function createDotsStatus(): StatusSpinner {
  if (!process.stdout.isTTY) {
    const s = p.spinner();
    return asStatusSpinner({
      start: (m) => s.start(m),
      message: (m) => s.message(m),
      stop: (m) => s.stop(m),
      error: (m) => s.error(m),
    });
  }

  const frame = createSpinnersFrame({ names: ["dots"], labels: false });
  let timer: NodeJS.Timeout | null = null;
  let msg = "";
  let t0 = 0;
  let drawn = 0;
  let live = false;

  const restoreCursor = () => process.stdout.write("\x1b[?25h");
  process.once("exit", restoreCursor);

  const render = () => {
    const art = frame((Date.now() - t0) / 1000).split("\n");
    while (art.length > 0 && art[0]!.trim() === "") art.shift();
    while (art.length > 0 && art[art.length - 1]!.trim() === "") art.pop();
    const last = (art.pop() ?? "").trimEnd();
    const clean = msg.replace(/\s+/g, " ");
    const room = Math.max(0, (process.stdout.columns ?? 80) - last.length - 2);
    const block = [...art, `${last}  ${clean.slice(0, room)}`];
    // The dots art is 2 rows, but when all dots share one half-row the other
    // row is blank and trims away — pad back so every repaint is the same
    // height, otherwise the cursor-up lands short and stale lines pile up.
    while (block.length < 2) block.unshift("");
    if (drawn > 0) process.stdout.write(`\x1b[${drawn}A\x1b[J`);
    process.stdout.write(block.join("\n") + "\n");
    drawn = block.length;
  };
  const clear = () => {
    if (drawn > 0) process.stdout.write(`\x1b[${drawn}A\x1b[J`);
    drawn = 0;
  };
  const end = () => {
    if (timer) clearInterval(timer);
    timer = null;
    live = false;
    clear();
    restoreCursor();
    process.removeListener("exit", restoreCursor);
  };

  return {
    start(m: string) {
      msg = m;
      t0 = Date.now();
      live = true;
      process.stdout.write("\x1b[?25l");
      render();
      timer = setInterval(render, 1000 / DOTS_FPS);
    },
    message(m: string) {
      if (!live) return;
      msg = m;
      render();
    },
    stop(m: string) {
      if (!live) return;
      end();
      p.log.success(m);
    },
    error(m: string) {
      if (!live) return;
      end();
      p.log.error(m);
    },
  };
}
