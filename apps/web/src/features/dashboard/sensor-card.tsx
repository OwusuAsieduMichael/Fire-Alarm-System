"use client";

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
  className,
  featured,
}: SensorCardProps) {
  return (
    <div className={cn(featured && "col-span-2 sm:col-span-1", className)}>
      <Card className={cn("h-full", toneBorder[statusTone])}>
        <CardContent className="flex h-full flex-col gap-3 p-3.5 sm:gap-5 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-0.5">
              <p className="metric-label truncate">{title}</p>
              {statusLabel ? (
                <p
                  className={cn(
                    "text-[11px] font-semibold sm:text-[12px]",
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
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 sm:rounded-[14px]",
                toneIcon[statusTone]
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            </div>
          </div>

          {value !== undefined && value !== null ? (
            <LiveValue
              value={value}
              decimals={decimals}
              unit={unit}
              className="text-[1.45rem] font-semibold tracking-[-0.03em] sm:text-[1.85rem]"
            />
          ) : (
            <span className="text-[1.45rem] font-semibold tracking-[-0.03em] sm:text-[1.85rem]">
              {statusLabel}
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
