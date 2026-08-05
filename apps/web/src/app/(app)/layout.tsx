"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { PageTransition } from "@/components/shared/page-transition";
import { useSocket } from "@/hooks/use-socket";

function SocketBridge() {
  useSocket();
  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SocketBridge />
      <AppShell>
        <PageTransition>{children}</PageTransition>
      </AppShell>
    </AuthGuard>
  );
}
