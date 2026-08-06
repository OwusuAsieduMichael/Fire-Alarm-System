"use client";

import { useEffect, useState } from "react";
import { useSpring, useTransform } from "framer-motion";
import { cn, formatSensorValue } from "@/lib/utils";

interface LiveValueProps {
  value: number | null | undefined;
  decimals?: number;
  unit?: string;
  className?: string;
  unitClassName?: string;
}

/** Smooth number spring — no remount bounce. */
export function LiveValue({
  value,
  decimals = 1,
  unit,
  className,
  unitClassName,
}: LiveValueProps) {
  const safe = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  const spring = useSpring(safe, { stiffness: 140, damping: 22, mass: 0.45 });
  const display = useTransform(spring, (latest) =>
    formatSensorValue(latest, decimals)
  );
  const [text, setText] = useState(formatSensorValue(safe, decimals));

  useEffect(() => {
    spring.set(safe);
  }, [safe, spring]);

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => setText(v));
    return unsubscribe;
  }, [display]);

  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <span className={cn("sensor-value text-muted-foreground", className)}>
        —
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      <span className="sensor-value">{text}</span>
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
