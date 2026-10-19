// Adapted from https://coss.com/ui/r/frame.json (MIT).
import type { ComponentProps } from "react";
import { cn } from "./utils";

export function Frame({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="frame" className={cn("relative flex flex-col rounded-xl bg-muted p-1.5 *:[[data-slot=frame-panel]+[data-slot=frame-panel]]:mt-1", className)} {...props} />;
}

export function FramePanel({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="frame-panel" className={cn("relative rounded-lg bg-background bg-clip-padding p-5 shadow-[0_1px_4px_#0004,inset_0_1px_0_#ffffff08]", className)} {...props} />;
}

export function FrameHeader({ className, ...props }: ComponentProps<"header">) {
  return <header data-slot="frame-panel-header" className={cn("flex flex-col px-5 py-4", className)} {...props} />;
}

export function FrameFooter({ className, ...props }: ComponentProps<"footer">) {
  return <footer data-slot="frame-panel-footer" className={cn("px-5 py-4", className)} {...props} />;
}
