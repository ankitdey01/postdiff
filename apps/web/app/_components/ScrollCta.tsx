"use client";

import type { ReactNode } from "react";
import { ExpandingArrowButton } from "./motion/expanding-arrow-button";
import { scrollToId } from "./scroll-to";

/** Sharp expanding-arrow CTA that smooth-scrolls to a section id. */
export function ScrollCta({
  to,
    className,
    labelClassName,
    accentClassName,
    children,
    ariaLabel,
  }: {
  to: string;
    className?: string;
    labelClassName?: string;
    accentClassName?: string;
    children: ReactNode;
    ariaLabel?: string;
}) {
  return (
    <ExpandingArrowButton
      aria-label={ariaLabel}
      className={className}
      labelClassName={labelClassName}
      accentClassName={accentClassName}
      onClick={() => scrollToId(to)}
    >
      {children}
    </ExpandingArrowButton>
  );
}
