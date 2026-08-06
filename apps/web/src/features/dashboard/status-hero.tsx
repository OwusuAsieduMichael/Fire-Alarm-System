"use client";

import { motion } from "framer-motion";
import { Flame, Radio, Wind } from "lucide-react";
import { StatusPill } from "@/components/shared/status-pill";
import { LiveValue } from "@/components/shared/live-value";
import { ConnectionBadge } from "@/components/shared/connection-badge";
import { useDeviceStore } from "@/stores/device-store";
import { cn } from "@/lib/utils";

export function StatusHero() {
  const live = useDeviceStore((s) => s.live);
  const connectionStatus = useDeviceStore((s) => s.connectionStatus);
  const isAlarm = live.alarmActive || live.flameDetected;
  const online = live.status === "ONLINE" || connectionStatus === "connected";
  const smokePct = Math.min(100, Math.max(0, (live.smokeLevel / 1000) * 100));

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "overflow-hidden rounded-[1.5rem] border border-black/[0.04] bg-card shadow-elevated dark:border-white/[0.06]",
        isAlarm && "border-ember/30 shadow-glow"
      )}
      aria-label="System status overview"
    >
      <div
        className={cn(
          "px-6 py-5 sm:px-8 sm:py-6",
          isAlarm
            ? "bg-gradient-to-br from-ember/[0.08] via-card to-card"
            : "bg-gradient-to-br from-success/[0.07] via-card to-card"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="metric-label">Building status</p>
            <h2 className="text-[1.65rem] font-semibold tracking-[-0.03em] sm:text-[1.85rem]">
              {isAlarm ? "Attention required" : "All clear"}
            </h2>
            <p className="max-w-md text-[14px] text-muted-foreground">
              {isAlarm
                ? "A fire or smoke condition needs immediate review."
                : "Sensors and device health are within normal range."}
            </p>
          </div>
          <StatusPill
            label={isAlarm ? "ALARM" : "SAFE"}
            tone={isAlarm ? "alarm" : "safe"}
            pulse
          />
        </div>
      </div>

      <div className="grid gap-px bg-black/[0.04] dark:bg-white/[0.06] sm:grid-cols-3">
        <div className="flex flex-col gap-3.5 bg-card px-6 py-5 sm:px-7 sm:py-6">
          <div className="flex items-center justify-between">
            <span className="metric-label">Fire</span>
            <Flame
              className={cn(
                "h-4 w-4",
                isAlarm ? "text-ember" : "text-success"
              )}
            />
          </div>
          <p className="text-[1.5rem] font-semibold tracking-tight">
            {isAlarm ? "Alarm" : "Safe"}
          </p>
          <p className="text-[13px] text-muted-foreground">
            {isAlarm ? "Immediate attention" : "Within safe range"}
          </p>
        </div>

        <div className="flex flex-col gap-3.5 bg-card px-6 py-5 sm:px-7 sm:py-6">
          <div className="flex items-center justify-between">
            <span className="metric-label">Device</span>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-[1.5rem] font-semibold tracking-tight">
            {online ? "Healthy" : "Offline"}
          </p>
          <ConnectionBadge status={connectionStatus} />
        </div>

        <div className="flex flex-col gap-3.5 bg-card px-6 py-5 sm:px-7 sm:py-6">
          <div className="flex items-center justify-between">
            <span className="metric-label">Smoke</span>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </div>
          <LiveValue
            value={live.smokeLevel}
            unit="ppm"
            decimals={0}
            className="text-[1.5rem] font-semibold tracking-tight"
          />
          <div
            className="h-1.5 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={live.smokeLevel}
            aria-valuemin={0}
            aria-valuemax={1000}
            aria-label="Smoke level"
          >
            <motion.div
              className={cn(
                "h-full rounded-full",
                smokePct > 70
                  ? "bg-ember"
                  : smokePct > 40
                    ? "bg-warning"
                    : "bg-success"
              )}
              initial={false}
              animate={{ width: `${smokePct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
