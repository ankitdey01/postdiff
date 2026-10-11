// Shared Jev plumbing for Significance checks. Gate (whole-commit) and
// inclusion (per-file) ask different questions but share client setup,
// timeout, and answer-shape handling — one SDK change lands here, not twice.

import { TypeSafeClient } from "@typesafe-ai/sdk";
import { withTimeout } from "../async.js";

/** Default Jev model. Pinned in config, overridable per judge. */
export const JEV_MODEL_DEFAULT = "jev-latest";

/** Single timeout for all Jev calls. Hung API never blocks usage. */
export const JEV_TIMEOUT_MS = 30_000;

/** Build the SDK client. Only place that calls `new TypeSafeClient`. */
export function createJevClient(apiKey: string): TypeSafeClient {
  return new TypeSafeClient({ apiKey });
}

/** Run a Jev promise under the shared timeout. */
export function withJevTimeout<T>(p: Promise<T>): Promise<T> {
  return withTimeout(p, JEV_TIMEOUT_MS);
}

/** Pull one noul number out of a systemOne answer. Throws when missing. */
export function extractNoul(answer: unknown, context: string): number {
  const noul = (answer as { noul?: unknown } | null | undefined)?.noul;
  if (typeof noul !== "number" || Number.isNaN(noul)) {
    throw new Error(`Jev returned no noul value${context ? ` (${context})` : ""}`);
  }
  return noul;
}

/** Plain reason string for force-through warnings. */
export function jevErrorReason(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
