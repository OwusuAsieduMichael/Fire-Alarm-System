"use client";

import { Flame, Radio, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { GuestGuard } from "@/components/auth/auth-guard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestGuard>
      <div className="auth-atmosphere flex min-h-dvh items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-card shadow-elevated lg:grid-cols-[1.05fr_0.95fr]"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ember text-ember-foreground shadow-soft">
                <Flame className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-base font-semibold tracking-tight">
                  FireGuard
                </p>
                <p className="text-xs text-muted-foreground">IoT Platform</p>
              </div>
            </div>

            <div className="mx-auto w-full max-w-sm flex-1">{children}</div>

            <p className="mt-10 text-center text-[11px] text-muted-foreground">
              Secure operator access · Live ESP32 monitoring
            </p>
          </div>

          <div className="relative hidden overflow-hidden bg-foreground text-background lg:flex lg:flex-col lg:justify-between lg:p-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse 80% 70% at 15% 15%, hsl(348 70% 42% / 0.55), transparent 55%), radial-gradient(ellipse 70% 60% at 90% 85%, hsl(212 45% 30% / 0.45), transparent 50%)",
              }}
            />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-background/50">
                Operations
              </p>
              <h2 className="mt-4 max-w-xs text-3xl font-semibold leading-[1.15] tracking-tight text-balance">
                Clear status. Fast response.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-background/65">
                Monitor smoke, flame, and device health from one calm control
                surface built for operators.
              </p>
            </div>

            <div className="relative space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-background/10 bg-background/10 px-4 py-3 backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4 shrink-0 text-background/80" />
                <p className="text-sm text-background/75">
                  Live SAFE / ALARM state at a glance
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-background/10 bg-background/10 px-4 py-3 backdrop-blur-sm">
                <Radio className="h-4 w-4 shrink-0 text-background/80" />
                <p className="text-sm text-background/75">
                  ESP32 telemetry with low-latency updates
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </GuestGuard>
  );
}
