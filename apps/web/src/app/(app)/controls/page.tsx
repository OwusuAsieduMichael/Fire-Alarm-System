"use client";

import {
  BellRing,
  CircleStop,
  Siren,
  Volume2,
  VolumeX,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusPill } from "@/components/shared/status-pill";
import { ControlActionCard } from "@/features/controls/control-action-card";
import {
  useBuzzerControl,
  useEmergency,
  useResetAlarm,
  useTestAlarm,
} from "@/hooks/use-controls";
import { useDevices } from "@/hooks/use-sensors";
import { useDeviceStore } from "@/stores/device-store";

export default function ControlsPage() {
  useDevices();
  const live = useDeviceStore((s) => s.live);
  const testAlarm = useTestAlarm();
  const resetAlarm = useResetAlarm();
  const emergency = useEmergency();
  const buzzer = useBuzzerControl();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controls"
        description="Send confirmed commands to the ESP32 fire alarm system."
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusPill
              label={live.alarmActive ? "Alarm active" : "System calm"}
              tone={live.alarmActive ? "alarm" : "safe"}
              pulse={live.alarmActive}
            />
            <StatusPill
              label={live.buzzerActive ? "Buzzer on" : "Buzzer off"}
              tone={live.buzzerActive ? "warning" : "neutral"}
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ControlActionCard
          title="Test Alarm"
          description="Run a controlled alarm test with buzzer and LED feedback."
          icon={BellRing}
          tone="warning"
          confirmTitle="Run test alarm?"
          confirmDescription="This will activate the buzzer and red LED for a system test."
          confirmLabel="Start test"
          loading={testAlarm.isPending}
          onConfirm={() => testAlarm.mutateAsync()}
          index={0}
        />
        <ControlActionCard
          title="Reset Alarm"
          description="Clear active alarms and return actuators to a safe idle state."
          icon={CircleStop}
          tone="calm"
          confirmTitle="Reset the alarm?"
          confirmDescription="Flame and alarm flags will be cleared on the device."
          confirmLabel="Reset now"
          loading={resetAlarm.isPending}
          onConfirm={() => resetAlarm.mutateAsync()}
          index={1}
        />
        <ControlActionCard
          title="Trigger Emergency"
          description="Manually escalate to a full emergency alarm condition."
          icon={Siren}
          tone="danger"
          confirmTitle="Trigger emergency?"
          confirmDescription="This issues a critical emergency event to the ESP32."
          confirmLabel="Trigger emergency"
          loading={emergency.isPending}
          onConfirm={() => emergency.mutateAsync()}
          index={2}
        />
        <ControlActionCard
          title="Buzzer On"
          description="Enable the buzzer without changing the alarm state."
          icon={Volume2}
          tone="neutral"
          confirmLabel="Turn on"
          loading={buzzer.isPending && buzzer.variables?.on === true}
          onConfirm={() => buzzer.mutateAsync({ on: true })}
          index={3}
        />
        <ControlActionCard
          title="Buzzer Off"
          description="Silence the buzzer while preserving sensor monitoring."
          icon={VolumeX}
          tone="neutral"
          confirmLabel="Turn off"
          loading={buzzer.isPending && buzzer.variables?.on === false}
          onConfirm={() => buzzer.mutateAsync({ on: false })}
          index={4}
        />
      </div>
    </div>
  );
}
