"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { PageTransition } from "@/components/shared/page-transition";
import { USE_EXTERNAL_API } from "@/lib/api";
import { useLivePolling } from "@/hooks/use-live-polling";
import { useSocket } from "@/hooks/use-socket";

function RealtimeBridge() {
  // NestJS + Socket.IO only when NEXT_PUBLIC_API_URL points at an external API.
  // On Vercel (same-origin /api) we poll `/api/live` instead.
  useSocket(USE_EXTERNAL_API);
  useLivePolling(!USE_EXTERNAL_API);
  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <RealtimeBridge />
      <AppShell>
        <PageTransition>{children}</PageTransition>
      </AppShell>
    </AuthGuard>
  );
}
