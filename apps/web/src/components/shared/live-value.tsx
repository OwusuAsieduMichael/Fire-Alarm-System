"use client";

import { cn, formatSensorValue } from "@/lib/utils";

interface LiveValueProps {
  value: number | null | undefined;
  decimals?: number;
  unit?: string;
  className?: string;
  unitClassName?: string;
}

/** Instant numeric display — no spring motion. */
export function LiveValue({
  value,
  decimals = 1,
  unit,
  className,
  unitClassName,
}: LiveValueProps) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <span className={cn("sensor-value text-muted-foreground", className)}>
        —
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      <span className="sensor-value">
        {formatSensorValue(value, decimals)}
      </span>
      {unit ? (
        <span
          className={cn(
            "text-sm font-medium text-muted-foreground",
            unitClassName
          )}
        >
          {unit}
        </span>
      ) : null}
    </span>
  );
}
