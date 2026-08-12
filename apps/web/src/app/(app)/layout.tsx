"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { PageTransition } from "@/components/shared/page-transition";
import { USE_EXTERNAL_API } from "@/lib/api";
import { useLivePolling } from "@/hooks/use-live-polling";
import { useSocket } from "@/hooks/use-socket";
import { useTeamMessages } from "@/hooks/use-team-messages";
import { useTeamBuzzer } from "@/hooks/use-team-buzzer";
import { useTeamAlertSim } from "@/hooks/use-team-alert-sim";
import { isTeamAllowedEmail } from "@/lib/team-allowlist";
import { useAuthStore } from "@/stores/auth-store";

function RealtimeBridge() {
  const email = useAuthStore((s) => s.user?.email);
  // NestJS + Socket.IO only when NEXT_PUBLIC_API_URL points at an external API.
  // On Vercel (same-origin /api) we poll `/api/live` instead.
  useSocket(USE_EXTERNAL_API);
  useLivePolling(!USE_EXTERNAL_API);
  // Keep shared team LED in sync for every allowlisted operator.
  useTeamMessages(isTeamAllowedEmail(email) ? 20 : 0);
  // Mirror LCD S/F values into live sensors + trend chart.
  useTeamAlertSim();
  // Audible beep while team LED is red after a message.
  useTeamBuzzer();
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
