"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  Flame,
  Gauge,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  Terminal,
  UserRound,
} from "lucide-react";
import { ConnectionBadge } from "@/components/shared/connection-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types";

export interface SidebarNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

export const SIDEBAR_NAV: SidebarNavItem[] = [
  { title: "Home", href: "/dashboard", icon: LayoutDashboard },
  { title: "Monitoring", href: "/monitoring", icon: Gauge },
  { title: "Controls", href: "/controls", icon: SlidersHorizontal },
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Settings", href: "/settings", icon: Settings },
  {
    title: "Developer",
    href: "/developer",
    icon: Terminal,
    roles: ["DEVELOPER"],
  },
  { title: "Profile", href: "/profile", icon: UserRound },
];

interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ onNavigate, className }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const items = SIDEBAR_NAV.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <aside
      className={cn(
        "flex h-full w-[244px] flex-col border-r border-border/50 bg-[hsl(220_14%_97%)] dark:bg-card/30",
        className
      )}
    >
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember text-ember-foreground shadow-soft">
          <Flame className="h-4.5 w-4.5 h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            FireGuard
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            IoT Control
          </p>
        </div>
      </div>

      <div className="px-3 pb-4">
        <ConnectionBadge className="w-full justify-center" />
      </div>

      <ScrollArea className="flex-1 px-2.5 pb-4">
        <nav aria-label="Main" className="space-y-0.5">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-black/[0.035] hover:text-foreground dark:hover:bg-white/[0.04]"
                )}
                aria-current={active ? "page" : undefined}
              >
                {active ? (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-white shadow-soft dark:bg-secondary"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <Icon className="relative z-10 h-4 w-4 shrink-0 opacity-80" />
                <span className="relative z-10">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-border/50 p-3">
        <div className="rounded-xl px-2.5 py-2">
          <p className="truncate text-[13px] font-medium">
            {user?.name ?? "Operator"}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {user?.role ?? "VIEWER"}
          </p>
        </div>
      </div>
    </aside>
  );
}
