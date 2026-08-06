"use client";

import { cn } from "@/lib/utils";

interface HamburgerButtonProps {
  open: boolean;
  onClick: () => void;
  className?: string;
}

/** Home-style hamburger that morphs into an X when open. */
export function HamburgerButton({
  open,
  onClick,
  className,
}: HamburgerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground",
        className
      )}
    >
      <span className="relative block h-3.5 w-[18px]" aria-hidden="true">
        <span
          className={cn(
            "absolute left-0 top-0 h-[1.5px] w-full rounded-full bg-current transition-transform duration-200",
            open && "top-[6px] rotate-45"
          )}
        />
        <span
          className={cn(
            "absolute left-0 top-[6px] h-[1.5px] w-full rounded-full bg-current transition-opacity duration-150",
            open && "opacity-0"
          )}
        />
        <span
          className={cn(
            "absolute left-0 top-[12px] h-[1.5px] w-full rounded-full bg-current transition-transform duration-200",
            open && "top-[6px] -rotate-45"
          )}
        />
      </span>
    </button>
  );
}
