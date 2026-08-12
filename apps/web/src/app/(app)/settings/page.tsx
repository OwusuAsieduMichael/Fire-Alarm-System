"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/shared/status-pill";
import { RegisterDeviceCard } from "@/features/settings/register-device-card";
import { ThemeSettings } from "@/features/settings/theme-settings";
import { ThresholdControl } from "@/features/settings/threshold-control";
import { useDevices } from "@/hooks/use-sensors";
import { useUpdateDeviceSettings } from "@/hooks/use-settings";
import { useAuthStore } from "@/stores/auth-store";
import { useDeviceStore, selectSelectedDevice } from "@/stores/device-store";

export default function SettingsPage() {
  useDevices();
  const user = useAuthStore((s) => s.user);
  const selected = useDeviceStore(selectSelectedDevice);
  const live = useDeviceStore((s) => s.live);
  const updateDevice = useUpdateDeviceSettings();
  const canWrite =
    user?.role === "DEVELOPER" ||
    Boolean(user?.id && selected?.ownerId && selected.ownerId === user.id);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Adjust smoke and flame thresholds used by the LCD and live sensors."
      />

      <ThemeSettings />

      <RegisterDeviceCard />

      <ThresholdControl
        smokeThreshold={selected?.smokeThreshold ?? 60}
        flameThreshold={selected?.flameThreshold ?? 1000}
        canWrite={canWrite}
        loading={updateDevice.isPending}
        onSave={(values) => {
          if (!selected?.id) return;
          updateDevice.mutate({ deviceId: selected.id, ...values });
        }}
      />

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
