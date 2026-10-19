"use client";

import { Ascii } from "ascii.rest/react";
import { kyotoDusk } from "ascii.rest/pieces";

/**
 * Animated kyoto dusk scene rendered behind the hero copy.
 * The canvas keeps its own aspect ratio, so only width sizing is used here.
 *
 * Recolor: only the pink slots (sky glow 6-12, blossom 16-21) become lime,
 * with a wide light-lime ramp. Everything else is neutralized to olives
 * and darks, no purple, no brown, no blue. Same slot order and length
 * (41) as the original piece so its shading still works.
 */
const LIME_PALETTE = [
  "#1c1d4a", "#262759", "#33316b", "#433d7c", "#574a8c", "#6e5a9a",
  "#7fae0e", "#97dc21", "#a6d609", "#bdea0c", "#c8f902", "#ddfb6e", "#f0ffc4",
  "#fff1d8", "#fffaf0", "#d7f26a",
  "#f4ffd6", "#ddfb6e", "#c8f902", "#a6d609", "#82d305", "#6b9412",
  "#f7f3d8", "#edf0b0", "#dbe37c", "#c3e838", "#9ccf1a",
  "#1a2008", "#232b0e", "#2f3a12",
  "#46560f", "#5c7020",
  "#2c3a3a", "#3d4c46", "#56604f",
  "#c9e66a", "#e2f49a",
  "#2a330e", "#3f4d15",
  "#1c2410", "#283418",
];

const limeKyotoDusk = {
  ...kyotoDusk,
  meta: { ...kyotoDusk.meta, ground: "#0d1207", palette: LIME_PALETTE },
};

export function KyotoDuskBackdrop({ className = "" }: { className?: string }) {
  return (
    <Ascii
      piece={limeKyotoDusk}
      label="A pagoda at dusk behind a lime-green tree lit by a stone lantern"
      className={`block h-auto w-full ${className}`}
    />
  );
}
