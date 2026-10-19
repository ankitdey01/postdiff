"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "./ui/Button";

type LineKind =
  | "cmd"
  | "dim"
  | "body"
  | "ok"
  | "warn"
  | "err"
  | "jev"
  | "draft"
  | "gap";

interface TermLine {
  id: string;
  kind: LineKind;
  text: string;
}

/**
 * Live terminal with transcripts from real CLI runs in this repo.
 * Interactive: type a command or tap a chip; `help` lists real flags.
 */
const DRAFT_TEXT =
  "Shipped file locking for voice samples. Concurrent appends now wait their turn instead of racing. Small fix, real peace of mind.";

const HELP_LINES = [
  "context [sha] [--json]: show what would go into a draft",
  "generate [sha] [--force --fresh --web --blog --x --linkedin]",
  "review [sha] [--blog --x --linkedin --accept --reject --reason]",
  "publish [sha] [--blog --x --linkedin]: copy the approved draft",
];

const CONTEXT_LINES: Omit<TermLine, "id">[] = [
  { kind: "body", text: "commit 49e35532 (cached)" },
  {
    kind: "body",
    text: "message: feat: add interactive mode detection and file locking",
  },
  {
    kind: "dim",
    text: "previous: 2cb404ff (refactor: migrate to monorepo structure)",
  },
  { kind: "warn", text: "summary: missing (run generate first)" },
  {
    kind: "body",
    text: "diff: 12712 chars shaped (unfiltered) | files: 9 | content: 43204 chars",
  },
  { kind: "dim", text: "M .gitignore (75 chars)" },
  { kind: "dim", text: "M apps/terminal/src/main.ts (2866 chars)" },
  { kind: "dim", text: "M packages/core/src/prompts.ts (6381 chars)" },
  { kind: "dim", text: "… +6 more (package-lock.json omitted: ignored)" },
  { kind: "ok", text: "context ready." },
];

const CHIPS = [
  { label: "context", cmd: "postdiff context" },
  { label: "generate", cmd: "postdiff generate --x" },
  { label: "review", cmd: "postdiff review --x --accept" },
  { label: "publish", cmd: "postdiff publish --x" },
  { label: "help", cmd: "postdiff --help" },
];

let nextId = 0;
const makeId = (): string =>
  `${Date.now().toString(36)}-${nextId++}-${Math.random().toString(36).slice(2, 8)}`;
const make = (kind: LineKind, text: string): TermLine => ({
  id: makeId(),
  kind,
  text,
});

