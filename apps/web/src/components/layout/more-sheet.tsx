"use client";

import Link from "next/link";
import {
  LogOut,
  Settings,
  Terminal,
  UserRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

interface MoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const links = [
  { title: "Settings", href: "/settings", icon: Settings, roles: null },
  { title: "Profile", href: "/profile", icon: UserRound, roles: null },
  {
    title: "Developer",
    href: "/developer",
    icon: Terminal,
    roles: ["DEVELOPER"] as const,
  },
];

export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  const { logout } = useAuth();
  const role = useAuthStore((s) => s.user?.role);
  const name = useAuthStore((s) => s.user?.name);

  const visible = links.filter(
    (l) => !l.roles || (role && l.roles.includes(role as "DEVELOPER"))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "bottom-0 top-auto left-0 right-0 max-h-[70dvh] w-full max-w-none translate-x-0 translate-y-0 rounded-t-[1.5rem] rounded-b-none border-border/70 p-0 shadow-elevated",
          "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
          "data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100",
          "data-[state=closed]:slide-out-to-left-0 data-[state=open]:slide-in-from-left-0",
          "data-[state=closed]:slide-out-to-top-0 data-[state=open]:slide-in-from-top-0",
          "sm:bottom-6 sm:left-1/2 sm:right-auto sm:top-auto sm:max-w-sm sm:-translate-x-1/2 sm:translate-y-0 sm:rounded-[1.5rem]"
        )}
      >
        <DialogHeader className="border-b border-border/60 px-5 py-4 text-left">
          <DialogTitle className="text-[17px] font-semibold tracking-tight">
            More
          </DialogTitle>
          <p className="text-[13px] text-muted-foreground">
            {name ? `Signed in as ${name}` : "Account & system"}
          </p>
        </DialogHeader>

        <div className="space-y-1 p-3">
          {visible.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium transition-colors hover:bg-secondary"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                {item.title}
              </Link>
            );
          })}

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium text-destructive transition-colors hover:bg-ember/10"
            onClick={() => {
              onOpenChange(false);
              void logout();
            }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember/10 text-ember">
              <LogOut className="h-4 w-4" />
            </span>
            Sign out
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
