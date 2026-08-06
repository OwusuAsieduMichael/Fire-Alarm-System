"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  Gauge,
  LayoutDashboard,
  MoreHorizontal,
  SlidersHorizontal,
} from "lucide-react";
import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

const TABS = [
  { title: "Home", href: "/dashboard", icon: LayoutDashboard },
  { title: "Monitor", href: "/monitoring", icon: Gauge },
  { title: "Controls", href: "/controls", icon: SlidersHorizontal },
  { title: "Alerts", href: "/notifications", icon: Bell },
] as const;

interface BottomNavProps {
  onMoreClick: () => void;
  moreActive?: boolean;
}

export function BottomNav({ onMoreClick, moreActive }: BottomNavProps) {
  const pathname = usePathname();

  const isTabActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const moreRoutes = ["/settings", "/profile", "/developer"];
  const isMoreRoute = moreRoutes.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-surface/95 px-2 pt-1.5 backdrop-blur-2xl lg:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 gap-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = isTabActive(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold tracking-tight transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                {active ? (
                  <motion.span
                    layoutId="bottom-tab-active"
                    className="absolute inset-0 rounded-xl bg-card shadow-soft ring-1 ring-border/50"
                    transition={springSoft}
                  />
                ) : null}
                <Icon className="relative z-10 h-[18px] w-[18px]" />
                <span className="relative z-10">{tab.title}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onMoreClick}
            className={cn(
              "relative flex w-full flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold tracking-tight transition-colors",
              moreActive || isMoreRoute
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="More"
            aria-expanded={moreActive}
          >
            {(moreActive || isMoreRoute) && !TABS.some((t) => isTabActive(t.href)) ? (
              <motion.span
                layoutId="bottom-tab-active"
                className="absolute inset-0 rounded-xl bg-card shadow-soft ring-1 ring-border/50"
                transition={springSoft}
              />
            ) : null}
            <MoreHorizontal className="relative z-10 h-[18px] w-[18px]" />
            <span className="relative z-10">More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
