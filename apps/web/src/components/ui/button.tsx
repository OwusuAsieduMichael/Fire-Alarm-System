import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-[13px] font-semibold tracking-tight transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 lg:active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background shadow-soft hover:bg-foreground/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90",
        outline:
          "border border-border/80 bg-card text-foreground shadow-sm hover:bg-secondary hover:border-border",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-foreground/[0.06] hover:text-foreground dark:hover:bg-white/[0.06]",
        link: "text-info underline-offset-4 hover:underline",
        ember:
          "bg-ember text-ember-foreground shadow-soft hover:bg-ember/92 hover:shadow-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-[10px] px-3 text-xs",
        lg: "h-11 rounded-[14px] px-6 text-[15px]",
        icon: "h-9 w-9 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
