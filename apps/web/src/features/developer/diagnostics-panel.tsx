"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/shared/status-pill";
import { LiveValue } from "@/components/shared/live-value";
import type { Device } from "@/types";
import { useDeviceStore } from "@/stores/device-store";

interface DiagnosticsPanelProps {
  device: Device | null;
}

export function DiagnosticsPanel({ device }: DiagnosticsPanelProps) {
  const live = useDeviceStore((s) => s.live);
  const connectionStatus = useDeviceStore((s) => s.connectionStatus);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-border/55">
        <CardHeader className="pb-3">
          <p className="metric-label">Runtime</p>
          <CardTitle className="mt-1.5 text-lg">ESP32 diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Row
            label="Realtime socket"
            value={
              <StatusPill
                label={connectionStatus}
                tone={
                  connectionStatus === "connected"
                    ? "safe"
                    : connectionStatus === "error"
                      ? "alarm"
                      : "warning"
                }
                pulse={connectionStatus === "connected"}
              />
            }
          />
          <Row
            label="Device link"
            value={
              <StatusPill
                label={live.status}
                tone={live.status === "ONLINE" ? "safe" : "offline"}
              />
            }
          />
          <Row
            label="Real ESP32"
            value={live.realDeviceConnected ? "Connected" : "Simulator"}
          />
          <Row
            label="Last seen"
            value={
              live.lastSeen ? new Date(live.lastSeen).toLocaleString() : "—"
            }
          />
          <Row
            label="Smoke (live)"
            value={
              <LiveValue value={live.smokeLevel} decimals={0} unit="ppm" />
            }
          />
          <Row
            label="Flame"
            value={live.flameDetected ? "DETECTED" : "Clear"}
          />
        </CardContent>
      </Card>

      <Card className="border-border/55">
        <CardHeader className="pb-3">
          <p className="metric-label">Identity</p>
          <CardTitle className="mt-1.5 text-lg">Device information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Row label="Name" value={device?.name ?? "—"} />
          <Row label="Key" value={device?.deviceKey ?? "—"} mono />
          <Row label="Firmware" value={device?.firmwareVersion ?? "—"} mono />
          <Row label="WiFi" value={device?.wifiSsid ?? "—"} />
          <Row label="IP" value={device?.ipAddress ?? "—"} mono />
          <Row
            label="Threshold"
            value={`${device?.smokeThreshold ?? "—"} ppm`}
          />
          <Row
            label="Calibration"
            value={`${device?.smokeCalibration ?? 0}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/40">
      <span className="text-muted-foreground">{label}</span>
      <div
        className={`truncate text-right font-medium ${mono ? "font-mono text-xs sm:text-sm" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
