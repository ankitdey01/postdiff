"use client";

// Adapted from https://coss.com/ui/r/accordion.json (MIT).
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "./utils";

export function Accordion(props: AccordionPrimitive.Root.Props) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

export function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={cn("border-b border-line last:border-b-0 data-open:bg-lime/[0.04]", className)} {...props} />;
}

export function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  return <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger data-slot="accordion-trigger" className={cn("flex min-h-16 flex-1 cursor-pointer items-center justify-between gap-5 px-5 py-5 text-left font-medium outline-none transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:text-volt focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none data-panel-open:*:data-[slot=accordion-indicator]:rotate-180", className)} {...props}>
      {children}
      <ChevronDown aria-hidden="true" data-slot="accordion-indicator" className="size-4 shrink-0 text-muted-foreground transition-transform duration-[var(--duration-normal)] ease-[var(--ease-smooth-out)] motion-reduce:transition-none" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>;
}

export function AccordionPanel({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
  return <AccordionPrimitive.Panel data-slot="accordion-panel" className="h-(--accordion-panel-height) overflow-hidden text-muted-foreground transition-[height] duration-[var(--duration-normal)] ease-[var(--ease-smooth-out)] data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none" {...props}>
    <div className={cn("px-5 pb-6", className)}>{children}</div>
  </AccordionPrimitive.Panel>;
}
