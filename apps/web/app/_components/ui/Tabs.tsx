"use client";

// Adapted from https://coss.com/ui/r/tabs.json and segmented-control.json (MIT).
// Active surfaces replace the moving indicator for instant keyboard feedback.
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "./utils";

export function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-6", className)} {...props} />;
}

export function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cn("relative flex w-fit items-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground data-[orientation=vertical]:flex-col", className)} {...props} />;
}

export function TabsTab({ className, ...props }: TabsPrimitive.Tab.Props) {
  return <TabsPrimitive.Tab data-slot="tabs-tab" className={cn("relative flex min-h-10 shrink-0 grow cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium outline-none transition-[color,background-color,box-shadow] duration-[var(--duration-normal)] ease-[var(--ease-smooth-out)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-active:bg-input data-active:text-foreground data-active:shadow-sm data-disabled:pointer-events-none data-disabled:opacity-50 motion-reduce:transition-none data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start", className)} {...props} />;
}

export function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel data-slot="tabs-content" className={cn("min-w-0 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />;
}
