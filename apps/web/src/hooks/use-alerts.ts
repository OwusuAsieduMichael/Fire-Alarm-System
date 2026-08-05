"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { useDeviceStore } from "@/stores/device-store";
import type { Alert } from "@/types";

export type AlertFilter = "ALL" | "FIRE" | "SMOKE" | "SMS";

interface AlertsQuery {
  deviceId?: string | null;
  acknowledged?: boolean;
  limit?: number;
}

export function useAlerts(params: AlertsQuery = {}) {
  const setRecentAlerts = useDeviceStore((s) => s.setRecentAlerts);
  const search = new URLSearchParams();
  if (params.deviceId) search.set("deviceId", params.deviceId);
  if (params.acknowledged !== undefined) {
    search.set("acknowledged", String(params.acknowledged));
  }
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString();

  return useQuery({
    queryKey: ["alerts", params],
    queryFn: async () => {
      const alerts = await apiClient.get<Alert[]>(
        `/alerts${qs ? `?${qs}` : ""}`
      );
      setRecentAlerts(alerts);
      return alerts;
    },
    refetchInterval: 12_000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  const acknowledgeAlertLocal = useDeviceStore((s) => s.acknowledgeAlertLocal);

  return useMutation({
    mutationFn: async (id: string) => {
      acknowledgeAlertLocal(id);
      return apiClient.patch<Alert>(`/alerts/${id}/acknowledge`);
    },
    onSuccess: () => {
      toast.success("Alert acknowledged");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to acknowledge alert");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useAcknowledgeAllAlerts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceId?: string | null) => {
      const qs = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : "";
      return apiClient.post(`/alerts/acknowledge-all${qs}`);
    },
    onSuccess: () => {
      toast.success("All alerts acknowledged");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to acknowledge alerts");
    },
  });
}

export function filterAlerts(alerts: Alert[], filter: AlertFilter): Alert[] {
  if (filter === "ALL") return alerts;
  if (filter === "SMS") {
    return alerts.filter(
      (a) => a.type === "SMS" || a.smsStatus !== "NONE"
    );
  }
  return alerts.filter((a) => a.type === filter);
}
