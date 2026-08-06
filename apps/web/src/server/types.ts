export type Role = "USER" | "DEVELOPER";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  theme: string;
  phone: string | null;
}

export interface DeviceRecord {
  id: string;
  name: string;
  deviceKey: string;
  status: "ONLINE" | "OFFLINE";
  wifiSsid: string | null;
  ipAddress: string | null;
  firmwareVersion: string | null;
  lastSeen: string | null;
  smokeThreshold: number;
  smokeCalibration: number;
  createdAt: string;
}

export interface SensorReadingRecord {
  id: string;
  deviceId: string;
  smokeLevel: number;
  flameDetected: boolean;
  temperature: number | null;
  humidity: number | null;
  buzzerActive: boolean;
  ledStatus: string;
  alarmActive: boolean;
  lcdMessage: string | null;
  createdAt: string;
}

export interface AlertRecord {
  id: string;
  deviceId: string;
  type: "FIRE" | "SMOKE" | "SYSTEM" | "SMS";
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  smsStatus: "PENDING" | "SENT" | "FAILED" | "NONE";
  acknowledged: boolean;
  createdAt: string;
}

export interface ConnectionLogRecord {
  id: string;
  deviceId: string;
  event: string;
  message: string;
  createdAt: string;
}

export interface LiveState {
  deviceId: string;
  deviceKey: string;
  smokeLevel: number;
  flameDetected: boolean;
  temperature: number;
  humidity: number;
  buzzerActive: boolean;
  ledStatus: string;
  alarmActive: boolean;
  lcdMessage: string;
  status: "ONLINE" | "OFFLINE";
  lastSeen: string;
  realDeviceConnected: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  theme: string;
  phone: string | null;
}
