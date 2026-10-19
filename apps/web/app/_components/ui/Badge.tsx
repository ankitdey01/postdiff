"use client";

// Adapted from https://coss.com/ui/r/badge.json (MIT); themed semantic variants.
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const badgeVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3 [&_svg]:shrink-0",
  { variants: { variant: {
    success: "bg-mint/10 text-mint", muted: "bg-secondary text-muted-foreground", danger: "bg-traffic-red/10 text-traffic-red",
  } }, defaultVariants: { variant: "muted" } },
);

export function Badge({
  variant, className, render, ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span", render,
    props: mergeProps<"span">({ className: cn(badgeVariants({ variant, className })) }, props),
  });
}
