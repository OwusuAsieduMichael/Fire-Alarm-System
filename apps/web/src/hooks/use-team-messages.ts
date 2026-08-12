"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import type { Alert, TeamMessage } from "@/types";

export function useTeamMessages(limit = 50) {
  return useQuery({
    queryKey: ["team-messages", limit],
    queryFn: () =>
      apiClient.get<TeamMessage[]>(`/team-messages?limit=${limit}`),
    refetchInterval: 8_000,
  });
}

export function useSendTeamMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      return apiClient.post<TeamMessage>("/team-messages", { message });
    },
    onSuccess: () => {
      toast.success("Message sent to the team");
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
