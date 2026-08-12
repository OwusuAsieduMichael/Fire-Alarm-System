"use client";

import {
  Activity,
  BellRing,
  CircleStop,
  Flame,
  Siren,
  Volume2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusPill } from "@/components/shared/status-pill";
import { Card, CardContent } from "@/components/ui/card";
import { ControlActionCard } from "@/features/controls/control-action-card";
import {
  useEmergency,
  useResetAlarm,
  useTestAlarm,
} from "@/hooks/use-controls";
import { useDevices } from "@/hooks/use-sensors";
import { useDeviceStore } from "@/stores/device-store";
import { cn } from "@/lib/utils";

export default function ControlsPage() {
  useDevices();
  const live = useDeviceStore((s) => s.live);
  const teamLedStatus = useDeviceStore((s) => s.teamLedStatus);
  const testAlarm = useTestAlarm();
  const resetAlarm = useResetAlarm();
  const emergency = useEmergency();

  const alertOn = live.alarmActive || teamLedStatus === "red";
  const flameOn = live.flameDetected || teamLedStatus === "red";
  const smokeElevated =
    teamLedStatus === "red" || live.smokeLevel > (live.realDeviceConnected ? 300 : 60);
  const buzzerOn = live.buzzerActive || teamLedStatus === "red";

  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        eyebrow="Actions"
        title="Controls"
        description="Monitor flame, smoke, and buzzer status. Reset returns everything to normal until a new team message arrives."
        actions={
          <StatusPill
            label={alertOn ? "Alarm active" : "System calm"}
            tone={alertOn ? "alarm" : "safe"}
            pulse={false}
          />
        }
      />

      <section aria-label="Actuator status" className="space-y-3">
        <div>
          <p className="metric-label">Status</p>
          <h2 className="section-title mt-1">Flame · Smoke · Buzzer</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <StatusIconCard
            title="Flame"
            icon={Flame}
            active={flameOn}
            activeLabel="Detected"
            idleLabel="Clear"
            activeClass="border-ember/35 bg-ember/10 text-ember"
          />
          <StatusIconCard
            title="Smoke"
            icon={Activity}
            active={smokeElevated}
            activeLabel={`${Math.round(live.smokeLevel)} ppm`}
            idleLabel={`${Math.round(live.smokeLevel)} ppm`}
            activeClass="border-warning/40 bg-warning/10 text-warning"
          />
          <StatusIconCard
            title="Buzzer"
            icon={Volume2}
            active={buzzerOn}
            activeLabel="Active"
            idleLabel="Idle"
            activeClass="border-ember/35 bg-ember/10 text-ember"
          />
        </div>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Reset System clears flame, smoke, and buzzer together with the LED and
          LCD.
        </p>
      </section>

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
          description="Clear flame, smoke, and buzzer indicators and restore the safe LCD / LED state until a new team message arrives."
          icon={CircleStop}
          tone="calm"
          confirmTitle="Reset everything to normal?"
          confirmDescription="Clears flame, smoke, and buzzer status, silences the alert, and restores Fire Alarm Sys with S:60 F:1000. Alerts return only when someone sends a new team message."
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
      </div>
    </div>
  );
}

function StatusIconCard({
  title,
  icon: Icon,
  active,
  activeLabel,
  idleLabel,
  activeClass,
}: {
  title: string;
  icon: typeof Flame;
  active: boolean;
  activeLabel: string;
  idleLabel: string;
  activeClass: string;
}) {
  return (
    <Card
      className={cn(
        "border-border/70 transition-colors",
        active && activeClass
      )}
    >
      <CardContent className="flex flex-col items-center gap-2.5 px-3 py-4 text-center sm:gap-3 sm:py-5">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl border sm:h-14 sm:w-14",
            active
              ? "border-current/30 bg-current/10"
              : "border-border/70 bg-muted/60 text-muted-foreground"
          )}
        >
          <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">{title}</p>
          <p
            className={cn(
              "mt-0.5 text-xs",
              active ? "font-medium" : "text-muted-foreground"
            )}
          >
            {active ? activeLabel : idleLabel}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
