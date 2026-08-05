"use client";

import { Flame } from "lucide-react";
import { motion } from "framer-motion";
import { GuestGuard } from "@/components/auth/auth-guard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestGuard>
      <div className="auth-atmosphere relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(var(--border) / 0.35) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.35) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
          }}
        />

        <motion.div
          className="relative z-10 w-full max-w-md"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-8 text-center">
            <motion.div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-ember text-ember-foreground shadow-glow"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
            >
              <Flame className="h-7 w-7" aria-hidden="true" />
            </motion.div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              FireGuard IoT
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Industrial fire monitoring, refined for operators.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card/85 p-6 shadow-elevated backdrop-blur-xl sm:p-8">
            {children}
          </div>
        </motion.div>
      </div>
    </GuestGuard>
  );
}
