"use client";

import {
  Activity,
  Flame,
  Lightbulb,
  Thermometer,
  Volume2,
  Wind,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ConnectionBadge } from "@/components/shared/connection-badge";
import { StatusHero } from "@/features/dashboard/status-hero";
import { SensorCard } from "@/features/dashboard/sensor-card";
import { SmokeChart } from "@/features/dashboard/smoke-chart";
import { RecentAlerts } from "@/features/dashboard/recent-alerts";
import { useDevices, useSensorHistory } from "@/hooks/use-sensors";
import { useAlerts } from "@/hooks/use-alerts";
import { useDeviceStore, selectSelectedDevice } from "@/stores/device-store";

export default function DashboardPage() {
  const live = useDeviceStore((s) => s.live);
  const selected = useDeviceStore(selectSelectedDevice);

  useDevices();
  useSensorHistory(selected?.id, 60);
  useAlerts({ deviceId: selected?.id, limit: 20 });

  const threshold = selected?.smokeThreshold ?? 300;
  const smokeTone =
    live.smokeLevel > threshold
      ? "alarm"
      : live.smokeLevel > threshold * 0.7
        ? "warning"
        : "safe";

  return (
    <div className="space-y-9">
      <PageHeader
        title="Home"
        description="Is the building safe? What needs attention? Is the device healthy?"
        actions={<ConnectionBadge />}
      />

      <StatusHero />

      <section aria-label="Live sensors" className="space-y-4">
        <div>
          <p className="metric-label">Telemetry</p>
          <h2 className="section-title mt-1">Live sensors</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SensorCard
            title="Smoke Level"
            icon={Activity}
            value={live.smokeLevel}
            unit="ppm"
            statusLabel={smokeTone === "alarm" ? "Elevated" : "Nominal"}
            statusTone={smokeTone}
            index={0}
            featured
          />
          <SensorCard
            title="Flame Detection"
            icon={Flame}
            value={live.flameDetected ? 1 : 0}
            decimals={0}
            unit={live.flameDetected ? "DETECTED" : "CLEAR"}
            statusLabel={live.flameDetected ? "Alarm" : "Safe"}
            statusTone={live.flameDetected ? "alarm" : "safe"}
            index={1}
            featured
          />
          <SensorCard
            title="Temperature"
            icon={Thermometer}
            value={live.temperature}
            unit="°C"
            decimals={1}
            statusTone="info"
            index={2}
          />
          <SensorCard
            title="Humidity"
            icon={Wind}
            value={live.humidity}
            unit="%"
            decimals={0}
            statusTone="info"
            index={3}
          />
          <SensorCard
            title="Buzzer"
            icon={Volume2}
            value={live.buzzerActive ? 1 : 0}
            decimals={0}
            unit={live.buzzerActive ? "ON" : "OFF"}
            statusLabel={live.buzzerActive ? "Active" : "Idle"}
            statusTone={live.buzzerActive ? "warning" : "safe"}
            index={4}
          />
          <SensorCard
            title="LED Status"
            icon={Lightbulb}
            value={null}
            statusLabel={live.ledStatus.toUpperCase()}
            statusTone={
              live.ledStatus === "red"
                ? "alarm"
                : live.ledStatus === "amber"
                  ? "warning"
                  : "safe"
            }
            index={5}
          />
        </div>
      </section>

      <section
        aria-label="Trends and alerts"
        className="grid gap-4 xl:grid-cols-5"
      >
        <div className="xl:col-span-3">
          <SmokeChart threshold={threshold} />
        </div>
        <div className="xl:col-span-2">
          <RecentAlerts />
        </div>
      </section>
    </div>
  );
}
