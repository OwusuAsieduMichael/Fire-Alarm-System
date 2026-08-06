import { adminDb, mapDevice, isFresh } from "./supabase-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { LiveDeviceState } from "@/types";

type DeviceRow = Database["public"]["Tables"]["devices"]["Row"];

export type ControlAction =
  | "test-alarm"
  | "reset-alarm"
  | "emergency"
  | "buzzer-on"
  | "buzzer-off";

export type TelemetryInput = {
  deviceKey: string;
  smokeLevel: number;
  flameDetected?: boolean;
  temperature?: number | null;
  humidity?: number | null;
  buzzerActive?: boolean;
  ledStatus?: string;
  alarmActive?: boolean;
  lcdMessage?: string | null;
  wifiSsid?: string | null;
  ipAddress?: string | null;
  firmwareVersion?: string | null;
};

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Ingest ESP32 telemetry into Supabase.
 * Requires SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
 */
export async function ingestTelemetry(input: TelemetryInput) {
  const db = adminDb();
  if (!db) {
    return {
      ok: false as const,
      status: 503,
      message:
        "ESP32 ingest requires SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local",
    };
  }

  const key = input.deviceKey.trim();
  const { data: deviceRow, error: deviceError } = await db
    .from("devices")
    .select("*")
    .eq("device_key", key)
    .maybeSingle();

  if (deviceError) {
    return { ok: false as const, status: 500, message: deviceError.message };
  }
  if (!deviceRow) {
    return {
      ok: false as const,
      status: 404,
      message: `Unknown device key: ${key}`,
    };
  }

  const now = new Date().toISOString();
  const flame = Boolean(input.flameDetected);
  const smoke = Number(input.smokeLevel) || 0;
  const threshold = deviceRow.smoke_threshold;
  const alarmFromSensors = flame || smoke > threshold;
  const alarmActive = Boolean(input.alarmActive) || alarmFromSensors;
  const buzzerActive =
    input.buzzerActive !== undefined
      ? Boolean(input.buzzerActive)
      : alarmActive;
  const ledStatus =
    input.ledStatus ||
    (alarmActive ? "red" : "green");
  const lcdMessage =
    input.lcdMessage ||
    (flame
      ? "FIRE DETECTED!"
      : alarmActive
        ? "SMOKE ALERT!"
        : "Monitoring...");

  const { data: reading, error: readingError } = await db
    .from("sensor_readings")
    .insert({
      device_id: deviceRow.id,
      smoke_level: smoke + (deviceRow.smoke_calibration || 0),
      flame_detected: flame,
      temperature: input.temperature ?? null,
      humidity: input.humidity ?? null,
      buzzer_active: buzzerActive,
      led_status: ledStatus,
      alarm_active: alarmActive,
      lcd_message: lcdMessage,
    })
    .select("*")
    .single();

  if (readingError) {
    return { ok: false as const, status: 500, message: readingError.message };
  }

  await db
    .from("devices")
    .update({
      status: "ONLINE",
      last_seen: now,
      wifi_ssid: input.wifiSsid ?? deviceRow.wifi_ssid,
      ip_address: input.ipAddress ?? deviceRow.ip_address,
      firmware_version:
        input.firmwareVersion ?? deviceRow.firmware_version,
    })
    .eq("id", deviceRow.id);

  await db.from("connection_logs").insert({
    device_id: deviceRow.id,
    event: "telemetry",
    message: `Telemetry smoke=${smoke.toFixed(0)} flame=${flame}`,
  });

  // Create alerts (dedupe within 30s)
  const recentCutoff = new Date(Date.now() - 30_000).toISOString();
  if (flame) {
    const { data: recent } = await db
      .from("alerts")
      .select("id")
      .eq("device_id", deviceRow.id)
      .eq("type", "FIRE")
      .gte("created_at", recentCutoff)
      .limit(1);
    if (!recent?.length) {
      await db.from("alerts").insert({
        device_id: deviceRow.id,
        type: "FIRE",
        severity: "CRITICAL",
        title: "Fire Detected",
        message: `Flame sensor triggered on ${deviceRow.name}`,
        sms_status: "PENDING",
        acknowledged: false,
      });
    }
  } else if (smoke > threshold) {
    const { data: recent } = await db
      .from("alerts")
      .select("id")
      .eq("device_id", deviceRow.id)
      .eq("type", "SMOKE")
      .gte("created_at", recentCutoff)
      .limit(1);
    if (!recent?.length) {
      await db.from("alerts").insert({
        device_id: deviceRow.id,
        type: "SMOKE",
        severity: "WARNING",
        title: "Smoke Threshold Exceeded",
        message: `Smoke level ${smoke.toFixed(0)} exceeded threshold ${threshold}`,
        sms_status: "NONE",
        acknowledged: false,
      });
    }
  }

  const device = mapDevice({ ...deviceRow, status: "ONLINE", last_seen: now });
  const live: LiveDeviceState = {
    deviceId: device.id,
    smokeLevel: reading.smoke_level,
    flameDetected: reading.flame_detected,
    temperature: reading.temperature ?? null,
    humidity: reading.humidity ?? null,
    buzzerActive: reading.buzzer_active,
    ledStatus: reading.led_status,
    alarmActive: reading.alarm_active,
    lcdMessage: reading.lcd_message ?? "Monitoring...",
    status: "ONLINE",
    lastSeen: reading.created_at,
    realDeviceConnected: true,
  };

  return {
    ok: true as const,
    deviceId: device.id,
    deviceKey: key,
    live,
    readingId: reading.id,
  };
}

