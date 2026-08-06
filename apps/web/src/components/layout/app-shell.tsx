"use client";

import * as React from "react";
import { CommandPalette } from "@/components/shared/command-palette";
import { BottomNav } from "./bottom-nav";
import { DashboardBackdrop } from "./dashboard-backdrop";
import { MoreSheet } from "./more-sheet";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);

  return (
    <div className="flex min-h-dvh w-full bg-surface dark:bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-20 lg:flex lg:w-[248px] lg:flex-col">
        <Sidebar />
      </div>

      <div className="relative flex min-h-dvh flex-1 flex-col lg:pl-[248px]">
        <DashboardBackdrop />

        <div className="relative z-10 flex min-h-dvh flex-1 flex-col">
          <Topbar onSearchClick={() => setCommandOpen(true)} />
          <main className="workspace-canvas safe-bottom-nav flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1080px]">{children}</div>
          </main>
        </div>
      </div>

      <BottomNav
        onMoreClick={() => setMoreOpen(true)}
        moreActive={moreOpen}
      />
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
