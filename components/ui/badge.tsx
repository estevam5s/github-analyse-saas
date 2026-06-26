import * as React from "react";

import { cn } from "@/lib/utils";

/** DESIGN.md badge: dark chip (surface-dark) ou outline hairline. caption-md. */
export function Badge({
  className,
  variant = "outline",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "dark" | "outline" | "soft" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[12px] font-medium leading-tight",
        variant === "dark" && "bg-surface-dark text-canvas",
        variant === "outline" && "border border-hairline-strong text-mute",
        variant === "soft" && "bg-surface-card text-charcoal",
        className,
      )}
      {...props}
    />
  );
}
