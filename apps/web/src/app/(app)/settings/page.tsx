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
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Thresholds, calibration, theme, and system configuration."
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
            <CardTitle className="text-base">WiFi Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="SSID" value={selected?.wifiSsid ?? "—"} />
            <Row label="IP Address" value={selected?.ipAddress ?? "—"} />
            <div className="flex items-center justify-between gap-3">
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
            <CardTitle className="text-base">System Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Device" value={selected?.name ?? "—"} />
            <Row label="Firmware" value={selected?.firmwareVersion ?? "—"} />
            <Row label="Device key" value={selected?.deviceKey ?? "—"} />
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium font-mono text-xs sm:text-sm">
        {value}
      </span>
    </div>
  );
}
