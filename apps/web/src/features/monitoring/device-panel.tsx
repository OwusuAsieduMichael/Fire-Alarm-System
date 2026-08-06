"use client";

import { formatDistanceToNow } from "date-fns";
import { Cpu, MapPin, Signal, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/shared/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import type { Device } from "@/types";
import { useDeviceStore } from "@/stores/device-store";

interface DevicePanelProps {
  device?: Device | null;
  loading?: boolean;
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wifi;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/55 bg-surface-elevated/50 px-3.5 py-3 transition-colors hover:bg-muted/35">
      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-muted/80">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="metric-label">{label}</p>
        <p className="mt-1 truncate text-sm font-medium tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

export function DevicePanel({ device, loading }: DevicePanelProps) {
  const live = useDeviceStore((s) => s.live);
  const online = live.status === "ONLINE" || device?.status === "ONLINE";

  if (loading) {
    return (
      <Card className="border-border/55">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const lastSeen = device?.lastSeen || live.lastSeen;

  return (
    <Card className="border-border/55">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <p className="metric-label">Node</p>
          <CardTitle className="mt-1.5 text-lg">Device status</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {device?.name ?? "ESP32 Node"}
          </p>
        </div>
        <StatusPill
          label={online ? "ONLINE" : "OFFLINE"}
          tone={online ? "safe" : "offline"}
          pulse={online}
        />
      </CardHeader>
      <CardContent className="grid gap-2.5 sm:grid-cols-2">
        <Row
          icon={MapPin}
          label="IP Address"
          value={device?.ipAddress || "—"}
        />
        <Row
          icon={Cpu}
          label="Firmware"
          value={device?.firmwareVersion || "—"}
        />
        <Row icon={Wifi} label="Wi‑Fi SSID" value={device?.wifiSsid || "—"} />
        <Row
          icon={Signal}
          label="Last Seen"
          value={
            lastSeen
              ? formatDistanceToNow(new Date(lastSeen), { addSuffix: true })
              : "Never"
          }
        />
      </CardContent>
    </Card>
  );
}
