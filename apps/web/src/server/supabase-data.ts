import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";
import type {
  Alert,
  ConnectionLog,
  Device,
  LiveDeviceState,
  SensorReading,
  SmokeHistoryPoint,
} from "@/types";

type DeviceRow = Database["public"]["Tables"]["devices"]["Row"];
type ReadingRow = Database["public"]["Tables"]["sensor_readings"]["Row"];
type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];
type LogRow = Database["public"]["Tables"]["connection_logs"]["Row"];

const STALE_MS = 15_000;

export function mapDevice(row: DeviceRow, counts?: { alerts?: number; readings?: number }): Device {
  return {
    id: row.id,
    name: row.name,
    deviceKey: row.device_key,
    status: row.status,
    wifiSsid: row.wifi_ssid,
    ipAddress: row.ip_address,
    firmwareVersion: row.firmware_version,
    lastSeen: row.last_seen,
    smokeThreshold: row.smoke_threshold,
    smokeCalibration: row.smoke_calibration,
    ownerId: row.owner_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    _count: counts
      ? {
          alerts: counts.alerts,
          sensorReadings: counts.readings,
        }
      : undefined,
  };
}

export function mapReading(row: ReadingRow): SensorReading {
  return {
    id: row.id,
    deviceId: row.device_id,
    smokeLevel: row.smoke_level,
    flameDetected: row.flame_detected,
    temperature: row.temperature,
    humidity: row.humidity,
    buzzerActive: row.buzzer_active,
    ledStatus: row.led_status,
    alarmActive: row.alarm_active,
    lcdMessage: row.lcd_message,
    createdAt: row.created_at,
  };
}

export function mapAlert(row: AlertRow, deviceName?: string): Alert {
  return {
    id: row.id,
    deviceId: row.device_id,
    type: row.type,
    severity: row.severity,
    title: row.title,
    message: row.message,
    smsStatus: row.sms_status,
    acknowledged: row.acknowledged,
    createdAt: row.created_at,
    device: deviceName ? { id: row.device_id, name: deviceName } : undefined,
  };
}

export function mapLog(row: LogRow): ConnectionLog {
  return {
    id: row.id,
    deviceId: row.device_id,
    event: row.event,
    message: row.message,
    createdAt: row.created_at,
  };
}

export function offlineLive(device?: Device | null): LiveDeviceState {
  return {
    deviceId: device?.id ?? null,
    smokeLevel: 60,
    flameLevel: 1000,
    flameDetected: false,
    temperature: null,
    humidity: null,
    buzzerActive: false,
    ledStatus: "off",
    alarmActive: false,
    lcdMessage: device ? "Waiting for ESP32…" : "No device registered",
    status: "OFFLINE",
    lastSeen: device?.lastSeen ?? null,
    realDeviceConnected: false,
  };
}

export function isFresh(lastSeen: string | null | undefined) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < STALE_MS;
}

/** User-scoped client (RLS). */
export function userDb(accessToken: string) {
  return createSupabaseServerClient(accessToken);
}

/** Privileged client for ESP32 ingest / command queue. */
export function adminDb() {
  if (!isSupabaseConfigured()) return null;
  return createSupabaseAdminClient();
}

export function readingToLive(
  device: Device,
  reading: SensorReading | null
): LiveDeviceState {
  const connected = isFresh(device.lastSeen) || isFresh(reading?.createdAt);
  if (!reading) {
    return {
      ...offlineLive(device),
      status: connected ? "ONLINE" : "OFFLINE",
      lastSeen: device.lastSeen ?? null,
      realDeviceConnected: connected,
      lcdMessage: connected ? "Monitoring…" : "Waiting for ESP32…",
    };
  }

  return {
    deviceId: device.id,
    smokeLevel: reading.smokeLevel,
    flameLevel: reading.flameDetected ? 1000 : 0,
    flameDetected: reading.flameDetected,
    temperature: reading.temperature ?? null,
    humidity: reading.humidity ?? null,
    buzzerActive: reading.buzzerActive,
    ledStatus: reading.ledStatus,
    alarmActive: reading.alarmActive,
    lcdMessage:
      reading.lcdMessage || (connected ? "Monitoring…" : "Waiting for ESP32…"),
    status: connected ? "ONLINE" : "OFFLINE",
    lastSeen: reading.createdAt,
    realDeviceConnected: connected,
  };
}

export function toHistory(rows: ReadingRow[]): SmokeHistoryPoint[] {
  return [...rows]
    .reverse()
    .map((r) => ({
      timestamp: r.created_at,
      smokeLevel: r.smoke_level,
      temperature: r.temperature,
      humidity: r.humidity,
    }));
}
