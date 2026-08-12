"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { useDeviceStore } from "@/stores/device-store";
import type { Alert, TeamMessage } from "@/types";

type TeamLedStatus = "green" | "red" | "amber";

interface TeamMessagesResponse {
  messages: TeamMessage[];
  ledStatus: TeamLedStatus;
  ledUpdatedAt: string | null;
}

interface TeamSendResponse {
  message: TeamMessage;
  ledStatus: TeamLedStatus;
  ledUpdatedAt: string;
  email?: {
    attempted: boolean;
    sent: number;
    failed: number;
    skippedReason?: "not_configured" | "send_failed";
  };
}

export function useTeamMessages(limit = 50) {
  const setTeamLedStatus = useDeviceStore((s) => s.setTeamLedStatus);
  const enabled = limit > 0;

  const query = useQuery({
    queryKey: ["team-messages", Math.max(limit, 1)],
    queryFn: () =>
      apiClient.get<TeamMessagesResponse>(
        `/team-messages?limit=${Math.max(limit, 1)}`
      ),
    refetchInterval: enabled ? 8_000 : false,
    enabled,
  });

  useEffect(() => {
    if (!query.data?.ledStatus) return;
    setTeamLedStatus(query.data.ledStatus, query.data.ledUpdatedAt ?? null);
  }, [query.data?.ledStatus, query.data?.ledUpdatedAt, setTeamLedStatus]);

  return query;
}

export function useSendTeamMessage() {
  const queryClient = useQueryClient();
  const setTeamLedStatus = useDeviceStore((s) => s.setTeamLedStatus);

  return useMutation({
    mutationFn: async (message: string) => {
      return apiClient.post<TeamSendResponse>("/team-messages", { message });
    },
    onSuccess: (data) => {
      setTeamLedStatus(
        data.ledStatus || "red",
        data.ledUpdatedAt || new Date().toISOString()
      );
      const email = data.email;
      if (email?.attempted && email.sent > 0) {
        toast.success(
          `Message sent · emailed ${email.sent} team inbox${email.sent === 1 ? "" : "es"}`
        );
      } else if (email?.skippedReason === "not_configured") {
        toast.success("Message sent to the team (email not configured yet)");
      } else if (email?.attempted && email.sent === 0) {
        toast.success("Message sent · email delivery failed");
      } else {
        toast.success("Message sent to the team");
      }
      queryClient.invalidateQueries({ queryKey: ["team-messages"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send message");
    },
  });
}

export function teamMessageToAlert(message: TeamMessage): Alert {
  return {
    id: `team:${message.id}`,
    deviceId: "",
    type: "TEAM",
    severity: "INFO",
    title: `Team · ${message.senderName}`,
    message: message.body,
    smsStatus: "NONE",
    acknowledged: false,
    createdAt: message.createdAt,
    senderName: message.senderName,
    senderEmail: message.senderEmail,
  };
}
