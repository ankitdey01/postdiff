"use client";

// From beui.dev (MIT). Reads the presence of the subtree it renders and hands
// it down, so overlays kept in the tree by `AnimatePresence` release
// interaction in the same commit that starts the exit.

import { useIsPresent } from "motion/react";
import type { ReactNode } from "react";

export interface PresenceGateRenderProps {
  isPresent: boolean;
  gate: {
    inert: boolean;
    style: { pointerEvents: "auto" | "none" };
  };
}

export interface PresenceGateProps {
  children: (props: PresenceGateRenderProps) => ReactNode;
}

export function PresenceGate({ children }: PresenceGateProps) {
  const isPresent = useIsPresent();

  return children({
    isPresent,
    gate: {
      inert: !isPresent,
      style: { pointerEvents: isPresent ? "auto" : "none" },
    },
  });
}
