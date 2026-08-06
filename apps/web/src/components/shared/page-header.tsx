import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  eyebrow?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  eyebrow,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="space-y-2">
        {eyebrow ? <p className="metric-label">{eyebrow}</p> : null}
        <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[2.25rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
