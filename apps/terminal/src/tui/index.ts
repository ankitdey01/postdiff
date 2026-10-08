// TUI entry slot — ships inside the `postdiff` npm package (apps/terminal).
// Bare `postdiff` (no subcommand, TTY) will land here; see router.ts
// runProgram() default action. Engine imports only via @postdiff/core.
export const TUI_STATUS = "stub" as const;

export async function runTui(): Promise<void> {
  throw new Error("TUI not implemented yet — showing help instead.");
}
