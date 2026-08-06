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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "overflow-hidden rounded-[1.35rem] border border-border/55 bg-card shadow-elevated",
        isAlarm && "border-ember/35 shadow-glow"
      )}
      aria-label="System status overview"
    >
      <div
        className={cn(
          "border-b border-border/50 px-5 py-4 sm:px-6",
          isAlarm
            ? "bg-gradient-to-r from-ember/12 via-card to-card"
            : "bg-gradient-to-r from-success/10 via-card to-card"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="metric-label">Operations overview</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">
              {isAlarm ? "Attention required" : "All systems nominal"}
            </p>
          </div>
          <StatusPill
            label={isAlarm ? "ALARM" : "SAFE"}
            tone={isAlarm ? "alarm" : "safe"}
            pulse
            className="text-xs"
          />
        </div>
      </div>

      <div className="grid gap-px bg-border/40 sm:grid-cols-3">
        <div className="flex flex-col gap-3 bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="metric-label">Fire status</span>
            <Flame
              className={cn(
                "h-4 w-4",
                isAlarm ? "text-ember" : "text-success"
              )}
            />
          </div>
          <p className="text-2xl font-semibold tracking-tight">
            {isAlarm ? "Alarm" : "Safe"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isAlarm
              ? "Immediate attention required"
              : "Sensors within safe range"}
          </p>
        </div>

        <div className="flex flex-col gap-3 bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="metric-label">ESP32</span>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold tracking-tight">
            {online ? "Online" : "Offline"}
          </p>
          <ConnectionBadge status={connectionStatus} />
        </div>

        <div className="flex flex-col gap-3 bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="metric-label">Smoke level</span>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </div>
          <LiveValue
            value={live.smokeLevel}
            unit="ppm"
            decimals={0}
            className="text-2xl font-semibold tracking-tight"
          />
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
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
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
