"use client";

import { motion } from "framer-motion";
import { Flame, Radio, Wind } from "lucide-react";
import { StatusPill } from "@/components/shared/status-pill";
import { LiveValue } from "@/components/shared/live-value";
import { ConnectionBadge } from "@/components/shared/connection-badge";
import { easeSpring } from "@/lib/motion";
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeSpring }}
      className={cn(
        "overflow-hidden rounded-[1.35rem] border border-border/70 bg-card shadow-elevated",
        isAlarm && "border-ember/35 shadow-glow"
      )}
      aria-label="System status overview"
    >
      <div
        className={cn(
          "px-5 py-5 sm:px-7 sm:py-6",
          isAlarm
            ? "bg-gradient-to-br from-ember/[0.09] via-card to-card"
            : "bg-gradient-to-br from-success/[0.07] via-card to-card"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="metric-label">Building status</p>
            <h2 className="text-[1.7rem] font-semibold tracking-[-0.03em] sm:text-[1.9rem]">
              {isAlarm ? "Attention required" : "All clear"}
            </h2>
            <p className="max-w-md text-[14px] leading-relaxed text-muted-foreground">
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

      <div className="grid gap-px bg-border/60 sm:grid-cols-3">
        <MetricCell
          label="Fire"
          icon={
            <Flame
              className={cn("h-4 w-4", isAlarm ? "text-ember" : "text-success")}
            />
          }
          value={isAlarm ? "Alarm" : "Safe"}
          hint={isAlarm ? "Immediate attention" : "Within safe range"}
        />
        <MetricCell
          label="Device"
          icon={<Radio className="h-4 w-4 text-muted-foreground" />}
          value={online ? "Healthy" : "Offline"}
          hintNode={<ConnectionBadge status={connectionStatus} />}
        />
        <MetricCell
          label="Smoke"
          icon={<Wind className="h-4 w-4 text-muted-foreground" />}
          valueNode={
            <LiveValue
              value={live.smokeLevel}
              unit="ppm"
              decimals={0}
              className="text-[1.45rem] font-semibold tracking-tight"
            />
          }
          hintNode={
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
                transition={{ type: "spring", stiffness: 160, damping: 24 }}
              />
            </div>
          }
        />
      </div>
    </motion.section>
  );
}

function MetricCell({
  label,
  icon,
  value,
  valueNode,
  hint,
  hintNode,
}: {
  label: string;
  icon: React.ReactNode;
  value?: string;
  valueNode?: React.ReactNode;
  hint?: string;
  hintNode?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 bg-card px-5 py-5 sm:px-6">
      <div className="flex items-center justify-between">
        <span className="metric-label">{label}</span>
        {icon}
      </div>
      {valueNode ?? (
        <p className="text-[1.45rem] font-semibold tracking-tight">{value}</p>
      )}
      {hintNode ?? (
        <p className="text-[13px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
