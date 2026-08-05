"use client";

import { AnimatePresence, motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { BellOff, Check, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import type { Alert, AlertSeverity, SmsStatus } from "@/types";
import { cn } from "@/lib/utils";

interface AlertListProps {
  alerts: Alert[];
  loading?: boolean;
  acknowledgingId?: string | null;
  onAcknowledge: (id: string) => void;
}

const severityStyles: Record<AlertSeverity, string> = {
  CRITICAL: "border-l-ember bg-ember/5",
  WARNING: "border-l-warning bg-warning/5",
  INFO: "border-l-muted-foreground/40 bg-card",
};

const smsLabel: Record<SmsStatus, string> = {
  NONE: "No SMS",
  PENDING: "SMS Pending",
  SENT: "SMS Sent",
  FAILED: "SMS Failed",
};

export function AlertList({
  alerts,
  loading,
  acknowledgingId,
  onAcknowledge,
}: AlertListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={<BellOff className="h-5 w-5" />}
        title="No alerts match this filter"
        description="Try another filter or wait for new fire, smoke, or SMS events."
      />
    );
  }

  return (
    <ul className="space-y-3">
      <AnimatePresence initial={false}>
        {alerts.map((alert, index) => (
          <motion.li
            key={alert.id}
            layout
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 28,
              delay: Math.min(index * 0.03, 0.2),
            }}
            className={cn(
              "rounded-2xl border border-border/70 border-l-4 p-4 shadow-soft",
              severityStyles[alert.severity],
              alert.acknowledged && "opacity-70"
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold sm:text-base">
                    {alert.title}
                  </h3>
                  <Badge
                    variant={
                      alert.severity === "CRITICAL"
                        ? "ember"
                        : alert.severity === "WARNING"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {alert.severity}
                  </Badge>
                  <Badge variant="outline">{alert.type}</Badge>
                  {alert.smsStatus !== "NONE" ? (
                    <Badge
                      variant={
                        alert.smsStatus === "FAILED"
                          ? "destructive"
                          : alert.smsStatus === "SENT"
                            ? "success"
                            : "warning"
                      }
                      className="gap-1"
                    >
                      <MessageSquare className="h-3 w-3" />
                      {smsLabel[alert.smsStatus]}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{alert.message}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(alert.createdAt), "MMM d, yyyy · HH:mm:ss")}{" "}
                  ·{" "}
                  {formatDistanceToNow(new Date(alert.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <div className="shrink-0">
                {alert.acknowledged ? (
                  <Badge variant="success" className="gap-1">
                    <Check className="h-3 w-3" />
                    Acknowledged
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={acknowledgingId === alert.id}
                    onClick={() => onAcknowledge(alert.id)}
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
