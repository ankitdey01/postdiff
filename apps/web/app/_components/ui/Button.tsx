"use client";

// Adapted from https://coss.com/ui/r/button.json (MIT).
// Retains COSS composition/loading semantics; Postdiff uses filled variants only.
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./utils";

export const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium outline-none transition-[background-color,color,box-shadow,transform] duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-loading:select-none data-loading:text-transparent motion-safe:enabled:active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    defaultVariants: { size: "md", variant: "quiet" },
    variants: {
      size: { sm: "h-9 px-3 text-xs", md: "h-11 px-4 text-sm", lg: "h-12 px-5 text-sm" },
      variant: {
        primary: "bg-primary text-primary-foreground shadow-[inset_0_1px_0_#ffffff30,0_2px_4px_#0003] hover:bg-volt active:shadow-none",
        quiet: "bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_#ffffff0d,0_2px_4px_#0002] hover:bg-accent active:shadow-none",
        command: "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
      },
    },
  },
);

type ButtonProps = useRender.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & {
  leading?: ReactNode;
  loading?: boolean;
};

export function Button({
  variant,
  size,
  leading,
  children,
  className,
  render,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return useRender({
    defaultTagName: "button",
    render,
    props: mergeProps<"button">({
      className: cn(buttonVariants({ variant, size, className })),
      "aria-disabled": loading || undefined,
      disabled: Boolean(loading || disabled),
      type: render ? undefined : "button",
      children: <>
        {leading && <span aria-hidden="true">{leading}</span>}
        {children}
        {loading && <Loader2 aria-label="Loading" role="status" className="absolute animate-spin text-foreground motion-reduce:animate-none" />}
      </>,
    }, props),
  });
}
