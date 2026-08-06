"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LiveValue } from "@/components/shared/live-value";
import { cn } from "@/lib/utils";

interface SensorCardProps {
  title: string;
  icon: LucideIcon;
  value?: number | null;
  decimals?: number;
  unit?: string;
  statusLabel?: string;
  statusTone?: "safe" | "alarm" | "warning" | "info";
  index?: number;
  className?: string;
  featured?: boolean;
}

const toneRing: Record<string, string> = {
  safe: "hover:border-success/25",
  alarm: "border-ember/25 hover:border-ember/40",
  warning: "hover:border-warning/30",
  info: "hover:border-border",
};

const toneIcon: Record<string, string> = {
  safe: "bg-success/10 text-success",
  alarm: "bg-ember/10 text-ember",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

export function SensorCard({
  title,
  icon: Icon,
  value,
  decimals = 0,
  unit,
  statusLabel,
  statusTone = "info",
  index = 0,
  className,
  featured,
}: SensorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(featured && "sm:col-span-2 xl:col-span-1", className)}
    >
      <Card
        className={cn(
          "group h-full border-border/55 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated",
          toneRing[statusTone]
        )}
      >
        <CardContent className="flex h-full flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <p className="metric-label">{title}</p>
              {statusLabel ? (
                <p
                  className={cn(
                    "text-xs font-semibold",
                    statusTone === "safe" && "text-success",
                    statusTone === "alarm" && "text-ember",
                    statusTone === "warning" && "text-warning",
                    statusTone === "info" && "text-info"
                  )}
                >
                  {statusLabel}
                </p>
              ) : null}
            </div>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105",
                toneIcon[statusTone]
              )}
            >
              <Icon className="h-4.5 w-4.5 h-4 w-4" aria-hidden="true" />
            </div>
          </div>

          {value !== undefined && value !== null ? (
            <LiveValue
              value={value}
              decimals={decimals}
              unit={unit}
              className="text-[1.75rem] font-semibold tracking-tight"
            />
          ) : (
            <span className="text-[1.75rem] font-semibold tracking-tight">
              {statusLabel}
            </span>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
