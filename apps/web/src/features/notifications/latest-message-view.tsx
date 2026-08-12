"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  BellOff,
  Flame,
  MessageSquareText,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { StatusPill } from "@/components/shared/status-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TEAM_FIREGUARD_LABEL,
  useTeamMessages,
} from "@/hooks/use-team-messages";
import { cn } from "@/lib/utils";
import { useDeviceStore } from "@/stores/device-store";

export function LatestMessageView() {
  const teamMessages = useTeamMessages(1);
  const teamLedStatus = useDeviceStore((s) => s.teamLedStatus);
  const live = useDeviceStore((s) => s.live);
  const latest = teamMessages.data?.messages?.[0] ?? null;
  const active =
    teamLedStatus === "red" || live.alarmActive || live.flameDetected;

  if (teamMessages.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-[1.35rem]" />
        <Skeleton className="h-72 w-full rounded-[1.35rem]" />
      </div>
    );
  }

  if (!latest) {
    return (
      <section className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-card shadow-elevated">
        <div className="bg-gradient-to-br from-success/[0.08] via-card to-card px-5 py-8 sm:px-8 sm:py-10">
          <p className="metric-label">Team alert</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.03em] sm:text-[2.1rem]">
            No latest message
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            When Team FireGuard broadcasts an alert, this page shows that
            message on its own — separate from the full Notifications tools.
          </p>
          <div className="mt-6 flex h-24 items-center justify-center rounded-[1.15rem] border border-dashed border-border/80 bg-secondary/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BellOff className="h-4 w-4" />
              Inbox is quiet
            </div>
          </div>
          <div className="mt-6">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/notifications">
                Open Notifications
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section
        className={cn(
          "overflow-hidden rounded-[1.35rem] border border-border/70 bg-card shadow-elevated",
          active && "border-ember/40"
        )}
        aria-label="Latest Team FireGuard message"
      >
        <div
          className={cn(
            "px-5 py-6 sm:px-8 sm:py-8",
            active
              ? "bg-gradient-to-br from-ember/[0.12] via-card to-card"
              : "bg-gradient-to-br from-info/[0.08] via-card to-card"
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <p className="metric-label">Team alert</p>
              <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] sm:text-[2.15rem]">
                Latest message
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                Dedicated view for the most recent broadcast from{" "}
                {TEAM_FIREGUARD_LABEL}.
              </p>
            </div>
            <StatusPill
              label={active ? "ACTIVE" : "RECEIVED"}
              tone={active ? "alarm" : "info"}
              pulse={active}
            />
          </div>
        </div>

        <div className="grid gap-px border-t border-border/60 bg-border/50 sm:grid-cols-3">
          <MetaCell
            label="From"
            value={TEAM_FIREGUARD_LABEL}
            icon={<ShieldAlert className="h-4 w-4 text-ember" />}
          />
          <MetaCell
            label="Received"
            value={formatDistanceToNow(new Date(latest.createdAt), {
              addSuffix: true,
            })}
            hint={format(new Date(latest.createdAt), "MMM d, yyyy · HH:mm:ss")}
            icon={<MessageSquareText className="h-4 w-4 text-muted-foreground" />}
          />
          <MetaCell
            label="System LED"
            value={
              teamLedStatus === "red"
                ? "Red · alert"
                : teamLedStatus === "amber"
                  ? "Amber"
                  : "Green · clear"
            }
            icon={
              <Flame
                className={cn(
                  "h-4 w-4",
                  teamLedStatus === "red" ? "text-ember" : "text-success"
                )}
              />
            }
          />
        </div>

        <article className="space-y-5 px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">TEAM</Badge>
            <Badge variant="outline">Latest only</Badge>
            {active ? <Badge variant="ember">Needs attention</Badge> : null}
          </div>

          <div className="rounded-[1.25rem] border border-border/70 bg-secondary/35 p-5 sm:p-7">
            <p className="metric-label">Message</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              {TEAM_FIREGUARD_LABEL}
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/95 sm:text-base">
              {latest.body}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground sm:text-[13px]">
              Sidebar Notifications still has prepared alerts, compose, and the
              full inbox.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="/controls">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Controls
                </Link>
              </Button>
              <Button asChild size="sm" className="gap-2">
                <Link href="/notifications">
                  Full Notifications
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

function MetaCell({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
}) {
  return (
    <div className="bg-card px-4 py-4 sm:px-5">
      <div className="flex items-center gap-2">
        {icon}
        <p className="metric-label">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold tracking-tight sm:text-[15px]">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
