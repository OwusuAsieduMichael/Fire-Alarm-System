"use client";

import { Flame, Send, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TEAM_ALERT_TEMPLATES,
  type TeamAlertTemplate,
  type TeamAlertTemplateId,
} from "@/lib/team-alert-templates";
import { cn } from "@/lib/utils";

interface PresetAlertCardsProps {
  sendingId: TeamAlertTemplateId | null;
  disabled?: boolean;
  onSend: (template: TeamAlertTemplate) => void | Promise<unknown>;
}

const toneStyles: Record<
  TeamAlertTemplate["tone"],
  { icon: string; border: string }
> = {
  flame: {
    icon: "text-ember bg-ember/10 border-ember/25",
    border: "border-ember/20",
  },
  smoke: {
    icon: "text-warning bg-warning/10 border-warning/25",
    border: "border-warning/20",
  },
  critical: {
    icon: "text-ember bg-ember/15 border-ember/30",
    border: "border-ember/30",
  },
};

function TemplateIcon({ id }: { id: TeamAlertTemplateId }) {
  if (id === "smoke") return <Wind className="h-5 w-5" aria-hidden="true" />;
  if (id === "both") {
    return (
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <Flame className="absolute -left-0.5 h-4 w-4" aria-hidden="true" />
        <Wind className="absolute -right-0.5 h-3.5 w-3.5 opacity-80" aria-hidden="true" />
      </span>
    );
  }
  return <Flame className="h-5 w-5" aria-hidden="true" />;
}

export function PresetAlertCards({
  sendingId,
  disabled,
  onSend,
}: PresetAlertCardsProps) {
  return (
    <section className="space-y-3" aria-label="Prepared team alerts">
      <div>
        <p className="metric-label">Broadcast</p>
        <h2 className="section-title mt-1">Prepared alerts</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          One tap sends a professional notice to every team inbox, turns the LED
          red, and starts the alarm sequence.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {TEAM_ALERT_TEMPLATES.map((template) => {
          const styles = toneStyles[template.tone];
          const sending = sendingId === template.id;
          const busy = Boolean(sendingId);

          return (
            <Card
              key={template.id}
              className={cn("border-border/70", styles.border)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                      styles.icon
                    )}
                  >
                    <TemplateIcon id={template.id} />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base leading-snug">
                      {template.title}
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {template.summary}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="rounded-2xl border border-border/60 bg-muted/30 px-3.5 py-3 text-sm leading-relaxed text-muted-foreground">
                  {template.body}
                </p>
                <Button
                  className="w-full gap-2"
                  disabled={disabled || busy}
                  onClick={() => void onSend(template)}
                >
                  <Send className="h-3.5 w-3.5" />
                  {sending ? "Sending…" : "Send"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
