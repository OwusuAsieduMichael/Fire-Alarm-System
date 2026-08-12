"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useDeviceStore } from "@/stores/device-store";
import type { Device, User } from "@/types";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (payload: {
      name?: string;
      phone?: string | null;
      theme?: string;
    }) => apiClient.patch<User>("/users/me", payload),
    onSuccess: (user) => {
      setUser(user);
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["users", "me"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });
}

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: ["users", "me"],
    queryFn: async () => {
      const user = await apiClient.get<User>("/users/me");
      setUser(user);
      return user;
    },
  });
}

export function useUpdateDeviceSettings() {
  const queryClient = useQueryClient();
  const setDevices = useDeviceStore((s) => s.setDevices);

  return useMutation({
    mutationFn: async ({
      deviceId,
      ...payload
    }: {
      deviceId: string;
      smokeThreshold?: number;
      flameThreshold?: number;
      smokeCalibration?: number;
      wifiSsid?: string;
      name?: string;
    }) => apiClient.patch<Device>(`/devices/${deviceId}`, payload),
    onSuccess: (device) => {
      const devices = useDeviceStore.getState().devices;
      setDevices(devices.map((d) => (d.id === device.id ? { ...d, ...device } : d)));
      toast.success("Device settings saved");
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update settings");
    },
  });
}

export function useDeviceLogs(deviceId?: string | null) {
  const setConnectionLogs = useDeviceStore((s) => s.setConnectionLogs);

  return useQuery({
    queryKey: ["devices", deviceId, "logs"],
    enabled: Boolean(deviceId),
    queryFn: async () => {
      try {
        const logs = await apiClient.get<import("@/types").ConnectionLog[]>(
          `/devices/${deviceId}/logs`
        );
        setConnectionLogs(logs);
        return logs;
      } catch {
        try {
          const logs = await apiClient.get<import("@/types").ConnectionLog[]>(
            `/iot/logs?deviceId=${deviceId}`
          );
          setConnectionLogs(logs);
          return logs;
        } catch {
          const device = await apiClient.get<Device>(`/devices/${deviceId}`);
          const logs = device.connectionLogs ?? [];
          setConnectionLogs(logs);
          return logs;
        }
      }
    },
    refetchInterval: 10_000,
  });
}
