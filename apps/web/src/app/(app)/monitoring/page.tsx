"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ConnectionBadge } from "@/components/shared/connection-badge";
import { LcdDisplay } from "@/features/monitoring/lcd-display";
import { BuzzerVisual } from "@/features/monitoring/buzzer-visual";
import { LedPanel } from "@/features/monitoring/led-panel";
import { DevicePanel } from "@/features/monitoring/device-panel";
import { SmokeChart } from "@/features/dashboard/smoke-chart";
import { useDevices, useSensorHistory } from "@/hooks/use-sensors";
import { useDeviceStore, selectSelectedDevice } from "@/stores/device-store";

export default function MonitoringPage() {
  const selected = useDeviceStore(selectSelectedDevice);

  useDevices();
  useSensorHistory(selected?.id, 80);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Monitoring"
        description="Hardware simulation, actuator state, and device health."
        actions={<ConnectionBadge />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <LcdDisplay />
        <DevicePanel device={selected} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BuzzerVisual />
        <LedPanel />
      </div>

      <SmokeChart threshold={selected?.smokeThreshold ?? 300} />
    </div>
  );
}
