"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { CopyCommand } from "./CopyCommand";
import { copyText } from "./clipboard";
import { ExpandingArrowButton } from "./motion/expanding-arrow-button";
import { Reveal } from "./Reveal";
import BlurText from "./ui/BlurText";
import { FluidGradientText } from "./ui/fluid-gradient-text";

const INSTALL_CMD = "npm i -g postdiff";

const PRODUCT_LINKS = [{ label: "FAQ", href: "/#faq" }] as const;

const RESOURCE_LINKS = [
  { label: "Docs", href: "/docs" },
  { label: "Pricing", href: "/pricing" },
] as const;

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/tos" },
] as const;

/** Wipe-hover style for external links. */
function StripLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group/strip flex items-center text-[12px] tracking-[-2%] transition-colors duration-150 md:text-[14px]"
    >
      <span className="relative">
        <span className="text-white/60 transition-colors duration-150 group-hover/strip:text-white">
          {children}
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 flex w-0 items-center overflow-hidden bg-white text-black transition-[width] duration-200 ease-snappy group-hover/strip:w-full motion-reduce:transition-none"
        >
          <span className="whitespace-nowrap">{children}</span>
        </span>
      </span>
    </a>
  );
}

/** Same wipe treatment for real pages (Next links, no new tab). */
function PageLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group/strip flex items-center text-[12px] tracking-[-2%] transition-colors duration-150 md:text-[14px]"
    >
      <span className="relative">
        <span className="text-white/60 transition-colors duration-150 group-hover/strip:text-white">
          {children}
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 flex w-0 items-center overflow-hidden bg-white text-black transition-[width] duration-200 ease-snappy group-hover/strip:w-full motion-reduce:transition-none"
        >
          <span className="whitespace-nowrap">{children}</span>
        </span>
      </span>
    </Link>
  );
}

/** Tiny square separator between footer links. */
function SquareDot() {
  return <span aria-hidden="true" className="h-[5px] w-[5px] shrink-0 bg-white" />;
}

