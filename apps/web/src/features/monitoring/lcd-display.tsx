"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeviceStore } from "@/stores/device-store";

function padLine(text: string, width = 16): string {
  const clean = (text || "").slice(0, width);
  return clean.padEnd(width, " ");
}

export function LcdDisplay() {
  const live = useDeviceStore((s) => s.live);
  const line1 = padLine(live.alarmActive ? "!!! ALARM !!!" : "FireGuard IoT");
  const line2 = padLine(live.lcdMessage || `Smoke:${Math.round(live.smokeLevel)}`);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">LCD Simulation</CardTitle>
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
            aria-label={`LCD display: ${line1.trim()}, ${line2.trim()}`}
          >
            <pre className="font-mono text-[15px] leading-7 tracking-[0.18em] text-emerald-400 sm:text-base">
              <div className="flex items-center justify-between">
                <span>{line1}</span>
                <motion.span
                  aria-hidden="true"
                  className="ml-1 inline-block h-4 w-2 bg-emerald-400/80"
                  animate={{ opacity: [1, 0.15, 1] }}
                  transition={{ duration: 1.1, repeat: Infinity }}
                />
              </div>
              <div>{line2}</div>
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
