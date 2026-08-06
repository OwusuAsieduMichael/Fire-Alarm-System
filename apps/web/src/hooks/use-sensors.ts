"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useDeviceStore } from "@/stores/device-store";
import type { SensorReading, SmokeHistoryPoint } from "@/types";

function toHistoryPoint(reading: SensorReading): SmokeHistoryPoint {
  return {
    timestamp: reading.createdAt,
    smokeLevel: reading.smokeLevel,
    temperature: reading.temperature,
    humidity: reading.humidity,
  };
}

export function useLatestReading(deviceId?: string | null) {
  return useQuery({
    queryKey: ["sensors", "latest", deviceId ?? "all"],
    queryFn: async () => {
      const path = deviceId
        ? `/sensors/latest?deviceId=${encodeURIComponent(deviceId)}`
        : "/sensors/latest";
      return apiClient.get<SensorReading | SensorReading[] | null>(path);
    },
    refetchInterval: 15_000,
  });
}

export function useSensorHistory(deviceId?: string | null, limit = 60) {
  const setSmokeHistory = useDeviceStore((s) => s.setSmokeHistory);

  return useQuery({
    queryKey: ["sensors", "history", deviceId, limit],
    enabled: Boolean(deviceId),
    queryFn: async () => {
      const data = await apiClient.get<SensorReading[]>(
        `/sensors/${deviceId}/history?limit=${limit}`
      );
      const points = [...data].reverse().map(toHistoryPoint);
      setSmokeHistory(points);
      return points;
    },
    refetchInterval: 30_000,
  });
}

export function useDevices() {
  const setDevices = useDeviceStore((s) => s.setDevices);

  return useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const { apiClient: client } = await import("@/lib/api");
      let devices = await client.get<import("@/types").Device[]>("/devices");

      // Auto-provision so flashing the ESP32 is the only hardware step.
      if (devices.length === 0) {
        await client.post<{
          created: boolean;
          device: import("@/types").Device;
        }>("/devices/ensure");
        devices = await client.get<import("@/types").Device[]>("/devices");
      }

      setDevices(devices);
      return devices;
    },
    refetchInterval: 20_000,
  });
}

export function useDevice(deviceId?: string | null) {
  const setConnectionLogs = useDeviceStore((s) => s.setConnectionLogs);

  return useQuery({
    queryKey: ["devices", deviceId],
    enabled: Boolean(deviceId),
    queryFn: async () => {
      const device = await apiClient.get<import("@/types").Device>(
        `/devices/${deviceId}`
      );
      if (device.connectionLogs) {
        setConnectionLogs(device.connectionLogs);
      }
      return device;
    },
  });
}
