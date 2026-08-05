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

  const smokeTone =
    live.smokeLevel > (selected?.smokeThreshold ?? 300)
      ? "alarm"
      : live.smokeLevel > (selected?.smokeThreshold ?? 300) * 0.7
        ? "warning"
        : "safe";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Live overview of fire status, sensors, and recent alerts."
        actions={<ConnectionBadge />}
      />

      <StatusHero />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SensorCard
          title="Smoke Level"
          icon={Activity}
          value={live.smokeLevel}
          unit="ppm"
          statusLabel={smokeTone === "alarm" ? "Elevated" : "Nominal"}
          statusTone={smokeTone}
          index={0}
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

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <SmokeChart threshold={selected?.smokeThreshold ?? 300} />
        </div>
        <div className="xl:col-span-2">
          <RecentAlerts />
        </div>
      </div>
    </div>
  );
}
