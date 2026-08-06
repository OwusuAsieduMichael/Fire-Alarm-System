"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
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

const FILTERS: { value: AlertFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "FIRE", label: "Fire" },
  { value: "SMOKE", label: "Smoke" },
  { value: "SMS", label: "SMS" },
];

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
    <div className="space-y-8">
      <PageHeader
        title="Notifications"
        description="Review fire, smoke, and SMS events. Acknowledge when handled."
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

      <SegmentedControl
        value={filter}
        options={FILTERS}
        onChange={setFilter}
        ariaLabel="Alert filters"
      />

      <AlertList
        alerts={alerts}
        loading={isLoading}
        acknowledgingId={acknowledge.isPending ? acknowledge.variables : null}
        onAcknowledge={(id) => acknowledge.mutate(id)}
      />
    </div>
  );
}
