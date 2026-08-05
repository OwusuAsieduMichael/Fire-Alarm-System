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
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-surface-elevated/40 px-3 py-2.5">
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function DevicePanel({ device, loading }: DevicePanelProps) {
  const live = useDeviceStore((s) => s.live);
  const online = live.status === "ONLINE" || device?.status === "ONLINE";

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const lastSeen = device?.lastSeen || live.lastSeen;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">Device Status</CardTitle>
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
        <Row
          icon={Wifi}
          label="Wi‑Fi SSID"
          value={device?.wifiSsid || "—"}
        />
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
