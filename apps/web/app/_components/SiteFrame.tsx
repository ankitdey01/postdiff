import type { ReactNode } from "react";

/** Shared outer frame used by the landing page and every document route. */
export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40 hidden min-[1440px]:block"
      >
        <div className="mx-auto h-full w-full max-w-[1440px] border-x border-line" />
      </div>
      {children}
    </div>
  );
}

/** A bounded content frame that keeps route pages on the landing-page grid. */
export function PageGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1440px] border-x border-line ${className}`}>
      {children}
    </div>
  );
}
