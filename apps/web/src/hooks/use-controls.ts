"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { useDeviceStore } from "@/stores/device-store";

interface ControlResult {
  success?: boolean;
  action?: string;
  message?: string;
}

function resolveDeviceId(explicit?: string | null) {
  if (explicit) return explicit;
  const state = useDeviceStore.getState();
  return state.selectedDeviceId ?? state.devices[0]?.id ?? null;
}

export function useTestAlarm() {
  const queryClient = useQueryClient();
  const applyLiveReading = useDeviceStore((s) => s.applyLiveReading);
  const pushSocketLog = useDeviceStore((s) => s.pushSocketLog);

  return useMutation<ControlResult, Error, void>({
    mutationFn: async () => {
      const id = resolveDeviceId();
      if (!id) throw new Error("No device selected");
      applyLiveReading({
        alarmActive: true,
        buzzerActive: true,
        ledStatus: "red",
        lcdMessage: "TEST ALARM",
      });
      pushSocketLog(`Control: test-alarm → ${id}`);
      return apiClient.post<ControlResult>("/controls/test-alarm", {
        deviceId: id,
      });
    },
    onSuccess: () => {
      toast.success("Test alarm triggered");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to trigger test alarm");
      queryClient.invalidateQueries({ queryKey: ["sensors"] });
    },
  });
}

export function useResetAlarm() {
  const queryClient = useQueryClient();
  const applyLiveReading = useDeviceStore((s) => s.applyLiveReading);
  const setTeamLedStatus = useDeviceStore((s) => s.setTeamLedStatus);
  const setSmokeHistory = useDeviceStore((s) => s.setSmokeHistory);
  const pushSocketLog = useDeviceStore((s) => s.pushSocketLog);

  return useMutation<ControlResult, Error, void>({
    mutationFn: async () => {
      // Always clear shared team alert (LED / LCD / buzzer / sensors).
      const team = await apiClient.post<{
        ledStatus: "green" | "red" | "amber";
        ledUpdatedAt: string;
      }>("/team-status", { ledStatus: "green" });
      setTeamLedStatus(team.ledStatus || "green", team.ledUpdatedAt);
      applyLiveReading({
        alarmActive: false,
        buzzerActive: false,
        ledStatus: "green",
        flameDetected: false,
        smokeLevel: 60,
        flameLevel: 1000,
        lcdMessage: "Fire Alarm Sys",
      });
      const now = Date.now();
      setSmokeHistory(
        Array.from({ length: 12 }, (_, i) => ({
          timestamp: new Date(now - (11 - i) * 5000).toISOString(),
          smokeLevel: 60,
        }))
      );

      const id = resolveDeviceId();
      if (id) {
        pushSocketLog(`Control: reset-alarm → ${id}`);
        await apiClient.post<ControlResult>("/controls/reset-alarm", {
          deviceId: id,
        });
      } else {
        pushSocketLog("Control: system reset (team alert cleared)");
      }
      return { success: true, message: "System reset to normal" };
    },
    onSuccess: () => {
      toast.success("System reset to normal");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["team-messages"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reset system");
    },
  });
}

export function useEmergency() {
  const queryClient = useQueryClient();
  const applyLiveReading = useDeviceStore((s) => s.applyLiveReading);
  const pushSocketLog = useDeviceStore((s) => s.pushSocketLog);

  return useMutation<ControlResult, Error, void>({
    mutationFn: async () => {
      const id = resolveDeviceId();
      if (!id) throw new Error("No device selected");
      applyLiveReading({
        alarmActive: true,
        buzzerActive: true,
        ledStatus: "red",
        lcdMessage: "EMERGENCY!",
      });
      pushSocketLog(`Control: emergency → ${id}`);
      return apiClient.post<ControlResult>("/controls/emergency", {
        deviceId: id,
      });
    },
    onSuccess: () => {
      toast.error("Emergency alarm activated");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to trigger emergency");
    },
  });
}

export function useBuzzerControl() {
  const applyLiveReading = useDeviceStore((s) => s.applyLiveReading);
  const pushSocketLog = useDeviceStore((s) => s.pushSocketLog);

  return useMutation<
    ControlResult,
    Error,
    { on: boolean; deviceId?: string | null }
  >({
    mutationFn: async ({ on, deviceId }) => {
      const id = resolveDeviceId(deviceId);
      if (!id) throw new Error("No device selected");
      applyLiveReading({
        buzzerActive: on,
        lcdMessage: on ? "BUZZER ON" : "BUZZER OFF",
      });
      pushSocketLog(`Control: buzzer ${on ? "on" : "off"} → ${id}`);
      return apiClient.post<ControlResult>("/controls/buzzer", {
        deviceId: id,
        on,
      });
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.on ? "Buzzer turned on" : "Buzzer turned off");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to control buzzer");
    },
  });
}
