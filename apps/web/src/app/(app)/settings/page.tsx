"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/shared/status-pill";
import { ThemeSettings } from "@/features/settings/theme-settings";
import { ThresholdControl } from "@/features/settings/threshold-control";
import { useDevices } from "@/hooks/use-sensors";
import { useUpdateDeviceSettings } from "@/hooks/use-settings";
import { useAuthStore } from "@/stores/auth-store";
import { useDeviceStore, selectSelectedDevice } from "@/stores/device-store";

export default function SettingsPage() {
  useDevices();
  const user = useAuthStore((s) => s.user);
  const canWrite = user?.role === "DEVELOPER";
  const selected = useDeviceStore(selectSelectedDevice);
  const live = useDeviceStore((s) => s.live);
  const updateDevice = useUpdateDeviceSettings();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Appearance, thresholds, calibration, and device configuration."
      />

      <ThemeSettings />

      <ThresholdControl
        smokeThreshold={selected?.smokeThreshold ?? 300}
        smokeCalibration={selected?.smokeCalibration ?? 0}
        canWrite={canWrite}
        loading={updateDevice.isPending}
        onSave={(values) => {
          if (!selected?.id) return;
          updateDevice.mutate({ deviceId: selected.id, ...values });
        }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <p className="metric-label">Network</p>
            <CardTitle className="mt-1.5">Wi‑Fi status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="SSID" value={selected?.wifiSsid ?? "—"} />
            <Row label="IP Address" value={selected?.ipAddress ?? "—"} mono />
            <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5">
              <span className="text-muted-foreground">Link</span>
              <StatusPill
                label={live.status}
                tone={live.status === "ONLINE" ? "safe" : "offline"}
                pulse={live.status === "ONLINE"}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <p className="metric-label">System</p>
            <CardTitle className="mt-1.5">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Device" value={selected?.name ?? "—"} />
            <Row
              label="Firmware"
              value={selected?.firmwareVersion ?? "—"}
              mono
            />
            <Row label="Device key" value={selected?.deviceKey ?? "—"} mono />
            <Row
              label="Write access"
              value={canWrite ? "Developer" : "Read-only"}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/40">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`truncate font-medium ${mono ? "font-mono text-xs sm:text-sm" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
