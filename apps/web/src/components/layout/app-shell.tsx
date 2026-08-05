"use client";

import * as React from "react";
import { CommandPalette } from "@/components/shared/command-palette";
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
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      <div className="flex min-h-dvh flex-1 flex-col lg:pl-64">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          onSearchClick={() => setCommandOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
