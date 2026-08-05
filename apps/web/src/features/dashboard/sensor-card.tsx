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
}

const toneBorder: Record<string, string> = {
  safe: "border-success/20",
  alarm: "border-ember/30",
  warning: "border-warning/30",
  info: "border-border/80",
};

const toneIcon: Record<string, string> = {
  safe: "bg-success/10 text-success",
  alarm: "bg-ember/10 text-ember",
  warning: "bg-warning/10 text-warning",
  info: "bg-muted text-muted-foreground",
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
}: SensorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
    >
      <Card
        className={cn(
          "h-full transition-shadow hover:shadow-elevated",
          toneBorder[statusTone],
          className
        )}
      >
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {title}
              </p>
              {statusLabel ? (
                <p
                  className={cn(
                    "mt-1 text-xs font-semibold",
                    statusTone === "safe" && "text-success",
                    statusTone === "alarm" && "text-ember",
                    statusTone === "warning" && "text-warning",
                    statusTone === "info" && "text-muted-foreground"
                  )}
                >
                  {statusLabel}
                </p>
              ) : null}
            </div>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                toneIcon[statusTone]
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          {value !== undefined ? (
            <LiveValue value={value} decimals={decimals} unit={unit} />
          ) : (
            <span className="text-2xl font-semibold tracking-tight">
              {statusLabel}
            </span>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
