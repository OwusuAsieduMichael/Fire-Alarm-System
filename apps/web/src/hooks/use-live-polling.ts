"use client";

import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useDeviceStore } from "@/stores/device-store";
import type { Alert, LiveDeviceState, SmokeHistoryPoint } from "@/types";

interface LivePayload {
  live: LiveDeviceState & { deviceKey?: string };
  recentAlerts: Alert[];
  smokeHistory: SmokeHistoryPoint[];
}

const INTERVAL_ONLINE_MS = 4000;
const INTERVAL_WAITING_MS = 8000;
const INTERVAL_HIDDEN_MS = 20000;

/**
 * Adaptive live polling — slows down when offline/hidden to handle many users.
 */
export function useLivePolling(enabled = true) {
  const token = useAuthStore((s) => s.token);
  const selectedDeviceId = useDeviceStore((s) => s.selectedDeviceId);
  const setConnectionStatus = useDeviceStore((s) => s.setConnectionStatus);
  const applyLiveReading = useDeviceStore((s) => s.applyLiveReading);
  const setRecentAlerts = useDeviceStore((s) => s.setRecentAlerts);
  const setSmokeHistory = useDeviceStore((s) => s.setSmokeHistory);
  const pushSocketLog = useDeviceStore((s) => s.pushSocketLog);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onlineRef = useRef(false);

  useEffect(() => {
    if (!enabled || !token) {
      setConnectionStatus("disconnected");
      return;
    }

    let cancelled = false;
    setConnectionStatus("connecting");

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const scheduleNext = () => {
      clearTimer();
      if (cancelled) return;
      const hidden =
        typeof document !== "undefined" && document.visibilityState === "hidden";
      const delay = hidden
        ? INTERVAL_HIDDEN_MS
        : onlineRef.current
          ? INTERVAL_ONLINE_MS
          : INTERVAL_WAITING_MS;
      timerRef.current = setTimeout(() => void poll(), delay);
    };

    const poll = async () => {
      try {
        const path = selectedDeviceId
          ? `/live?deviceId=${encodeURIComponent(selectedDeviceId)}`
          : "/live";
        const data = await apiClient.get<LivePayload>(path);
        if (cancelled) return;
        onlineRef.current = Boolean(data.live.realDeviceConnected);
        const teamLed = useDeviceStore.getState().teamLedStatus;
        const teamAlertOwnsSensors = teamLed === "red";

        applyLiveReading({
          deviceId: data.live.deviceId,
          temperature: data.live.temperature,
          humidity: data.live.humidity,
          status: data.live.status,
          lastSeen: data.live.lastSeen,
          realDeviceConnected: data.live.realDeviceConnected,
          // Team message alert owns smoke/flame/actuators until Controls reset.
          ...(teamAlertOwnsSensors
            ? {}
            : {
                smokeLevel: data.live.smokeLevel,
                flameDetected: data.live.flameDetected,
                buzzerActive: data.live.buzzerActive,
                ledStatus: data.live.ledStatus,
                alarmActive: data.live.alarmActive,
                lcdMessage: data.live.lcdMessage,
              }),
        });
        setRecentAlerts(data.recentAlerts);
        if (!teamAlertOwnsSensors && data.live.realDeviceConnected) {
          setSmokeHistory(data.smokeHistory ?? []);
        }
        setConnectionStatus("connected");
      } catch {
        if (!cancelled) {
          onlineRef.current = false;
          setConnectionStatus("error");
          pushSocketLog("Live poll failed — retrying");
        }
      } finally {
        scheduleNext();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void poll();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    void poll();

    return () => {
      cancelled = true;
      clearTimer();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [
    enabled,
    token,
    selectedDeviceId,
    setConnectionStatus,
    applyLiveReading,
    setRecentAlerts,
    setSmokeHistory,
    pushSocketLog,
  ]);
}
