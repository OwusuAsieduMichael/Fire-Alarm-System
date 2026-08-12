"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
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
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          <p className="metric-label">Inbox</p>
          <h1 className="section-title">Notifications</h1>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}

function NotificationsContent() {
  const searchParams = useSearchParams();
  const focusParam = searchParams.get("focus");
  const focusId = focusParam
    ? focusParam.startsWith("team:")
      ? focusParam
      : `team:${focusParam}`
    : null;

  const [filter, setFilter] = useState<AlertFilter>("FIRE");
  const [draft, setDraft] = useState("");
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

  useEffect(() => {
    if (!focusId || isLoading || teamMessages.isLoading) return;
    const el = document.getElementById(`alert-${focusId}`);
    if (!el) return;
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [focusId, alerts, isLoading, teamMessages.isLoading]);

  const onSendTemplate = async (template: TeamAlertTemplate) => {
    if (sendMessage.isPending) return;
    setSendingId(template.id);
    try {
      await sendMessage.mutateAsync(template.body);
    } finally {
      setSendingId(null);
    }
  };

  const onSendCustom = async (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sendMessage.isPending) return;
    await sendMessage.mutateAsync(message);
    setDraft("");
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Send prepared flame and smoke alerts, or write a custom team message."
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
        <div className="space-y-5">
          <PresetAlertCards
            sendingId={sendingId}
            disabled={sendMessage.isPending}
            onSend={onSendTemplate}
          />

          <form
            onSubmit={onSendCustom}
            className="rounded-[1.25rem] border border-border/70 bg-card/90 p-4 shadow-soft sm:p-5"
          >
            <p className="metric-label">Custom message</p>
            <h2 className="section-title mt-1 text-base sm:text-lg">
              Write your own
            </h2>
            <label htmlFor="team-message" className="sr-only">
              Custom team message
            </label>
            <textarea
              id="team-message"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Write a custom message for the FireGuard team…"
              className="mt-3 w-full resize-none rounded-2xl border border-border/70 bg-background/80 px-3.5 py-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Optional. Same inbox, LED, and email path as prepared alerts.
              </p>
              <Button
                type="submit"
                size="sm"
                disabled={
                  !draft.trim() || sendMessage.isPending || Boolean(sendingId)
                }
                className="gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                {sendMessage.isPending && !sendingId ? "Sending…" : "Send"}
              </Button>
            </div>
          </form>
        </div>
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
        focusId={focusId}
        acknowledgingId={acknowledge.isPending ? acknowledge.variables : null}
        onAcknowledge={(id) => {
          if (id.startsWith("team:")) return;
          acknowledge.mutate(id);
        }}
      />
    </div>
  );
}
