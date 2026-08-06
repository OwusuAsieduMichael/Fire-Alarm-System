"use client";

import { motion } from "framer-motion";
import { AuthBackdrop } from "@/components/auth/auth-backdrop";
import { GuestGuard } from "@/components/auth/auth-guard";
import { BrandLogo } from "@/components/shared/brand-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestGuard>
      <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
        <AuthBackdrop />

        <motion.div
          className="auth-glass relative z-10 w-full max-w-[420px] px-7 py-9 sm:px-10 sm:py-11"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                FireGuard
              </p>
              <p className="mt-0.5 text-xs text-white/60 sm:text-sm">
                IoT Platform
              </p>
            </div>

            <div className="relative shrink-0 rounded-2xl bg-black/40 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.45)] ring-1 ring-white/20">
              <BrandLogo
                size={112}
                priority
                className="h-[96px] w-[96px] sm:h-[112px] sm:w-[112px]"
              />
            </div>
          </div>

          {children}
        </motion.div>
      </div>
    </GuestGuard>
  );
}
