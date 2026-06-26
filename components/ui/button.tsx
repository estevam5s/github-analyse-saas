import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * DESIGN.md — button-md (16px/500, line-height 2), rounded-sm (4px).
 * primary: ink fill / cream text; secondary: cream fill / hairline-strong border.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium leading-loose transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-ink text-canvas hover:bg-ink-deep active:bg-ink-deep",
        secondary: "bg-canvas text-ink border border-hairline-strong hover:bg-surface-soft",
        ghost: "bg-transparent text-ink hover:bg-surface-card",
        danger: "bg-danger text-canvas hover:bg-danger-hover",
        link: "text-ink underline underline-offset-4 hover:text-charcoal",
      },
      size: {
        sm: "h-8 px-3 text-[14px]",
        md: "h-9 px-5 text-[16px]",
        lg: "h-11 px-7 text-[16px]",
        icon: "h-9 w-9 px-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
