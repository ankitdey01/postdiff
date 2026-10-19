"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { copyText } from "./clipboard";

/**
 * Install-command button with the same `btn-ghost` treatment as the hero
 * "See how it works" button. Tap copies the command; the icon pops
 * from copy to check while the button press scales via `btn-ghost`.
 */
export function CopyCommand({
  command = "npm i -g postdiff",
  className = "",
}: {
  command?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    await copyText(command);
    setCopied(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied to clipboard" : `Copy ${command} to clipboard`}
      className={`btn-ghost group flex h-[52px] cursor-pointer items-center justify-center gap-2.5 px-4 font-mono text-sm text-body motion-safe:active:scale-100 ${className}`}
    >
      <span aria-hidden="true">{command}</span>
      <span className="grid place-items-center" aria-hidden="true">
        <span
          className={`[grid-area:1/1] transition-[opacity,scale] duration-200 ease-snappy motion-reduce:transition-none ${copied ? "scale-50 opacity-0" : "scale-100 opacity-60 group-hover:opacity-100"}`}
        >
          <Copy size={15} strokeWidth={2} absoluteStrokeWidth />
        </span>
        <span
          className={`[grid-area:1/1] text-mint transition-[opacity,scale] duration-200 ease-snappy motion-reduce:transition-none ${copied ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
        >
          <Check size={15} strokeWidth={2.5} absoluteStrokeWidth />
        </span>
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}
