"use client";

import { motion } from "framer-motion";
import { Flame, Radio, Wind } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className={cn(
          "overflow-hidden border-border/70 shadow-elevated",
          isAlarm && "border-ember/40 shadow-glow"
        )}
      >
        <CardContent className="p-0">
          <div
            className={cn(
              "relative grid gap-4 p-5 sm:grid-cols-3 sm:p-6",
              isAlarm
                ? "bg-gradient-to-br from-ember/15 via-card to-card"
                : "bg-gradient-to-br from-success/10 via-card to-card"
            )}
          >
            <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Fire Status
                </span>
                <Flame
                  className={cn(
                    "h-4 w-4",
                    isAlarm ? "text-ember" : "text-success"
                  )}
                />
              </div>
              <StatusPill
                label={isAlarm ? "ALARM" : "SAFE"}
                tone={isAlarm ? "alarm" : "safe"}
                pulse={isAlarm}
              />
              <p className="text-sm text-muted-foreground">
                {isAlarm
                  ? "Immediate attention required"
                  : "All sensors within safe range"}
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  ESP32
                </span>
                <Radio className="h-4 w-4 text-muted-foreground" />
              </div>
              <StatusPill
                label={online ? "ONLINE" : "OFFLINE"}
                tone={online ? "safe" : "offline"}
                pulse={online}
              />
              <div className="flex items-center gap-2">
                <ConnectionBadge status={connectionStatus} />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Smoke Level
                </span>
                <Wind className="h-4 w-4 text-muted-foreground" />
              </div>
              <LiveValue
                value={live.smokeLevel}
                unit="ppm"
                decimals={0}
                className="text-2xl font-semibold tracking-tight"
              />
              <div
                className="h-2 overflow-hidden rounded-full bg-muted"
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
        </CardContent>
      </Card>
    </motion.div>
  );
}
