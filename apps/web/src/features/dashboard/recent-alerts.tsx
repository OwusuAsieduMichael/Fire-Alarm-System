"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { BellRing } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { listItemFade } from "@/lib/motion";
import { useDeviceStore } from "@/stores/device-store";
import type { Alert, AlertSeverity } from "@/types";
import { cn } from "@/lib/utils";

interface RecentAlertsProps {
  loading?: boolean;
  limit?: number;
}

const severityVariant: Record<
  AlertSeverity,
  "ember" | "warning" | "info"
> = {
  CRITICAL: "ember",
  WARNING: "warning",
  INFO: "info",
};

function AlertItem({ alert }: { alert: Alert }) {
  return (
    <motion.li
      layout
      {...listItemFade}
      className={cn(
        "rounded-[1.1rem] border border-border/60 bg-secondary/40 p-3.5 transition-colors hover:bg-secondary/70",
        !alert.acknowledged && "border-l-[3px] border-l-ember"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="truncate text-sm font-semibold tracking-tight">
          {alert.title}
        </p>
        <Badge variant={severityVariant[alert.severity]}>{alert.severity}</Badge>
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {alert.message}
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
      </p>
    </motion.li>
  );
}

export function RecentAlerts({ loading, limit = 6 }: RecentAlertsProps) {
  const alerts = useDeviceStore((s) => s.recentAlerts).slice(0, limit);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <p className="metric-label">Inbox</p>
        <CardTitle className="mt-1.5">Recent alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={<BellRing className="h-5 w-5" />}
            title="No recent alerts"
            description="The system is quiet. New fire, smoke, and SMS events appear here."
            className="border-0 bg-transparent py-10 shadow-none"
          />
        ) : (
          <ul className="space-y-2.5">
            <AnimatePresence initial={false} mode="popLayout">
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
