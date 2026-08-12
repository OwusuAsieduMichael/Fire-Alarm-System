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
  const teamLedStatus = useDeviceStore((s) => s.teamLedStatus);
  const testAlarm = useTestAlarm();
  const resetAlarm = useResetAlarm();
  const emergency = useEmergency();
  const buzzer = useBuzzerControl();

  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        eyebrow="Actions"
        title="Controls"
        description="Send confirmed commands to the ESP32. Every action asks for confirmation."
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusPill
              label={
                live.alarmActive || teamLedStatus === "red"
                  ? "Alarm active"
                  : "System calm"
              }
              tone={
                live.alarmActive || teamLedStatus === "red" ? "alarm" : "safe"
              }
              pulse={false}
            />
            <StatusPill
              label={
                live.buzzerActive || teamLedStatus === "red"
                  ? "Buzzer on"
                  : "Buzzer off"
              }
              tone={
                live.buzzerActive || teamLedStatus === "red"
                  ? "warning"
                  : "neutral"
              }
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        <ControlActionCard
          title="Test Alarm"
          description="Run a controlled alarm test with buzzer and LED feedback."
          icon={BellRing}
          tone="warning"
          confirmTitle="Run test alarm?"
          confirmDescription="This will activate the buzzer and red LED for a system test."
          confirmLabel="Start test"
          loading={testAlarm.isPending}
          onConfirm={async () => {
            await testAlarm.mutateAsync();
          }}
          index={0}
        />
        <ControlActionCard
          title="Reset System"
          description="Return LED, LCD, buzzer, and live sensors to the normal safe state until a new team message arrives."
          icon={CircleStop}
          tone="calm"
          confirmTitle="Reset everything to normal?"
          confirmDescription="Clears the shared red alert, silences the buzzer, and restores Fire Alarm Sys with S:60 F:1000. Alerts return only when someone sends a new team message."
          confirmLabel="Reset now"
          loading={resetAlarm.isPending}
          onConfirm={async () => {
            await resetAlarm.mutateAsync();
          }}
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
          onConfirm={async () => {
            await emergency.mutateAsync();
          }}
          index={2}
        />
        <ControlActionCard
          title="Buzzer On"
          description="Enable the buzzer without changing the alarm state."
          icon={Volume2}
          tone="neutral"
          confirmLabel="Turn on"
          loading={buzzer.isPending && buzzer.variables?.on === true}
          onConfirm={async () => {
            await buzzer.mutateAsync({ on: true });
          }}
          index={3}
        />
        <ControlActionCard
          title="Buzzer Off"
          description="Silence the buzzer while preserving sensor monitoring."
          icon={VolumeX}
          tone="neutral"
          confirmLabel="Turn off"
          loading={buzzer.isPending && buzzer.variables?.on === false}
          onConfirm={async () => {
            await buzzer.mutateAsync({ on: false });
          }}
          index={4}
        />
      </div>
    </div>
  );
}
