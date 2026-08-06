"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertList } from "@/features/notifications/alert-list";
import {
  filterAlerts,
  useAcknowledgeAlert,
  useAcknowledgeAllAlerts,
  useAlerts,
  type AlertFilter,
} from "@/hooks/use-alerts";
import { useDevices } from "@/hooks/use-sensors";
import { useDeviceStore, selectSelectedDevice } from "@/stores/device-store";

export default function NotificationsPage() {
  const [filter, setFilter] = useState<AlertFilter>("ALL");
  const selected = useDeviceStore(selectSelectedDevice);
  const storeAlerts = useDeviceStore((s) => s.recentAlerts);

  useDevices();
  const { data, isLoading } = useAlerts({
    deviceId: selected?.id,
    limit: 100,
  });
  const acknowledge = useAcknowledgeAlert();
  const acknowledgeAll = useAcknowledgeAllAlerts();

  const alerts = useMemo(
    () => filterAlerts(data ?? storeAlerts, filter),
    [data, storeAlerts, filter]
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Fire, smoke, and SMS alert history with one-tap acknowledgement."
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={acknowledgeAll.isPending || alerts.length === 0}
            onClick={() => acknowledgeAll.mutate(selected?.id)}
          >
            Acknowledge all
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as AlertFilter)}>
        <TabsList>
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="FIRE">Fire</TabsTrigger>
          <TabsTrigger value="SMOKE">Smoke</TabsTrigger>
          <TabsTrigger value="SMS">SMS</TabsTrigger>
        </TabsList>
      </Tabs>

      <AlertList
        alerts={alerts}
        loading={isLoading}
        acknowledgingId={acknowledge.isPending ? acknowledge.variables : null}
        onAcknowledge={(id) => acknowledge.mutate(id)}
      />
    </div>
  );
}
