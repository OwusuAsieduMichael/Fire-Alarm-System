"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Bell,
  Gauge,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  SlidersHorizontal,
  Sun,
  Terminal,
  UserRound,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems: Array<{
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}> = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "Monitoring",
    href: "/monitoring",
    icon: <Gauge className="h-4 w-4" />,
  },
  {
    label: "Controls",
    href: "/controls",
    icon: <SlidersHorizontal className="h-4 w-4" />,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: <Bell className="h-4 w-4" />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="h-4 w-4" />,
  },
  {
    label: "Developer",
    href: "/developer",
    icon: <Terminal className="h-4 w-4" />,
    roles: ["DEVELOPER"],
  },
  {
    label: "Profile",
    href: "/profile",
    icon: <UserRound className="h-4 w-4" />,
  },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  useKeyboardShortcut(
    "k",
    () => onOpenChange(!open),
    { meta: true }
  );

  const run = React.useCallback(
    (fn: () => void) => {
      onOpenChange(false);
      fn();
    },
    [onOpenChange]
  );

  const visibleNav = navItems.filter(
    (item) =>
      !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-elevated sm:max-w-lg [&>button]:hidden">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
          loop
        >
          <div className="border-b border-border/80 px-3">
            <Command.Input
              placeholder="Search pages and actions…"
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigate">
              {visibleNav.map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => run(() => router.push(item.href))}
                >
                  {item.icon}
                  {item.label}
                </CommandItem>
              ))}
            </Command.Group>

            <Command.Group heading="Actions">
              <CommandItem
                onSelect={() =>
                  run(() => setTheme(theme === "dark" ? "light" : "dark"))
                }
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                Toggle theme
              </CommandItem>
              <CommandItem onSelect={() => run(() => logout())}>
                <LogOut className="h-4 w-4" />
                Sign out
              </CommandItem>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandItem({
  children,
  onSelect,
  className,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-xl px-2 py-2 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
        className
      )}
    >
      {children}
    </Command.Item>
  );
}
