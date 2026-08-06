import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[12px] border border-black/[0.08] bg-card px-3.5 py-2 text-[14px] shadow-sm transition-all placeholder:text-muted-foreground/65 focus-visible:border-info/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.1]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
