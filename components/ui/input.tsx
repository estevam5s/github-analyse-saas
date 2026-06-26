import * as React from "react";

import { cn } from "@/lib/utils";

/** DESIGN.md text-input: surface-soft bg, hairline border; focus → canvas bg, ink border. */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "h-10 w-full rounded-sm border border-hairline bg-surface-soft px-3 text-body-md text-ink outline-none transition-colors",
        "placeholder:text-stone focus:border-ink focus:bg-canvas disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