/** Final call to action and footer. */
export function Finale() {
  const [copied, setCopied] = useState(false);

  async function copyInstall() {
    await copyText(INSTALL_CMD);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <section id="start" className="bg-surface">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start gap-8 px-6 py-24 lg:flex-row lg:items-center lg:justify-between lg:px-[91px]">
          <Reveal motion="fade">
            <p className="eyebrow text-volt">Start</p>
            <h2 className="mt-4 text-balance text-[40px] font-normal leading-[44px]">
              <BlurText
                as="span"
                text="Ship the work."
                className="text-white"
                style={{ display: "inline-flex" }}
              />
              <br />
              <BlurText
                as="span"
                text="We will help with the post."
                className="text-white/60"
                style={{ display: "inline-flex" }}
              />
            </h2>
            <p className="mt-4 max-w-[520px] font-sans text-base font-light leading-[26px] text-white/60">
              Install it, run setup once, and turn your latest work into a
              first draft. Free while it runs on your own keys.
            </p>
          </Reveal>
          <Reveal delay={100} className="flex flex-wrap items-center gap-3">
            <ExpandingArrowButton
              onClick={copyInstall}
              aria-label={copied ? "Copied" : "Start for free"}
              className="h-[52px] w-full min-w-0 sm:w-auto sm:min-w-56"
              labelClassName="text-base"
            >
              <span className="grid flex-1 text-left" aria-live="polite">
                <span
                  aria-hidden={copied}
                  className={`[grid-area:1/1] transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:scale-100 motion-reduce:blur-none ${copied ? "opacity-0 scale-[0.25] blur-[4px]" : "opacity-100 scale-100 blur-none"}`}
                >
                  Start for free
                </span>
                <span
                  aria-hidden={!copied}
                  className={`[grid-area:1/1] transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:scale-100 motion-reduce:blur-none ${copied ? "opacity-100 scale-100 blur-none" : "opacity-0 scale-[0.25] blur-[4px]"}`}
                >
                  Copied
                </span>
              </span>
            </ExpandingArrowButton>
             <CopyCommand command={INSTALL_CMD} className="w-full sm:w-auto" />
          </Reveal>
        </div>
        <div className="hairline" />
      </section>

      <footer className="relative overflow-hidden border-t border-line bg-black text-white/60">
        {/* Volt floor glow behind the footer. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[320px] opacity-70 sm:h-[420px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 50% 100%, rgba(166, 214, 9, 0.14) 0%, rgba(166, 214, 9, 0) 70%)",
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-[1440px]">
          <div className="flex min-h-[300px] flex-col justify-between gap-10 px-6 pb-16 pt-8 md:min-h-[400px] md:pt-24 lg:flex-row lg:gap-12 lg:px-[91px]">
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="flex min-w-0 items-center">
                <div className="h-[clamp(6rem,10vw,9rem)] min-w-0 flex-1 text-white" aria-label="Postdiff">
                  <FluidGradientText
                    text="POSTDIFF"
                    svgViewBoxWidth={1400}
                    svgViewBoxHeight={260}
                  />
                </div>
              </div>
              <p className="mt-6 max-w-[520px] text-base font-light leading-5 tracking-[-2%] text-white/60 md:text-[16px] md:leading-5">
                Turns finished work into posts that sound like you.
              </p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/30">
                You approve every word
              </p>
            </div>
            <nav
              className="grid shrink-0 grid-cols-2 gap-12 sm:grid-cols-3 sm:gap-16 lg:w-[430px] lg:gap-24"
              aria-label="Footer"
            >
              <div className="flex flex-col gap-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                  Product
                </p>
                {PRODUCT_LINKS.map((l) => (
                  <PageLink key={l.label} href={l.href}>
                    {l.label.toUpperCase()}
                  </PageLink>
                ))}
                {RESOURCE_LINKS.map((l) => (
                  <PageLink key={l.label} href={l.href}>
                    {l.label.toUpperCase()}
                  </PageLink>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                  Legal
                </p>
                {LEGAL_LINKS.map((l) => (
                  <PageLink key={l.label} href={l.href}>
                    {l.label.toUpperCase()}
                  </PageLink>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                  Elsewhere
                </p>
                <StripLink href="https://github.com/ankitdey01/postdiff">
                  <span className="inline-flex items-center gap-1">
                    GITHUB <ArrowUpRight size={12} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
                  </span>
                </StripLink>
                <span className="text-[12px] tracking-[-2%] text-white/30 md:text-[14px]">
                  Version 0.0.1
                </span>
              </div>
            </nav>
          </div>
          {/* Bottom info strip. */}
          <div className="border-y border-line bg-black/40 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col font-mono text-[10px] tracking-[0.2em] sm:text-[11px] md:h-14 md:flex-row md:items-stretch md:justify-between">
              <div className="flex w-full flex-row border-b border-line md:w-auto md:border-b-0">
                <div className="flex items-center justify-center border-r border-line px-4 py-4 text-[12px] tracking-[-2%] text-white/60 sm:px-8 md:justify-start md:py-0 md:text-[14px]">
                  LEGAL
                </div>
                <div className="flex items-center justify-center gap-3 px-6 py-4 sm:gap-4 sm:px-8 md:justify-start md:border-r md:py-0">
                  <PageLink href="/privacy">PRIVACY</PageLink>
                  <SquareDot />
                  <PageLink href="/tos">TERMS</PageLink>
                </div>
              </div>
              <div className="flex w-full flex-row border-b border-line md:w-auto md:border-b-0">
                <div className="flex items-center justify-center border-r border-line px-4 py-4 text-[12px] tracking-[-2%] text-white/60 sm:px-8 md:justify-start md:py-0 md:text-[14px]">
                  PROMISE
                </div>
                <div className="flex items-center justify-center px-6 py-4 text-[12px] tracking-[-2%] text-white/60 sm:px-8 md:justify-start md:border-r md:py-0 md:text-[14px]">
                  YOU APPROVE EVERY WORD
                </div>
              </div>
              <div className="flex w-full flex-wrap items-center justify-start gap-x-3 gap-y-1 px-6 py-4 text-[11px] leading-5 tracking-[-2%] sm:text-[12px] md:w-auto md:justify-end md:py-0 md:text-[14px]">
                <span className="text-white/60">
                  © 2026 Postdiff
                </span>
                <div aria-hidden="true" className="tick-strip hidden h-[54px] w-24 opacity-60 lg:block" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
