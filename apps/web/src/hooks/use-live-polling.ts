"use client";

import { useEffect } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useDeviceStore } from "@/stores/device-store";
import type { Alert, LiveDeviceState, SmokeHistoryPoint } from "@/types";

interface LivePayload {
  live: LiveDeviceState & { deviceKey?: string };
  recentAlerts: Alert[];
  smokeHistory: SmokeHistoryPoint[];
}

/**
 * Polls `/api/live` every 2s — Vercel-compatible replacement for Socket.IO.
 */
export function useLivePolling(enabled = true) {
  const token = useAuthStore((s) => s.token);
  const setConnectionStatus = useDeviceStore((s) => s.setConnectionStatus);
  const applyLiveReading = useDeviceStore((s) => s.applyLiveReading);
  const setRecentAlerts = useDeviceStore((s) => s.setRecentAlerts);
  const setSmokeHistory = useDeviceStore((s) => s.setSmokeHistory);
  const pushSocketLog = useDeviceStore((s) => s.pushSocketLog);

  useEffect(() => {
    if (!enabled || !token) {
      setConnectionStatus("disconnected");
      return;
    }

    let cancelled = false;
    setConnectionStatus("connecting");

    const poll = async () => {
      try {
        const data = await apiClient.get<LivePayload>("/live");
        if (cancelled) return;
        applyLiveReading({
          deviceId: data.live.deviceId,
          smokeLevel: data.live.smokeLevel,
          flameDetected: data.live.flameDetected,
          temperature: data.live.temperature,
          humidity: data.live.humidity,
          buzzerActive: data.live.buzzerActive,
          ledStatus: data.live.ledStatus,
          alarmActive: data.live.alarmActive,
          lcdMessage: data.live.lcdMessage,
          status: data.live.status,
          lastSeen: data.live.lastSeen,
          realDeviceConnected: data.live.realDeviceConnected,
        });
        setRecentAlerts(data.recentAlerts);
        if (data.smokeHistory?.length) {
          setSmokeHistory(data.smokeHistory);
        }
        setConnectionStatus("connected");
      } catch {
        if (!cancelled) {
          setConnectionStatus("error");
          pushSocketLog("Live poll failed — retrying");
        }
      }
    };

    void poll();
    const timer = setInterval(() => void poll(), 2000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [
    enabled,
    token,
    setConnectionStatus,
    applyLiveReading,
    setRecentAlerts,
    setSmokeHistory,
    pushSocketLog,
  ]);
}
