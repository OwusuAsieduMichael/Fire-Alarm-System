"use client";

import { useEffect, useRef } from "react";
import { resolveTeamAlertState } from "@/lib/team-alert-sim";
import { useDeviceStore, selectSelectedDevice } from "@/stores/device-store";

/**
 * Keeps live sensors, LCD values, and the smoke trend chart aligned with
 * the shared team LED / message alert timeline.
 */
export function useTeamAlertSim() {
  const teamLedStatus = useDeviceStore((s) => s.teamLedStatus);
  const teamLedUpdatedAt = useDeviceStore((s) => s.teamLedUpdatedAt);
  const selected = useDeviceStore(selectSelectedDevice);
  const smokeThreshold = selected?.smokeThreshold;
  const flameThreshold = selected?.flameThreshold;
  const lastPhaseRef = useRef<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const state = useDeviceStore.getState();
      const device = selectSelectedDevice(state);
      const snap = resolveTeamAlertState(
        state.teamLedStatus,
        state.teamLedUpdatedAt,
        Date.now(),
        {
          smoke: device?.smokeThreshold,
          flame: device?.flameThreshold,
        }
      );

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
  }, [teamLedStatus, teamLedUpdatedAt, smokeThreshold, flameThreshold]);
}
