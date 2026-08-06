"use client";

import { create } from "zustand";
import type {
  Alert,
  ConnectionLog,
  ConnectionStatus,
  Device,
  LiveDeviceState,
  SmokeHistoryPoint,
} from "@/types";

const MAX_HISTORY = 60;
const MAX_SOCKET_LOGS = 200;

interface DeviceStore {
  devices: Device[];
  selectedDeviceId: string | null;
  live: LiveDeviceState;
  smokeHistory: SmokeHistoryPoint[];
  recentAlerts: Alert[];
  connectionLogs: ConnectionLog[];
  socketLogs: string[];
  connectionStatus: ConnectionStatus;
  setDevices: (devices: Device[]) => void;
  setSelectedDeviceId: (id: string | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  applyLiveReading: (partial: Partial<LiveDeviceState>) => void;
  applyLiveReadingWithHistory: (partial: Partial<LiveDeviceState>) => void;
  setSmokeHistory: (points: SmokeHistoryPoint[]) => void;
  pushSmokePoint: (point: SmokeHistoryPoint) => void;
  setRecentAlerts: (alerts: Alert[]) => void;
  prependAlert: (alert: Alert) => void;
  acknowledgeAlertLocal: (id: string) => void;
  setConnectionLogs: (logs: ConnectionLog[]) => void;
  pushSocketLog: (line: string) => void;
  resetLive: () => void;
}

const defaultLive: LiveDeviceState = {
  deviceId: null,
  smokeLevel: 0,
  flameDetected: false,
  temperature: null,
  humidity: null,
  buzzerActive: false,
  ledStatus: "off",
  alarmActive: false,
  lcdMessage: "Waiting for ESP32…",
  status: "OFFLINE",
  lastSeen: null,
  realDeviceConnected: false,
};

export const useDeviceStore = create<DeviceStore>((set) => ({
  devices: [],
  selectedDeviceId: null,
  live: defaultLive,
  smokeHistory: [],
  recentAlerts: [],
  connectionLogs: [],
  socketLogs: [],
  connectionStatus: "disconnected",

  setDevices: (devices) =>
    set((state) => ({
      devices,
      selectedDeviceId:
        state.selectedDeviceId ?? (devices[0]?.id ?? null),
    })),

  setSelectedDeviceId: (id) => set({ selectedDeviceId: id }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  applyLiveReading: (partial) =>
    set((state) => ({
      live: { ...state.live, ...partial },
    })),

  /** Apply live fields and optionally append a chart point (real telemetry only). */
  applyLiveReadingWithHistory: (partial: Partial<LiveDeviceState>) =>
    set((state) => {
      const next = { ...state.live, ...partial };
      if (!next.realDeviceConnected) {
        return { live: next };
      }
      const point: SmokeHistoryPoint = {
        timestamp: new Date().toISOString(),
        smokeLevel: next.smokeLevel,
        temperature: next.temperature,
        humidity: next.humidity,
      };
      return {
        live: next,
        smokeHistory: [...state.smokeHistory, point].slice(-MAX_HISTORY),
      };
    }),

  setSmokeHistory: (smokeHistory) => set({ smokeHistory }),

  pushSmokePoint: (point) =>
    set((state) => ({
      smokeHistory: [...state.smokeHistory, point].slice(-MAX_HISTORY),
    })),

  setRecentAlerts: (recentAlerts) => set({ recentAlerts }),

  prependAlert: (alert) =>
    set((state) => ({
      recentAlerts: [
        alert,
        ...state.recentAlerts.filter((a) => a.id !== alert.id),
      ].slice(0, 50),
    })),

  acknowledgeAlertLocal: (id) =>
    set((state) => ({
      recentAlerts: state.recentAlerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      ),
    })),

  setConnectionLogs: (connectionLogs) => set({ connectionLogs }),

  pushSocketLog: (line) =>
    set((state) => ({
      socketLogs: [
        ...state.socketLogs,
        `[${new Date().toLocaleTimeString()}] ${line}`,
      ].slice(-MAX_SOCKET_LOGS),
    })),

  resetLive: () =>
    set({
      live: defaultLive,
      smokeHistory: [],
    }),
}));

export function selectSelectedDevice(state: DeviceStore): Device | null {
  if (!state.selectedDeviceId) return state.devices[0] ?? null;
  return (
    state.devices.find((d) => d.id === state.selectedDeviceId) ??
    state.devices[0] ??
    null
  );
}