const KIND_CLASS: Record<LineKind, string> = {
  cmd: "text-white/80",
  dim: "text-white/45",
  body: "text-body",
  ok: "text-mint",
  warn: "text-traffic-amber",
  err: "text-code-red",
  jev: "text-volt",
  draft: "text-white/80",
  gap: "",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function CodeWindow() {
  const [lines, setLines] = useState<TermLine[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const refocusRef = useRef(false);
  const playedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const reducedRef = useRef(false);
  const flightSeq = useRef(0);
  const [flight, setFlight] = useState<{
    id: number;
    label: string;
    sx: number;
    sy: number;
    w: number;
    h: number;
    dx: number;
    dy: number;
    on: boolean;
  } | null>(null);

  useEffect(() => {
    reducedRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  // Keep the latest output in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const push = useCallback((kind: LineKind, text: string) => {
    setLines((prev) => [...prev.slice(-60), make(kind, text)]);
  }, []);

  const typeCommand = useCallback(
    async (full: string) => {
      const line = make("cmd", "");
      // Blank line before each new command block, so runs read as
      // separate paragraphs instead of one wall of text.
      setLines((prev) => [
        ...prev.slice(-60),
        ...(prev.length ? [make("gap", "")] : []),
        line,
      ]);
      if (reducedRef.current) {
        setLines((prev) =>
          prev.map((l) => (l.id === line.id ? { ...l, text: full } : l)),
        );
        return;
      }
      for (let i = 1; i <= full.length; i++) {
        const slice = full.slice(0, i);
        setLines((prev) =>
          prev.map((l) => (l.id === line.id ? { ...l, text: slice } : l)),
        );
        await sleep(full.startsWith("postdiff") ? 26 : 18);
      }
      await sleep(120);
    },
    [],
  );

  const streamDraft = useCallback(async () => {
    const line = make("draft", "");
    setLines((prev) => [...prev, line]);
    if (reducedRef.current) {
      setLines((prev) =>
        prev.map((l) =>
          l.id === line.id ? { ...l, text: `\u201C${DRAFT_TEXT}\u201D` } : l,
        ),
      );
      return;
    }
    const full = `\u201C${DRAFT_TEXT}\u201D`;
    for (let i = 2; i <= full.length; i += 2) {
      const slice = full.slice(0, i);
      setLines((prev) =>
        prev.map((l) => (l.id === line.id ? { ...l, text: slice } : l)),
      );
      await sleep(14);
    }
    setLines((prev) =>
      prev.map((l) => (l.id === line.id ? { ...l, text: full } : l)),
    );
  }, []);

  const runContext = useCallback(async () => {
    await typeCommand("postdiff context");
    for (const l of CONTEXT_LINES) {
      push(l.kind, l.text);
      if (!reducedRef.current) await sleep(70);
    }
  }, [push, typeCommand]);

  const runGenerate = useCallback(
    async (platform: string, condensed = false) => {
      await typeCommand(
        platform ? `postdiff generate --${platform}` : "postdiff generate",
      );
      if (!platform) {
        push(
          "warn",
          "No platform requested. Add --blog, --x, or --linkedin to draft.",
        );
        push("dim", "nothing drafted.");
        return;
      }
      // First-load autoplay stays short: one check, one draft,
      // one next step. Full context stats stay behind the
      // `context` chip for users who opt in.
      if (condensed) {
        push("dim", "checking commit 49e35532…");
        await sleep(reducedRef.current ? 0 : 550);
        push("jev", "worth sharing (6 of 9 files kept)");
        await sleep(reducedRef.current ? 0 : 350);
        await streamDraft();
        push("body", `draft saved locally for ${platform}.md`);
        push("ok", "run `postdiff review` to approve it.");
        return;
      }
      push("dim", "loading context…");
      await sleep(reducedRef.current ? 0 : 550);
      push("body", `context ready, drafting… (${platform})`);
      await sleep(reducedRef.current ? 0 : 450);
      push("jev", "worth sharing (6 of 9 files kept)");
      await sleep(reducedRef.current ? 0 : 350);
      await streamDraft();
      push("body", `draft saved locally for ${platform}.md`);
      push("ok", "run `postdiff review` to approve it.");
    },
    [push, streamDraft, typeCommand],
  );

  const runReview = useCallback(
    async (reject: boolean) => {
      await typeCommand(
        reject ? "postdiff review --x --reject" : "postdiff review --x --accept",
      );
      await sleep(reducedRef.current ? 0 : 300);
      if (reject) {
        push("warn", "rejected x.md (version removed)");
        push("dim", "choice recorded.");
      } else {
        push("ok", "approved x.md (saved your preference: first person, past tense)");
        push("dim", "choice recorded.");
      }
    },
    [push, typeCommand],
  );

  const runPublish = useCallback(async () => {
    await typeCommand("postdiff publish --x");
    await sleep(reducedRef.current ? 0 : 300);
    push("body", `copied x.md (${DRAFT_TEXT.length} chars). Paste it anywhere you like.`);
    push("ok", "done.");
  }, [push, typeCommand]);

  const runHelp = useCallback(async () => {
    await typeCommand("postdiff --help");
    for (const t of HELP_LINES) {
      push("dim", t);
      if (!reducedRef.current) await sleep(60);
    }
  }, [push, typeCommand]);

  const runRaw = useCallback(
    async (raw: string) => {
      if (busyRef.current) return;
      const cmd = raw.trim().replace(/^\$\s*/, "").replace(/^›\s*/, "");
      if (!cmd) return;
      busyRef.current = true;
      setBusy(true);
      try {
        const body = cmd.replace(/^postdiff\s*/, "").trim();
        if (body === "" || body === "--help" || body === "help") {
          await runHelp();
        } else if (body === "clear") {
          setLines([]);
        } else if (body.startsWith("context")) {
          await runContext();
        } else if (body.startsWith("generate")) {
          const m = body.match(/--(blog|x|linkedin)/);
          await runGenerate(m ? m[1] : "");
        } else if (body.startsWith("review")) {
          await runReview(body.includes("--reject"));
        } else if (body.startsWith("publish")) {
          await runPublish();
        } else if (body.startsWith("setup") || body.startsWith("voice")) {
          await typeCommand(`postdiff ${body}`);
          push("dim", "guided setup. Best run in your own terminal.");
        } else {
          const unknown = body.split(/\s+/)[0];
          await typeCommand(`postdiff ${body}`);
          push("err", `error: unknown command '${unknown}'`);
          push("dim", "try: context, generate --x, review, publish, help");
        }
      } finally {
        busyRef.current = false;
        refocusRef.current = true;
        setBusy(false);
      }
    },
    [runContext, runGenerate, runHelp, runPublish, runReview, push, typeCommand],
  );

  useEffect(() => {
    if (!busy && refocusRef.current) {
      refocusRef.current = false;
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [busy]);

  // Autoplay once in view: a single short demo (check, draft, next step).
  // Reduced-motion users get instant output. Full context output
  // stays behind the `context` chip so first paint never scrolls.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || playedRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || playedRef.current || busyRef.current) return;
        playedRef.current = true;
        io.disconnect();
        (async () => {
          busyRef.current = true;
          setBusy(true);
          try {
            await runGenerate("x", true);
          } finally {
            busyRef.current = false;
            setBusy(false);
          }
        })();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [runGenerate]);

  const replay = () => {
    if (busyRef.current) return;
    setLines([]);
    playedRef.current = true;
    void runRaw("postdiff generate --x");
  };

  // Suggested-chip flight: the tapped command visibly travels from the
  // chip to the terminal prompt before it starts typing. Reduced-motion
  // users skip the flight and run immediately.
  const FLIGHT_MS = 420;
  const handleChip = useCallback(
    async (e: MouseEvent<HTMLButtonElement>, cmd: string, label: string) => {
      if (busyRef.current) return;
      const rootEl = rootRef.current;
      const formEl = formRef.current;
      const btnEl = e.currentTarget;
      if (!rootEl || !formEl || reducedRef.current) {
        void runRaw(cmd);
        return;
      }
      const rootRect = rootEl.getBoundingClientRect();
      const btnRect = btnEl.getBoundingClientRect();
      const destRect = formEl.getBoundingClientRect();
      const sx = btnRect.left - rootRect.left;
      const sy = btnRect.top - rootRect.top;
      const tx = destRect.left - rootRect.left + 18;
      const ty =
        destRect.top - rootRect.top + destRect.height / 2 - btnRect.height / 2;
      const id = ++flightSeq.current;
      setFlight({
        id,
        label,
        sx,
        sy,
        w: btnRect.width,
        h: btnRect.height,
        dx: tx - sx,
        dy: ty - sy,
        on: false,
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFlight((f) => (f && f.id === id ? { ...f, on: true } : f));
        });
      });
      await sleep(FLIGHT_MS);
      setFlight((f) => (f && f.id === id ? null : f));
      await runRaw(cmd);
    },
    [runRaw],
  );

  return (
    <div
      ref={rootRef}
      className="relative flex h-[700px] w-full max-w-[1000px] flex-col overflow-hidden rounded-2xl bg-black shadow-[0_48px_120px_-24px_rgba(0,0,0,0.95),0_24px_64px_-32px_rgba(0,0,0,0.8)] sm:h-[720px]"
    >
      {/* Glass sheen for the terminal card. */}
      <div
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent"
        aria-hidden="true"
      />
      {/* Chip flight ghost: clone travelling chip → prompt. */}
      {flight && (
        <span
          aria-hidden="true"
          className="chip-flight pointer-events-none absolute z-20 inline-flex items-center gap-1.5 rounded-md border border-lime/50 bg-lime/[0.14] px-3 font-mono text-[11px] text-white"
          style={{
            left: flight.sx,
            top: flight.sy,
            width: flight.w,
            height: flight.h,
            transform: flight.on
              ? `translate(${flight.dx}px, ${flight.dy}px) scale(0.92)`
              : "translate(0px, 0px) scale(1)",
            opacity: flight.on ? 0.25 : 1,
          }}
        >
          <span className="text-[11px] text-volt">›</span>
          {flight.label}
        </span>
      )}
      <div className="flex items-center gap-2 px-4 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-traffic-red" />
          <span className="h-2.5 w-2.5 rounded-full bg-traffic-amber" />
          <span className="h-2.5 w-2.5 rounded-full bg-traffic-green" />
        </div>
        <span className="font-mono text-xs text-white/40">postdiff terminal</span>
        <Button
          variant="quiet"
          size="sm"
          onClick={replay}
          disabled={busy}
          aria-label="Replay demo"
          leading={<RotateCcw size={12} strokeWidth={2} />}
          className="ml-auto rounded-none"
        >
          Replay
        </Button>
      </div>

      <div
        ref={scrollRef}
        aria-live="polite"
        aria-label="postdiff terminal demo"
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-2.5 font-mono text-[12px] font-light leading-[20px] sm:text-[12.5px]"
      >
        {lines.length === 0 && !busy && (
          <p className="text-white/30">waiting for input. Try a chip below.</p>
        )}
        {lines.map((l, i) =>
          l.kind === "gap" ? (
            <div key={l.id} className="h-3" aria-hidden="true" />
          ) : l.kind === "cmd" ? (
            <p key={l.id} className={`term-line whitespace-pre-wrap break-words ${i > 0 ? "mt-3" : ""}`}>
              <span className="mr-1.5 text-lime" aria-hidden="true">›</span>
              <span className={KIND_CLASS.cmd}>{l.text}</span>
              {busy && <span className="caret ml-1 inline-block h-3 w-[7px] bg-lime align-middle" aria-hidden="true" />}
            </p>
          ) : (
            <p key={l.id} className={`term-line whitespace-pre-wrap break-words ${KIND_CLASS[l.kind]}`}>
              {l.kind === "draft" ? (
                <span className="border-l-2 border-lime/60 pl-2">{l.text}</span>
              ) : (
                l.text
              )}
            </p>
          ),
        )}
      </div>

      <div className="no-scrollbar command-rail mx-3 mb-2 justify-between overflow-x-auto" aria-label="Try a command">
        {CHIPS.map((c) => (
          <Button
            key={c.label}
            variant="quiet"
            size="sm"
            disabled={busy}
            onClick={(e) => void handleChip(e, c.cmd, c.label)}
            leading={<span className="font-mono text-[11px] text-volt">›</span>}
            className="shrink-0 font-mono text-[11px]"
          >
            {c.label}
          </Button>
        ))}
      </div>

      <form
        ref={formRef}
        className="flex items-center gap-2 bg-white/[0.02] px-3 py-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          const v = input;
          setInput("");
          void runRaw(v.startsWith("postdiff") ? v : `postdiff ${v}`);
        }}
      >
        <span className="font-mono text-[17px] leading-none text-lime" aria-hidden="true">›</span>
        <label htmlFor="postdiff-term" className="sr-only">Type a postdiff command</label>
        <input
          ref={inputRef}
          id="postdiff-term"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="postdiff …  (try: context, help)"
          autoComplete="off"
          spellCheck={false}
          disabled={busy}
          className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-body caret-lime outline-none placeholder:text-white/25 disabled:opacity-50"
        />
        <span className="hidden font-mono text-[10px] uppercase tracking-widest text-white/25 sm:block" aria-hidden="true">
          live
        </span>
      </form>
    </div>
  );
}
