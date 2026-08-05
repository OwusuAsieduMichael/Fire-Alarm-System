import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("shimmer-bg rounded-2xl", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
