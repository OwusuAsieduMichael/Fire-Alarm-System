"use client";

import { useEffect, useRef } from "react";
import { resolveTeamAlertState } from "@/lib/team-alert-sim";
import { useDeviceStore } from "@/stores/device-store";

/**
 * Keeps live sensors, LCD values, and the smoke trend chart aligned with
 * the shared team LED / message alert timeline.
 */
export function useTeamAlertSim() {
  const teamLedStatus = useDeviceStore((s) => s.teamLedStatus);
  const teamLedUpdatedAt = useDeviceStore((s) => s.teamLedUpdatedAt);
  const lastPhaseRef = useRef<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const state = useDeviceStore.getState();
      const snap = resolveTeamAlertState(
        state.teamLedStatus,
        state.teamLedUpdatedAt,
        Date.now()
      );

      // Drive presentation sensors from the team alert sim whenever the
      // shared LED is red, or when no ESP32 is streaming yet.
      const driveSim =
        state.teamLedStatus === "red" || !state.live.realDeviceConnected;

      if (!driveSim) {
        lastPhaseRef.current = snap.phase;
        return;
      }

      state.applyLiveReading({
        smokeLevel: snap.smoke,
        flameLevel: snap.flame,
        flameDetected: snap.flameDetected,
        alarmActive: snap.alarmActive,
        buzzerActive: snap.alarmActive,
        ledStatus: state.teamLedStatus === "red" ? "red" : "green",
        lcdMessage: snap.lcdLine1,
      });

      if (state.teamLedStatus === "red") {
        state.pushSmokePoint({
          timestamp: new Date().toISOString(),
          smokeLevel: snap.smoke,
          temperature: state.live.temperature,
          humidity: state.live.humidity,
        });
      } else if (lastPhaseRef.current !== "safe") {
        // Just returned to safe — seed a calm baseline trend.
        const now = Date.now();
        state.setSmokeHistory(
          Array.from({ length: 12 }, (_, i) => ({
            timestamp: new Date(now - (11 - i) * 5000).toISOString(),
            smokeLevel: snap.smoke,
            temperature: state.live.temperature,
            humidity: state.live.humidity,
          }))
        );
      } else if (state.smokeHistory.length === 0) {
        state.pushSmokePoint({
          timestamp: new Date().toISOString(),
          smokeLevel: snap.smoke,
        });
      }

      lastPhaseRef.current = snap.phase;
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [teamLedStatus, teamLedUpdatedAt]);
}
