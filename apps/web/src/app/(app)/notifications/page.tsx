"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { AlertList } from "@/features/notifications/alert-list";
import { PresetAlertCards } from "@/features/notifications/preset-alert-cards";
import {
  filterAlerts,
  useAcknowledgeAlert,
  useAcknowledgeAllAlerts,
  useAlerts,
  type AlertFilter,
} from "@/hooks/use-alerts";
import { useDevices } from "@/hooks/use-sensors";
import {
  teamMessageToAlert,
  useSendTeamMessage,
  useTeamMessages,
} from "@/hooks/use-team-messages";
import { isTeamAllowedEmail } from "@/lib/team-allowlist";
import type {
  TeamAlertTemplate,
  TeamAlertTemplateId,
} from "@/lib/team-alert-templates";
import { useAuthStore } from "@/stores/auth-store";
import { useDeviceStore, selectSelectedDevice } from "@/stores/device-store";

const FILTERS: { value: AlertFilter; label: string }[] = [
  { value: "FIRE", label: "Fire" },
  { value: "SMOKE", label: "Smoke" },
];

export default function NotificationsPage() {
  const [filter, setFilter] = useState<AlertFilter>("FIRE");
  const [sendingId, setSendingId] = useState<TeamAlertTemplateId | null>(null);
  const user = useAuthStore((s) => s.user);
  const canMessage = isTeamAllowedEmail(user?.email);
  const selected = useDeviceStore(selectSelectedDevice);
  const storeAlerts = useDeviceStore((s) => s.recentAlerts);

  useDevices();
  const { data, isLoading } = useAlerts({
    deviceId: selected?.id,
    limit: 100,
  });
  const teamMessages = useTeamMessages(50);
  const sendMessage = useSendTeamMessage();
  const acknowledge = useAcknowledgeAlert();
  const acknowledgeAll = useAcknowledgeAllAlerts();

  const merged = useMemo(() => {
    const deviceAlerts = data ?? storeAlerts;
    const teamAlerts = (teamMessages.data?.messages ?? []).map(
      teamMessageToAlert
    );
    return [...teamAlerts, ...deviceAlerts].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [data, storeAlerts, teamMessages.data]);

  const alerts = useMemo(
    () => filterAlerts(merged, filter),
    [merged, filter]
  );

  const onSendTemplate = async (template: TeamAlertTemplate) => {
    if (sendMessage.isPending) return;
    setSendingId(template.id);
    try {
      await sendMessage.mutateAsync(template.body);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Send prepared flame and smoke alerts, then review the shared team inbox."
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={
              acknowledgeAll.isPending ||
              alerts.filter((a) => a.type !== "TEAM").length === 0
            }
            onClick={() => acknowledgeAll.mutate(selected?.id)}
          >
            Acknowledge all
          </Button>
        }
      />

      {canMessage ? (
        <PresetAlertCards
          sendingId={sendingId}
          disabled={sendMessage.isPending}
          onSend={onSendTemplate}
        />
      ) : null}

      <SegmentedControl
        value={filter}
        options={FILTERS}
        onChange={setFilter}
        ariaLabel="Alert filters"
      />

      <AlertList
        alerts={alerts}
        loading={isLoading || teamMessages.isLoading}
        acknowledgingId={acknowledge.isPending ? acknowledge.variables : null}
        onAcknowledge={(id) => {
          if (id.startsWith("team:")) return;
          acknowledge.mutate(id);
        }}
      />
    </div>
  );
}
