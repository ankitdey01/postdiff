"use client";

import { Pin } from "lucide-react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";
import { cn } from "./utils";

interface CardProps {
  number: string;
  title: string;
  description: string;
  colorTheme?: "orange" | "blue" | "purple";
  className?: string;
  rotate?: string;
  colors?: {
    bg: string;
    text: string;
    border: string;
  };
}

/**
 * Pinned-note card. Theme names are kept from the upstream snippet for
 * API compatibility; they map to Postdiff dark tokens (lime / mint /
 * rose) instead of the original pastel orange/blue/purple.
 */
function Card({
  number,
  title,
  description,
  colorTheme = "blue",
  className,
  rotate,
  colors: customColors,
}: CardProps) {
  const bgMap = {
    orange: "bg-lime/[0.07]",
    blue: "bg-mint/[0.07]",
    purple: "bg-rose/[0.07]",
  } as const;
  const textMap = {
    orange: "text-volt",
    blue: "text-mint",
    purple: "text-rose",
  } as const;
  const borderMap = {
    orange: "border-lime/25",
    blue: "border-mint/25",
    purple: "border-rose/25",
  } as const;

  const bgColor = customColors?.bg || bgMap[colorTheme];
  const textColor = customColors?.text || textMap[colorTheme];
  const borderColor = customColors?.border || borderMap[colorTheme];

  return (
    <div
      className={cn(
        "relative w-full transition-transform duration-300 hover:z-30 hover:scale-105 md:w-[220px]",
        rotate,
        className,
      )}
    >
      <div className="rounded-[20px] border border-line bg-panel p-1.5">
        <Pin
          aria-hidden="true"
          className={cn("z-20 mx-auto mb-4 h-5 w-5", textColor)}
          strokeWidth={1.5}
        />
        <div
          className={cn(
            "relative flex h-full flex-col overflow-hidden rounded-[12px] border p-3",
            bgColor,
            borderColor,
          )}
        >
          <span className={cn("mb-3 font-mono text-2xl tracking-tight", textColor)}>
            {number}
          </span>
          <h3 className="mb-2 text-lg font-semibold leading-none text-white">
            {title}
          </h3>
          <p className="text-[13px]/5 tracking-tight text-white/60">{description}</p>
        </div>
      </div>
    </div>
  );
}

export interface Step {
  title: string;
  description: string;
  colorTheme?: "orange" | "blue" | "purple";
  colors?: {
    bg: string;
    text: string;
    border: string;
  };
}

export interface StepPosition {
  className?: string;
  rotate?: string;
}

export interface HowItWorksProps {
  features?: Step[];
  className?: string;
  stepPositions?: StepPosition[];
}

const DEFAULT_CARD_POSITIONS: StepPosition[] = [
  { className: "md:absolute md:top-0 md:left-[15%]", rotate: "rotate-[6deg]" },
  {
    className: "md:absolute md:top-[95px] md:right-[15%]",
    rotate: "rotate-[-6deg]",
  },
  { className: "md:absolute md:top-[360px] md:left-[15%]", rotate: "rotate-[6deg]" },
  {
    className: "md:absolute md:top-[455px] md:right-[10%]",
    rotate: "rotate-[-6deg]",
  },
  { className: "md:absolute md:top-[680px] md:left-[15%]", rotate: "rotate-[6deg]" },
];

/** Postdiff pipeline defaults: ship → gate → draft → review → copy. */
const DEFAULT_FEATURES: Step[] = [
  {
    title: "Ship work",
    description:
      "Finish the commit on main. Postdiff reads the diff, the message, and the parent for context.",
    colorTheme: "orange",
  },
  {
    title: "Worth-sharing check",
    description:
      "A significance gate decides if the work matters. Chores and routine bumps stay quiet.",
    colorTheme: "blue",
  },
  {
    title: "Draft in your voice",
    description:
      "Worthwhile work becomes three drafts — X, LinkedIn, blog — written from your own samples.",
    colorTheme: "purple",
  },
  {
    title: "You review",
    description:
      "Every draft waits for you. Edit it, accept it, or drop it. Nothing goes out on its own.",
    colorTheme: "orange",
  },
  {
    title: "Copy anywhere",
    description:
      "Accepted drafts copy to your clipboard. Paste wherever your readers are — no connections needed.",
    colorTheme: "blue",
  },
];

function heightFor(count: number) {
  if (count <= 1) return 320;
  if (count === 2) return 360;
  if (count === 3) return 640;
  if (count === 4) return 720;
  return 900;
}

/**
 * Zig-zag pinned timeline. Stacked list on mobile; absolute collage with
 * an animated dashed connector on md+.
 */
export default function HowItWorks({
  features,
  className,
  stepPositions,
}: HowItWorksProps) {
  const data = features && features.length > 0 ? features : DEFAULT_FEATURES;
  const positions = stepPositions || DEFAULT_CARD_POSITIONS;
  const height = heightFor(data.length);
  const reduced = useReducedMotion() ?? false;

  const pathD = data.reduce((acc, _, index) => {
    if (index >= data.length - 1) return acc;
    if (index === 0) return "M 290 120 C 500 120, 550 216, 710 216"; // 1 -> 2
    if (index === 1) return acc + " C 850 216, 500 280, 290 360"; // 2 -> 3
    if (index === 2) return acc + " C 290 480, 550 576, 750 576"; // 3 -> 4
    if (index === 3) return acc + " C 950 576, 500 640, 290 680"; // 4 -> 5
    return acc;
  }, "");

  return (
    <LazyMotion features={domAnimation}>
      <div className={cn("relative bg-surface px-6 max-md:pb-16 max-md:pt-8 md:py-12", className)}>
        {/* Horizontal rules, dark-theme version of the upstream grid. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "100% 32px",
            marginTop: "4px",
          }}
        />
        <div
          aria-hidden="true"
          className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r"
        />
        <div
          aria-hidden="true"
          className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l"
        />

        <div className="relative z-10 mx-auto max-w-4xl">
          <div
            className="relative mx-auto flex h-auto w-full max-w-[800px] flex-col space-y-6 md:block md:space-y-0 md:h-[var(--md-height)]"
            style={{ "--md-height": `${height}px` } as CSSProperties}
          >
            {data.length > 1 && (
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 z-0 hidden h-full w-full md:block"
                viewBox={`0 0 1000 ${height}`}
                preserveAspectRatio="none"
              >
                <m.path
                  d={pathD}
                  stroke="currentColor"
                  className="text-white/15"
                  strokeWidth="2"
                  strokeDasharray="8 6"
                  fill="none"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ strokeDashoffset: 0 }}
                  animate={reduced ? undefined : { strokeDashoffset: -140 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </svg>
            )}

            <ol className="contents">
              {data.map((step, index) => {
                const position = positions[index % positions.length];

                return (
                  <li key={step.title} className="contents">
                    <Card
                      number={`0${index + 1}`}
                      title={step.title}
                      description={step.description}
                      colorTheme={step.colorTheme || "blue"}
                      colors={step.colors}
                      rotate={position.rotate}
                      className={position.className}
                    />
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
