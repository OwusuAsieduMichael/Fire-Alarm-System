"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeviceStore } from "@/stores/device-store";
import { cn } from "@/lib/utils";

type LedColor = "red" | "green" | "amber" | "off";

function normalizeLed(status: string): LedColor {
  const s = status.toLowerCase();
  if (s.includes("red") || s === "alarm") return "red";
  if (s.includes("green") || s === "ok" || s === "safe") return "green";
  if (s.includes("amber") || s.includes("yellow") || s.includes("warn")) {
    return "amber";
  }
  if (s === "off" || s === "none") return "off";
  return "off";
}

const ledMeta: Record<
  LedColor,
  { label: string; ring: string; fill: string; glow: string }
> = {
  red: {
    label: "Red · Alarm",
    ring: "border-red-500/40",
    fill: "bg-red-500",
    glow: "shadow-[0_0_24px_rgba(239,68,68,0.55)]",
  },
  green: {
    label: "Green · Safe",
    ring: "border-emerald-500/40",
    fill: "bg-emerald-500",
    glow: "shadow-[0_0_24px_rgba(16,185,129,0.45)]",
  },
  amber: {
    label: "Amber · Warning",
    ring: "border-amber-400/40",
    fill: "bg-amber-400",
    glow: "shadow-[0_0_24px_rgba(251,191,36,0.5)]",
  },
  off: {
    label: "Off",
    ring: "border-border",
    fill: "bg-muted-foreground/30",
    glow: "",
  },
};

export function LedPanel() {
  const ledStatus = useDeviceStore((s) => s.live.ledStatus);
  const active = normalizeLed(ledStatus);

  return (
    <Card className="border-border/55">
      <CardHeader className="pb-3">
        <p className="metric-label">Indicator</p>
        <CardTitle className="mt-1.5 text-lg">LED status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {(["red", "amber", "green"] as LedColor[]).map((color) => {
            const on = active === color;
            const meta = ledMeta[color];
            return (
              <div
                key={color}
                className={cn(
                  "flex flex-col items-center gap-2.5 rounded-2xl border border-border/55 bg-surface-elevated/50 p-4 transition-colors",
                  on && "bg-muted/40"
                )}
              >
                <motion.div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border-2",
                    meta.ring
                  )}
                  animate={on ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                  transition={{ duration: 1.2, repeat: on ? Infinity : 0 }}
                >
                  <span
                    className={cn(
                      "h-7 w-7 rounded-full transition-all",
                      meta.fill,
                      on ? meta.glow : "opacity-35"
                    )}
                    aria-hidden="true"
                  />
                </motion.div>
                <span className="text-xs font-medium capitalize text-muted-foreground">
                  {color}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-sm font-semibold tracking-tight">
          {ledMeta[active].label}
        </p>
      </CardContent>
    </Card>
  );
}
