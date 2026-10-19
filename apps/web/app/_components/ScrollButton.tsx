"use client";

import { scrollToId } from "./scroll-to";

/** Button that smooth-scrolls to a section id. */
export function ScrollButton({
  to,
  className,
  children,
  ariaLabel,
  style,
}: {
  to: string;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={className}
      style={style}
      onClick={() => scrollToId(to)}
    >
      {children}
    </button>
  );
}
