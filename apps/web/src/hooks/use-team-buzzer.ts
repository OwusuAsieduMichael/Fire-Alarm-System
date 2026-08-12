"use client";

import { useEffect, useRef } from "react";
import { useDeviceStore } from "@/stores/device-store";

/** Periodic alarm tone while a team message keeps the shared LED red. */
export function useTeamBuzzer() {
  const teamLedStatus = useDeviceStore((s) => s.teamLedStatus);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (teamLedStatus !== "red") {
      void ctxRef.current?.close().catch(() => undefined);
      ctxRef.current = null;
      return;
    }

    let cancelled = false;

    const ensureContext = () => {
      if (!ctxRef.current || ctxRef.current.state === "closed") {
        ctxRef.current = new AudioContext();
      }
      return ctxRef.current;
    };

    const beep = () => {
      if (cancelled) return;
      try {
        const ctx = ensureContext();
        if (ctx.state === "suspended") {
          void ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } catch {
        // Autoplay may block until the user interacts with the page.
      }
    };

    beep();
    const id = window.setInterval(beep, 750);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      void ctxRef.current?.close().catch(() => undefined);
      ctxRef.current = null;
    };
  }, [teamLedStatus]);
}