/** Queue a control command for the ESP32 to poll. */
export async function enqueueControl(
  action: ControlAction,
  deviceId?: string,
  access?: { userId: string; accessToken: string | null }
) {
  const db = adminDb();
  if (!db) {
    return {
      ok: false as const,
      status: 503,
      message:
        "Controls require SUPABASE_SERVICE_ROLE_KEY until the ESP32 command path is fully online.",
    };
  }

  // Prefer the caller's selected device; never grab an unrelated admin row.
  let deviceRow: DeviceRow | null = null;

  if (deviceId) {
    const { data: devices, error } = await db
      .from("devices")
      .select("*")
      .eq("id", deviceId)
      .limit(1);
    if (error) {
      return { ok: false as const, status: 500, message: error.message };
    }
    deviceRow = devices?.[0] ?? null;
  } else if (access?.userId && access.accessToken) {
    const userClient = createSupabaseServerClient(access.accessToken);
    if (userClient) {
      const { data: owned, error } = await userClient
        .from("devices")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1);
      if (error) {
        return { ok: false as const, status: 500, message: error.message };
      }
      deviceRow = owned?.[0] ?? null;
    }
  }

  if (!deviceRow) {
    return {
      ok: false as const,
      status: 404,
      message: "No device registered. Open the app once to auto-create one, then flash your ESP32.",
    };
  }

  // Enforce account isolation when a user JWT is present
  if (access?.userId && access.accessToken) {
    const userClient = createSupabaseServerClient(access.accessToken);
    if (userClient) {
      const { data: allowed } = await userClient
        .from("devices")
        .select("id")
        .eq("id", deviceRow.id)
        .maybeSingle();
      if (!allowed) {
        return {
          ok: false as const,
          status: 403,
          message: "You do not have access to this device.",
        };
      }
    }
  }

  const { data: cmd, error: cmdError } = await db
    .from("device_commands")
    .insert({
      device_id: deviceRow.id,
      action,
    })
    .select("*")
    .single();

  if (cmdError) {
    // Table may not exist yet — fall back to connection log only
    await db.from("connection_logs").insert({
      device_id: deviceRow.id,
      event: "control",
      message: `Control requested: ${action} (queue unavailable: ${cmdError.message})`,
    });
    return {
      ok: true as const,
      queued: false,
      action,
      deviceId: deviceRow.id,
      message:
        "Control logged. Run supabase/patch-device-commands.sql so the ESP32 can poll commands.",
    };
  }

  await db.from("alerts").insert({
    device_id: deviceRow.id,
    type: action === "emergency" ? "FIRE" : "SYSTEM",
    severity: action === "emergency" ? "CRITICAL" : "INFO",
    title:
      action === "test-alarm"
        ? "Test Alarm"
        : action === "emergency"
          ? "Emergency Activated"
          : action === "reset-alarm"
            ? "Alarm Reset"
            : "Buzzer Control",
    message: `Control ${action} queued for ${deviceRow.name}`,
    sms_status: action === "emergency" ? "PENDING" : "NONE",
    acknowledged: false,
  });

  await db.from("connection_logs").insert({
    device_id: deviceRow.id,
    event: "control",
    message: `Control queued: ${action}`,
  });

  return {
    ok: true as const,
    queued: true,
    action,
    deviceId: deviceRow.id,
    commandId: cmd.id,
    waitingForDevice: !isFresh(deviceRow.last_seen),
  };
}

/** ESP32 polls pending commands by device key. */
export async function pullCommands(deviceKey: string) {
  const db = adminDb();
  if (!db) {
    return {
      ok: false as const,
      status: 503,
      message: "SUPABASE_SERVICE_ROLE_KEY required",
    };
  }

  const { data: device } = await db
    .from("devices")
    .select("id")
    .eq("device_key", deviceKey.trim())
    .maybeSingle();

  if (!device) {
    return { ok: false as const, status: 404, message: "Unknown device key" };
  }

  const { data: commands, error } = await db
    .from("device_commands")
    .select("*")
    .eq("device_id", device.id)
    .eq("consumed", false)
    .order("created_at", { ascending: true })
    .limit(10);

  if (error) {
    return { ok: false as const, status: 500, message: error.message };
  }

  const ids = (commands || []).map((c) => c.id);
  if (ids.length) {
    await db
      .from("device_commands")
      .update({ consumed: true })
      .in("id", ids);
  }

  return {
    ok: true as const,
    commands: (commands || []).map((c) => ({
      id: c.id,
      action: c.action,
      createdAt: c.created_at,
    })),
  };
}

export function newLocalId(prefix: string) {
  return id(prefix);
}
