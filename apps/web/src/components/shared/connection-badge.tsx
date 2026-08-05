"use client";

import { cn } from "@/lib/utils";
import { useDeviceStore } from "@/stores/device-store";
import type { ConnectionStatus } from "@/types";

interface ConnectionBadgeProps {
  status?: ConnectionStatus;
  className?: string;
  compact?: boolean;
}

const labels: Record<ConnectionStatus, string> = {
  connected: "Live",
  connecting: "Connecting",
  disconnected: "Offline",
  error: "Error",
};

const styles: Record<ConnectionStatus, string> = {
  connected: "bg-success/15 text-success border-success/20",
  connecting:
    "bg-warning/15 text-warning-foreground dark:text-warning border-warning/25",
  disconnected: "bg-muted text-muted-foreground border-border",
  error: "bg-ember/15 text-ember border-ember/25",
};

const dots: Record<ConnectionStatus, string> = {
  connected: "live-dot",
  connecting:
    "relative inline-flex h-2.5 w-2.5 rounded-full bg-warning animate-pulse-live",
  disconnected: "live-dot-offline",
  error: "live-dot-alert",
};

export function ConnectionBadge({
  status,
  className,
  compact,
}: ConnectionBadgeProps) {
  const storeStatus = useDeviceStore((s) => s.connectionStatus);
  const resolved = status ?? storeStatus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border text-xs font-semibold",
        compact ? "px-2.5 py-0.5" : "px-3 py-1",
        styles[resolved],
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className={dots[resolved]} aria-hidden="true" />
      {labels[resolved]}
    </span>
  );
}
