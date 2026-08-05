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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ESP32 Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
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
              live.lastSeen
                ? new Date(live.lastSeen).toLocaleString()
                : "—"
            }
          />
          <Row
            label="Smoke (live)"
            value={<LiveValue value={live.smokeLevel} decimals={0} unit="ppm" />}
          />
          <Row
            label="Flame"
            value={live.flameDetected ? "DETECTED" : "Clear"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Device Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Name" value={device?.name ?? "—"} />
          <Row label="Key" value={device?.deviceKey ?? "—"} />
          <Row label="Firmware" value={device?.firmwareVersion ?? "—"} />
          <Row label="WiFi" value={device?.wifiSsid ?? "—"} />
          <Row label="IP" value={device?.ipAddress ?? "—"} />
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
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <div className="truncate text-right font-medium">{value}</div>
    </div>
  );
}
