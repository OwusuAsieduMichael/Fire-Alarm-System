"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LiveValue } from "@/components/shared/live-value";
import { staggerChild } from "@/lib/motion";
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

const toneIcon: Record<string, string> = {
  safe: "bg-success/10 text-success",
  alarm: "bg-ember/10 text-ember",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

const toneBorder: Record<string, string> = {
  safe: "",
  alarm: "border-ember/25",
  warning: "border-warning/25",
  info: "",
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
      {...staggerChild(index)}
      className={cn(featured && "sm:col-span-2 xl:col-span-1", className)}
    >
      <Card
        interactive
        className={cn("group h-full", toneBorder[statusTone])}
      >
        <CardContent className="flex h-full flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="metric-label">{title}</p>
              {statusLabel ? (
                <p
                  className={cn(
                    "text-[12px] font-semibold",
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
                "flex h-10 w-10 items-center justify-center rounded-[14px] transition-transform duration-300 group-hover:scale-[1.04]",
                toneIcon[statusTone]
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>

          {value !== undefined && value !== null ? (
            <LiveValue
              value={value}
              decimals={decimals}
              unit={unit}
              className="text-[1.85rem] font-semibold tracking-[-0.03em]"
            />
          ) : (
            <span className="text-[1.85rem] font-semibold tracking-[-0.03em]">
              {statusLabel}
            </span>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
