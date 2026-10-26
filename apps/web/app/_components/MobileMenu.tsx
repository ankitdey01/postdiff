"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { Drawer } from "./motion/drawer";
import { ExpandingArrowButton } from "./motion/expanding-arrow-button";
import { scrollToId } from "./scroll-to";

export interface MobileMenuLink {
  label: string;
  href: string;
}

/** Hamburger button + right-side drawer holding every nav link. Mobile only. */
export function MobileMenu({ links }: { links: readonly MobileMenuLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-11 w-11 cursor-pointer place-items-center border border-line bg-surface text-white transition-[color,border-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:border-white/30 hover:text-volt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-volt motion-safe:active:scale-[0.97] md:hidden"
      >
        {open ? (
          <X size={18} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
        ) : (
          <Menu size={18} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
        )}
      </button>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        side="right"
        ariaLabel="Site menu"
        className="border-line bg-surface"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <span className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center">
              <Image 
                src="/logo.webp" 
                alt="" 
                width={28} 
                height={28}
                className="h-full w-full object-contain"
              />
            </span>
            <span className="eyebrow text-white">Postdiff</span>
          </span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="grid h-11 w-11 cursor-pointer place-items-center border border-line text-white transition-[color,border-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:border-white/30 hover:text-volt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-volt motion-safe:active:scale-[0.97]"
          >
            <X size={18} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
          </button>
        </div>
        <nav className="flex flex-col px-6 py-4" aria-label="Mobile">
          {links.map((l) =>
            l.href.startsWith("mailto:") ? (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="link-mono group flex items-center justify-between border-b border-line py-4 font-hero text-sm uppercase tracking-[0.1em] text-white/60 hover:text-white"
              >
                {l.label}
                <ArrowUpRight
                  size={16}
                  strokeWidth={2}
                  absoluteStrokeWidth
                  aria-hidden="true"
                  className="text-white/30 transition-colors group-hover:text-volt"
                />
              </a>
            ) : (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="link-mono border-b border-line py-4 font-hero text-sm uppercase tracking-[0.1em] text-white/60 hover:text-white"
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>
        <div className="mt-auto border-t border-line p-6">
          <ExpandingArrowButton
            aria-label="Start for free"
            className="h-12 w-full min-w-0"
            labelClassName="ml-[62px] mr-4 text-[13px] font-medium uppercase tracking-[0.1em]"
            onClick={() => {
              // Close first so body scroll lock releases, then scroll.
              setOpen(false);
              window.setTimeout(() => scrollToId("start"), 250);
            }}
          >
            Start for free
          </ExpandingArrowButton>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/30">
            You approve every word
          </p>
        </div>
      </Drawer>
    </>
  );
}
