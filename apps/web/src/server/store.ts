import type {
  AlertRecord,
  ConnectionLogRecord,
  DeviceRecord,
  LiveState,
  SensorReadingRecord,
  UserRecord,
} from "./types";

/**
 * Legacy in-memory store — kept only for optional local JWT fallback.
 * No simulator. No invented telemetry. Empty by default.
 */
interface AppStore {
  users: UserRecord[];
  devices: DeviceRecord[];
  readings: SensorReadingRecord[];
  alerts: AlertRecord[];
  logs: ConnectionLogRecord[];
  live: LiveState;
  tick: number;
  lastSimAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __fireguardStore: AppStore | undefined;
}

function createStore(): AppStore {
  return {
    users: [],
    devices: [],
    readings: [],
    alerts: [],
    logs: [],
    live: {
      deviceId: "",
      deviceKey: "",
      smokeLevel: 0,
      flameDetected: false,
      temperature: 0,
      humidity: 0,
      buzzerActive: false,
      ledStatus: "off",
      alarmActive: false,
      lcdMessage: "Waiting for ESP32…",
      status: "OFFLINE",
      lastSeen: "",
      realDeviceConnected: false,
    },
    tick: 0,
    lastSimAt: 0,
  };
}

export function getStore(): AppStore {
  if (!globalThis.__fireguardStore) {
    globalThis.__fireguardStore = createStore();
  }
  return globalThis.__fireguardStore;
}

/** @deprecated Simulator removed — returns current offline/empty live state. */
export function tickSimulator(_force = false) {
  return getStore().live;
}
