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
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
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
        "flex h-full w-64 flex-col border-r border-border/80 bg-card/60 backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ember text-ember-foreground shadow-glow">
          <Flame className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            FireGuard
          </p>
          <p className="truncate text-xs text-muted-foreground">IoT Platform</p>
        </div>
      </div>

      <div className="px-4 pb-3">
        <ConnectionBadge className="w-full justify-center" />
      </div>

      <ScrollArea className="flex-1 px-3 pb-4">
        <nav aria-label="Main" className="space-y-1">
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
                  "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                {active ? (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl bg-secondary shadow-soft"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <Icon className="relative z-10 h-4 w-4 shrink-0" />
                <span className="relative z-10">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-border/80 p-4">
        <div className="rounded-2xl bg-muted/60 px-3 py-3">
          <p className="truncate text-sm font-medium">
            {user?.name ?? "Operator"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.role ?? "VIEWER"}
          </p>
        </div>
      </div>
    </aside>
  );
}
