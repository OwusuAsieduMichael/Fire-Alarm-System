"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  Gauge,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  Terminal,
  UserRound,
} from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ConnectionBadge } from "@/components/shared/connection-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types";

export interface SidebarNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  group?: "monitor" | "system";
}

export const SIDEBAR_NAV: SidebarNavItem[] = [
  { title: "Home", href: "/dashboard", icon: LayoutDashboard, group: "monitor" },
  { title: "Monitoring", href: "/monitoring", icon: Gauge, group: "monitor" },
  {
    title: "Controls",
    href: "/controls",
    icon: SlidersHorizontal,
    group: "monitor",
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
    group: "monitor",
  },
  { title: "Settings", href: "/settings", icon: Settings, group: "system" },
  {
    title: "Developer",
    href: "/developer",
    icon: Terminal,
    roles: ["DEVELOPER"],
    group: "system",
  },
  { title: "Profile", href: "/profile", icon: UserRound, group: "system" },
];

interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: SidebarNavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center gap-2.5 rounded-[12px] px-3 py-[9px] text-[13px] font-medium transition-colors duration-200",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
      aria-current={active ? "page" : undefined}
    >
      {active ? (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-[12px] bg-card shadow-soft ring-1 ring-border/60"
          transition={springSoft}
        />
      ) : (
        <span className="absolute inset-0 rounded-[12px] opacity-0 transition-opacity hover:bg-foreground/[0.04] hover:opacity-100 dark:hover:bg-white/[0.05]" />
      )}
      <Icon
        className={cn(
          "relative z-10 h-[17px] w-[17px] shrink-0 transition-opacity",
          active ? "opacity-100" : "opacity-70"
        )}
      />
      <span className="relative z-10">{item.title}</span>
    </Link>
  );
}

export function Sidebar({ onNavigate, className }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const items = SIDEBAR_NAV.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );
  const monitor = items.filter((i) => i.group === "monitor");
  const system = items.filter((i) => i.group === "system");

  return (
    <aside
      className={cn(
        "flex h-full w-[248px] flex-col border-r border-border/60 bg-surface/90 backdrop-blur-2xl dark:bg-surface/80",
        className
      )}
    >
      <div className="flex items-center gap-3 px-4 pb-3 pt-5">
        <div className="flex h-9 w-9 items-center justify-center">
          <BrandLogo size={36} priority />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-tight">
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
        <nav aria-label="Main" className="space-y-5">
          <div className="space-y-0.5">
            <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
              Monitor
            </p>
            {monitor.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`)
                }
                onNavigate={onNavigate}
              />
            ))}
          </div>

          <div className="space-y-0.5">
            <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
              System
            </p>
            {system.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`)
                }
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </nav>
      </ScrollArea>

      <div className="border-t border-border/60 p-3">
        <div className="rounded-[12px] border border-border/50 bg-card/80 px-3 py-2.5">
          <p className="truncate text-[13px] font-medium tracking-tight">
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
