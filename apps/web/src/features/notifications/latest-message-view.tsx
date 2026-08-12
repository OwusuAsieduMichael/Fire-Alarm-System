"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { BellOff, MessageSquare, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  teamMessageToAlert,
  useTeamMessages,
} from "@/hooks/use-team-messages";

export function LatestMessageView() {
  const teamMessages = useTeamMessages(1);
  const latest = teamMessages.data?.messages?.[0] ?? null;
  const alert = latest ? teamMessageToAlert(latest) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Latest message"
        description="The most recent alert from Team FireGuard."
      />

      {teamMessages.isLoading ? (
        <Skeleton className="h-56 w-full rounded-[1.35rem]" />
      ) : !alert ? (
        <EmptyState
          icon={<BellOff className="h-5 w-5" />}
          title="No team messages yet"
          description="When Team FireGuard sends an alert, it will appear here."
        />
      ) : (
        <article className="rounded-[1.35rem] border border-border/70 border-l-[3px] border-l-ember bg-card p-5 shadow-soft sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
              {alert.title}
            </h2>
            <Badge variant="info">TEAM</Badge>
            <Badge variant="outline" className="gap-1">
              <MessageSquare className="h-3 w-3" />
              Latest
            </Badge>
          </div>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 sm:text-[15px]">
            {alert.message}
          </p>

          <p className="mt-5 text-xs text-muted-foreground">
            From Team FireGuard ·{" "}
            {format(new Date(alert.createdAt), "MMM d, yyyy · HH:mm:ss")} ·{" "}
            {formatDistanceToNow(new Date(alert.createdAt), {
              addSuffix: true,
            })}
          </p>
        </article>
      )}

      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/notifications">
            Open full Notifications
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
