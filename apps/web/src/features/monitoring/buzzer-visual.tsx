"use client";

import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/shared/status-pill";
import { useDeviceStore } from "@/stores/device-store";
import { cn } from "@/lib/utils";

export function BuzzerVisual() {
  const active = useDeviceStore((s) => s.live.buzzerActive);

  return (
    <Card className="border-border/55">
      <CardHeader className="pb-3">
        <p className="metric-label">Actuator</p>
        <CardTitle className="mt-1.5 text-lg">Buzzer</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-5 py-4">
        <StatusPill
          label={active ? "ACTIVE" : "IDLE"}
          tone={active ? "alarm" : "safe"}
          pulse={active}
        />
        <div className="relative flex h-28 w-28 items-center justify-center">
          {active
            ? [0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-ember/50"
                  initial={{ scale: 0.55, opacity: 0.7 }}
                  animate={{ scale: 1.45, opacity: 0 }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    delay: i * 0.35,
                    ease: "easeOut",
                  }}
                />
              ))
            : null}
          <div
            className={cn(
              "relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors",
              active
                ? "border-ember/40 bg-ember/15 text-ember"
                : "border-border/70 bg-muted/80 text-muted-foreground"
            )}
          >
            {active ? (
              <Volume2 className="h-7 w-7" aria-hidden="true" />
            ) : (
              <VolumeX className="h-7 w-7" aria-hidden="true" />
            )}
          </div>
        </div>
        <p className="max-w-[220px] text-center text-sm leading-relaxed text-muted-foreground">
          {active
            ? "Audible alarm waveform is broadcasting"
            : "Buzzer is silent and ready"}
        </p>
      </CardContent>
    </Card>
  );
}
