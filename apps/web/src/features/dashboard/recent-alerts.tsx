"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { BellRing } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useDeviceStore } from "@/stores/device-store";
import type { Alert, AlertSeverity } from "@/types";
import { cn } from "@/lib/utils";

interface RecentAlertsProps {
  loading?: boolean;
  limit?: number;
}

const severityVariant: Record<
  AlertSeverity,
  "ember" | "warning" | "secondary"
> = {
  CRITICAL: "ember",
  WARNING: "warning",
  INFO: "secondary",
};

function AlertItem({ alert }: { alert: Alert }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-border/70 bg-surface-elevated/60 p-3",
        !alert.acknowledged && "border-l-2 border-l-ember"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">{alert.title}</p>
          <Badge variant={severityVariant[alert.severity]}>{alert.severity}</Badge>
          <Badge variant="outline">{alert.type}</Badge>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {alert.message}
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
        </p>
      </div>
    </motion.li>
  );
}

export function RecentAlerts({ loading, limit = 6 }: RecentAlertsProps) {
  const alerts = useDeviceStore((s) => s.recentAlerts).slice(0, limit);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={<BellRing className="h-5 w-5" />}
            title="No recent alerts"
            description="The system is quiet. New fire, smoke, and SMS events will appear here."
            className="border-0 bg-transparent py-10"
          />
        ) : (
          <ul className="space-y-2.5">
            <AnimatePresence initial={false}>
              {alerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
