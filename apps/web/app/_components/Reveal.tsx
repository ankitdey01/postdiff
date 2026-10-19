"use client";

import { useEffect, useRef } from "react";

/** Scroll reveal: opacity + 12px rise, once, via IntersectionObserver.
 * `motion="fade"` is opacity-only for wrappers containing backdrop-filter
 * children (animating filter/transform above them breaks the backdrop). */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  motion = "full",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "article" | "li" | "section";
  motion?: "full" | "fade";
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    el.classList.add(motion === "fade" ? "reveal-armed-fade" : "reveal-armed");
    // If already in view, reveal on the next frame so the entrance stages.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            requestAnimationFrame(() => {
              e.target.classList.add("is-visible");
            });
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [motion]);

  return (
    // @ts-expect-error polymorphic tag with shared props
    <Tag id={id} ref={ref} className={`reveal ${className ?? ""}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
