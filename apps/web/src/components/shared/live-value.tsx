"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn, formatSensorValue } from "@/lib/utils";

interface LiveValueProps {
  value: number | null | undefined;
  decimals?: number;
  unit?: string;
  className?: string;
  unitClassName?: string;
}

export function LiveValue({
  value,
  decimals = 1,
  unit,
  className,
  unitClassName,
}: LiveValueProps) {
  const safe = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  const spring = useSpring(safe, { stiffness: 120, damping: 20, mass: 0.4 });
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
      <motion.span
        key={Math.round(safe * 10)}
        className="sensor-value"
        initial={{ opacity: 0.45, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
      >
        {text}
      </motion.span>
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
