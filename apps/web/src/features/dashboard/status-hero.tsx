"use client";

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
    <section
      className={cn(
        "overflow-hidden rounded-[1.15rem] border border-border/70 bg-card shadow-soft sm:rounded-[1.35rem] sm:shadow-elevated",
        isAlarm && "border-ember/35"
      )}
      aria-label="System status overview"
    >
      <div
        className={cn(
          "px-4 py-4 sm:px-7 sm:py-6",
          isAlarm
            ? "bg-gradient-to-br from-ember/[0.09] via-card to-card"
            : "bg-gradient-to-br from-success/[0.07] via-card to-card"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="metric-label">Building status</p>
            <h2 className="text-[1.45rem] font-semibold tracking-[-0.03em] sm:text-[1.9rem]">
              {isAlarm ? "Attention required" : "All clear"}
            </h2>
            <p className="max-w-md text-[13px] leading-relaxed text-muted-foreground sm:text-[14px]">
              {isAlarm
                ? "A fire or smoke condition needs immediate review."
                : "Sensors and device health are within normal range."}
            </p>
          </div>
          <StatusPill
            label={isAlarm ? "ALARM" : "SAFE"}
            tone={isAlarm ? "alarm" : "safe"}
            pulse={false}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-border/60">
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
              className="text-[1.15rem] font-semibold tracking-tight sm:text-[1.45rem]"
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
              <div
                className={cn(
                  "h-full rounded-full",
                  smokePct > 70
                    ? "bg-ember"
                    : smokePct > 40
                      ? "bg-warning"
                      : "bg-success"
                )}
                style={{ width: `${smokePct}%` }}
              />
            </div>
          }
        />
      </div>
    </section>
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
    <div className="flex flex-col gap-2 bg-card px-2.5 py-3.5 sm:gap-3 sm:px-6 sm:py-5">
      <div className="flex items-center justify-between gap-1">
        <span className="metric-label truncate">{label}</span>
        {icon}
      </div>
      {valueNode ?? (
        <p className="text-[1.15rem] font-semibold tracking-tight sm:text-[1.45rem]">
          {value}
        </p>
      )}
      {hintNode ?? (
        <p className="line-clamp-2 text-[11px] text-muted-foreground sm:text-[13px]">
          {hint}
        </p>
      )}
    </div>
  );
}
