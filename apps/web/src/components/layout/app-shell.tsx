"use client";

import * as React from "react";
import { CommandPalette } from "@/components/shared/command-palette";
import { DashboardBackdrop } from "./dashboard-backdrop";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-20 lg:flex lg:w-[248px] lg:flex-col">
        <Sidebar />
      </div>

      <div className="relative flex min-h-dvh flex-1 flex-col lg:pl-[248px]">
        <DashboardBackdrop />

        <div className="relative z-10 flex min-h-dvh flex-1 flex-col">
          <Topbar
            onMenuClick={() => setMobileOpen(true)}
            onSearchClick={() => setCommandOpen(true)}
          />
          <main className="workspace-canvas flex-1 px-4 py-7 sm:px-6 lg:px-10 lg:py-9">
            <div className="mx-auto w-full max-w-[1080px]">{children}</div>
          </main>
        </div>
      </div>

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
