"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeviceStore } from "@/stores/device-store";

const SMOKE_THRESHOLD = 60;
const FLAME_THRESHOLD = 1000;
const FIRE_PHASE_MS = 5 * 60 * 1000;

function padLine(text: string, width = 16): string {
  const clean = (text || "").slice(0, width);
  return clean.padEnd(width, " ");
}

function fluctuateUp(base: number, elapsedSec: number, step: number, wobble: number) {
  const climb = Math.floor(elapsedSec * step);
  const jitter = Math.floor(((elapsedSec * 17) % (wobble * 2 + 1)) - wobble);
  return Math.max(base, base + climb + jitter);
}

function resolveLcdLines(
  teamLedStatus: "green" | "red" | "amber",
  teamLedUpdatedAt: string | null,
  nowMs: number
): { line1: string; line2: string } {
  if (teamLedStatus !== "red") {
    return {
      line1: "Fire Alarm Sys",
      line2: `S:${SMOKE_THRESHOLD} F:${FLAME_THRESHOLD}`,
    };
  }

  const startedAt = teamLedUpdatedAt
    ? new Date(teamLedUpdatedAt).getTime()
    : nowMs;
  const elapsed = Math.max(0, nowMs - startedAt);

  if (elapsed < FIRE_PHASE_MS) {
    return {
      line1: "Fire Detected",
      line2: `S:${SMOKE_THRESHOLD} F:${FLAME_THRESHOLD}`,
    };
  }

  const smokePhaseSec = Math.floor((elapsed - FIRE_PHASE_MS) / 1000);
  const smoke = fluctuateUp(SMOKE_THRESHOLD, smokePhaseSec, 1.4, 4);
  const flame = fluctuateUp(FLAME_THRESHOLD, smokePhaseSec, 3.2, 12);

  return {
    line1: "Smoke Detected",
    line2: `S:${smoke} F:${flame}`,
  };
}

export function LcdDisplay() {
  const teamLedStatus = useDeviceStore((s) => s.teamLedStatus);
  const teamLedUpdatedAt = useDeviceStore((s) => s.teamLedUpdatedAt);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { line1, line2 } = resolveLcdLines(
    teamLedStatus,
    teamLedUpdatedAt,
    nowMs
  );
  const display1 = padLine(line1);
  const display2 = padLine(line2);

  return (
    <Card>
      <CardHeader className="pb-3">
        <p className="metric-label">Hardware</p>
        <CardTitle className="mt-1.5 text-lg">LCD simulation</CardTitle>
        <p className="text-xs text-muted-foreground">16×2 character display</p>
      </CardHeader>
      <CardContent>
        <div className="mx-auto max-w-md rounded-2xl border border-emerald-900/40 bg-zinc-950 p-4 shadow-elevated">
          <div
            className="rounded-xl border border-emerald-700/40 px-4 py-5"
            style={{
              background:
                "linear-gradient(180deg, #0b1f12 0%, #07140c 100%)",
              boxShadow: "inset 0 0 40px rgba(16, 185, 129, 0.08)",
            }}
            role="status"
            aria-label={`LCD display: ${display1.trim()}, ${display2.trim()}`}
          >
            <pre className="font-mono text-[15px] leading-7 tracking-[0.18em] text-emerald-400 sm:text-base">
              <div className="flex items-center justify-between">
                <span>{display1}</span>
                <motion.span
                  aria-hidden="true"
                  className="ml-1 inline-block h-4 w-2 bg-emerald-400/80"
                  animate={{ opacity: [1, 0.15, 1] }}
                  transition={{ duration: 1.1, repeat: Infinity }}
                />
              </div>
              <div>{display2}</div>
            </pre>
          </div>
          <p className="mt-3 text-center text-[11px] uppercase tracking-widest text-zinc-500">
            Hitachi HD44780 · Simulated
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
