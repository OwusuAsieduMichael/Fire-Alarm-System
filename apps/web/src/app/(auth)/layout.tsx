"use client";

import Image from "next/image";
import { motion } from "framer-motion";
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
        <Image
          src="/login-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          aria-hidden="true"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-slate-950/55 via-slate-900/35 to-cyan-950/50"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_85%_40%,rgba(220,38,38,0.22),transparent_55%)]"
        />

        <motion.div
          className="auth-glass relative z-10 w-full max-w-[420px] px-7 py-9 sm:px-10 sm:py-11"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center drop-shadow-[0_8px_20px_rgba(255,120,40,0.35)]">
              <BrandLogo size={44} priority />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight text-white">
                FireGuard
              </p>
              <p className="text-xs text-white/60">IoT Platform</p>
            </div>
          </div>

          {children}
        </motion.div>
      </div>
    </GuestGuard>
  );
}
