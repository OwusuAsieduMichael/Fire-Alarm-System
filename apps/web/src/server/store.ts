import { seedPasswordHash } from "./auth";
import type {
  AlertRecord,
  ConnectionLogRecord,
  DeviceRecord,
  LiveState,
  SensorReadingRecord,
  UserRecord,
} from "./types";

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

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createStore(): AppStore {
  const deviceId = "dev_main_hall";
  const now = new Date().toISOString();
  const password = seedPasswordHash("FireGuard@2026");

  const device: DeviceRecord = {
    id: deviceId,
    name: "Main Hall Sensor",
    deviceKey: "FG-ESP32-DEMO-001",
    status: "ONLINE",
    wifiSsid: "FireGuard-Net",
    ipAddress: "192.168.1.50",
    firmwareVersion: "1.0.0",
    lastSeen: now,
    smokeThreshold: 300,
    smokeCalibration: 0,
    createdAt: now,
  };

  return {
    users: [
      {
        id: "user_developer",
        email: "developer@fireguard.io",
        passwordHash: password,
        name: "FireGuard Developer",
        role: "DEVELOPER",
        theme: "dark",
        phone: "+10000000001",
      },
      {
        id: "user_user",
        email: "user@fireguard.io",
        passwordHash: password,
        name: "FireGuard User",
        role: "USER",
        theme: "dark",
        phone: "+10000000002",
      },
    ],
    devices: [device],
    readings: [],
    alerts: [
      {
        id: id("alert"),
        deviceId,
        type: "SYSTEM",
        severity: "INFO",
        title: "System Online",
        message: "FireGuard cloud simulator is ready.",
        smsStatus: "NONE",
        acknowledged: true,
        createdAt: now,
      },
    ],
    logs: [
      {
        id: id("log"),
        deviceId,
        event: "boot",
        message: "Vercel in-memory simulator started",
        createdAt: now,
      },
    ],
    live: {
      deviceId,
      deviceKey: device.deviceKey,
      smokeLevel: 85,
      flameDetected: false,
      temperature: 24.2,
      humidity: 46,
      buzzerActive: false,
      ledStatus: "green",
      alarmActive: false,
      lcdMessage: "System Ready",
      status: "ONLINE",
      lastSeen: now,
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

export function publicUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    theme: user.theme,
    phone: user.phone,
  };
}

function maybeAlert(store: AppStore, device: DeviceRecord, live: LiveState) {
  const recentCutoff = Date.now() - 30_000;
  const hasRecent = (type: AlertRecord["type"]) =>
    store.alerts.some(
      (a) =>
        a.deviceId === device.id &&
        a.type === type &&
        new Date(a.createdAt).getTime() > recentCutoff
    );

  if (live.flameDetected && !hasRecent("FIRE")) {
    store.alerts.unshift({
      id: id("alert"),
      deviceId: device.id,
      type: "FIRE",
      severity: "CRITICAL",
      title: "Fire Detected",
      message: `Flame sensor triggered on ${device.name}`,
      smsStatus: "PENDING",
      acknowledged: false,
      createdAt: new Date().toISOString(),
    });
  } else if (live.smokeLevel > device.smokeThreshold && !hasRecent("SMOKE")) {
    store.alerts.unshift({
      id: id("alert"),
      deviceId: device.id,
      type: "SMOKE",
      severity: "WARNING",
      title: "Smoke Threshold Exceeded",
      message: `Smoke level ${live.smokeLevel.toFixed(0)} exceeded threshold ${device.smokeThreshold}`,
      smsStatus: "NONE",
      acknowledged: false,
      createdAt: new Date().toISOString(),
    });
  }

  store.alerts = store.alerts.slice(0, 100);
}

/** Advance simulator ~every 2s (called from API handlers). */
export function tickSimulator(force = false) {
  const store = getStore();
  const now = Date.now();
  if (!force && now - store.lastSimAt < 2000) {
    return store.live;
  }

  store.lastSimAt = now;
  store.tick += 1;

  const device = store.devices[0];
  if (!device) return store.live;

  const live = store.live;
  if (live.realDeviceConnected) {
    return live;
  }

  const base = 90 + Math.sin(store.tick / 8) * 40;
  const noise = (Math.random() - 0.5) * 30;
  let smokeLevel = Math.max(20, base + noise);
  if (Math.random() < 0.05) {
    smokeLevel = device.smokeThreshold + 50 + Math.random() * 100;
  }
  const flameDetected = Math.random() < 0.015;
  const temperature = 22 + Math.sin(store.tick / 20) * 3 + Math.random();
  const humidity = 40 + Math.cos(store.tick / 15) * 8 + Math.random() * 2;

  if (!live.alarmActive) {
    live.ledStatus = "green";
    live.buzzerActive = false;
    live.lcdMessage = "Monitoring...";
  }

  live.smokeLevel = Math.max(0, smokeLevel + device.smokeCalibration);
  live.flameDetected = flameDetected;
  live.temperature = Number(temperature.toFixed(1));
  live.humidity = Number(humidity.toFixed(1));
  live.status = "ONLINE";
  live.lastSeen = new Date().toISOString();
  device.status = "ONLINE";
  device.lastSeen = live.lastSeen;

  if (live.smokeLevel > device.smokeThreshold || flameDetected) {
    live.alarmActive = true;
    live.buzzerActive = true;
    live.ledStatus = "red";
    live.lcdMessage = flameDetected ? "FIRE DETECTED!" : "SMOKE ALERT!";
  }

  if (store.tick % 5 === 0 || live.alarmActive) {
    store.readings.unshift({
      id: id("read"),
      deviceId: device.id,
      smokeLevel: live.smokeLevel,
      flameDetected: live.flameDetected,
      temperature: live.temperature,
      humidity: live.humidity,
      buzzerActive: live.buzzerActive,
      ledStatus: live.ledStatus,
      alarmActive: live.alarmActive,
      lcdMessage: live.lcdMessage,
      createdAt: live.lastSeen,
    });
    store.readings = store.readings.slice(0, 120);
  }

  maybeAlert(store, device, live);
  return live;
}

export function applyControl(
  action: "test-alarm" | "reset-alarm" | "emergency" | "buzzer-on" | "buzzer-off"
) {
  const store = getStore();
  const device = store.devices[0];
  const live = store.live;

  switch (action) {
    case "test-alarm":
      live.alarmActive = true;
      live.buzzerActive = true;
      live.ledStatus = "red";
      live.lcdMessage = "TEST ALARM";
      store.alerts.unshift({
        id: id("alert"),
        deviceId: device.id,
        type: "SYSTEM",
        severity: "INFO",
        title: "Test Alarm",
        message: `Test alarm issued for ${device.name}`,
        smsStatus: "NONE",
        acknowledged: false,
        createdAt: new Date().toISOString(),
      });
      break;
    case "reset-alarm":
      live.alarmActive = false;
      live.buzzerActive = false;
      live.flameDetected = false;
      live.ledStatus = "green";
      live.lcdMessage = "System Ready";
      break;
    case "emergency":
      live.alarmActive = true;
      live.buzzerActive = true;
      live.ledStatus = "red";
      live.lcdMessage = "EMERGENCY!";
      store.alerts.unshift({
        id: id("alert"),
        deviceId: device.id,
        type: "FIRE",
        severity: "CRITICAL",
        title: "Emergency Activated",
        message: `Emergency issued for ${device.name}`,
        smsStatus: "PENDING",
        acknowledged: false,
        createdAt: new Date().toISOString(),
      });
      break;
    case "buzzer-on":
      live.buzzerActive = true;
      live.lcdMessage = "BUZZER ON";
      break;
    case "buzzer-off":
      live.buzzerActive = false;
      if (!live.alarmActive) live.ledStatus = "green";
      live.lcdMessage = "BUZZER OFF";
      break;
  }

  live.lastSeen = new Date().toISOString();
  store.logs.unshift({
    id: id("log"),
    deviceId: device.id,
    event: "control",
    message: `Control ${action}`,
    createdAt: live.lastSeen,
  });
  store.logs = store.logs.slice(0, 100);

  return { success: true, action, deviceId: device.id, state: live };
}
