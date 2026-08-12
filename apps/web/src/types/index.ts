export type UserRole = "USER" | "DEVELOPER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  theme?: string;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type DeviceStatus = "ONLINE" | "OFFLINE";

export interface Device {
  id: string;
  name: string;
  deviceKey: string;
  status: DeviceStatus;
  wifiSsid?: string | null;
  ipAddress?: string | null;
  firmwareVersion?: string | null;
  lastSeen?: string | null;
  smokeThreshold: number;
  smokeCalibration: number;
  ownerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  connectionLogs?: ConnectionLog[];
  _count?: {
    alerts?: number;
    sensorReadings?: number;
  };
}

export interface SensorReading {
  id: string;
  deviceId: string;
  smokeLevel: number;
  flameDetected: boolean;
  temperature?: number | null;
  humidity?: number | null;
  buzzerActive: boolean;
  ledStatus: string;
  alarmActive: boolean;
  lcdMessage?: string | null;
  createdAt: string;
  device?: Device;
}

export type AlertType = "FIRE" | "SMOKE" | "SYSTEM" | "SMS" | "TEAM";
export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type SmsStatus = "PENDING" | "SENT" | "FAILED" | "NONE";

export interface Alert {
  id: string;
  deviceId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  smsStatus: SmsStatus;
  acknowledged: boolean;
  createdAt: string;
  device?: Pick<Device, "id" | "name">;
  senderName?: string;
  senderEmail?: string;
}

export interface TeamMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  body: string;
  createdAt: string;
}

export interface ConnectionLog {
  id: string;
  deviceId: string;
  event: string;
  message: string;
  createdAt: string;
}

export type ConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "error";

export interface LiveDeviceState {
  deviceId: string | null;
  smokeLevel: number;
  flameDetected: boolean;
  temperature: number | null;
  humidity: number | null;
  buzzerActive: boolean;
  ledStatus: string;
  alarmActive: boolean;
  lcdMessage: string;
  status: DeviceStatus;
  lastSeen: string | null;
  realDeviceConnected: boolean;
}

export interface SmokeHistoryPoint {
  timestamp: string;
  smokeLevel: number;
  temperature?: number | null;
  humidity?: number | null;
}

export interface AuthLoginResponse {
  accessToken: string;
  user: User;
}

export interface SystemConfigItem {
  id: string;
  key: string;
  value: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles?: UserRole[];
}

export type ControlAction =
  | "test-alarm"
  | "reset-alarm"
  | "emergency"
  | "buzzer-on"
  | "buzzer-off";
