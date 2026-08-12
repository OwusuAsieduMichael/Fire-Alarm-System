"use client";

import { useTheme } from "next-themes";
import {
  Bell,
  LogOut,
  Moon,
  Search,
  Sun,
  UserRound,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ConnectionBadge } from "@/components/shared/connection-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useTeamMessages } from "@/hooks/use-team-messages";
import { isTeamAllowedEmail } from "@/lib/team-allowlist";
import { cn, initials } from "@/lib/utils";
import { useDeviceStore } from "@/stores/device-store";
import { HamburgerButton } from "./hamburger-button";
import { SIDEBAR_NAV } from "./sidebar";

const titles: Record<string, string> = Object.fromEntries(
  SIDEBAR_NAV.map((item) => [item.href, item.title])
);

interface TopbarProps {
  onSearchClick?: () => void;
  menuOpen?: boolean;
  onMenuClick?: () => void;
}

export function Topbar({
  onSearchClick,
  menuOpen = false,
  onMenuClick,
}: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const teamLedStatus = useDeviceStore((s) => s.teamLedStatus);
  const canTeam = isTeamAllowedEmail(user?.email);
  const teamMessages = useTeamMessages(canTeam ? 10 : 0);
  const latestMessage = teamMessages.data?.messages?.[0] ?? null;
  const hasNotification =
    teamLedStatus === "red" || Boolean(latestMessage);

  const title =
    titles[pathname] ||
    SIDEBAR_NAV.find((item) => pathname.startsWith(item.href))?.title ||
    "FireGuard";

  const openLatestNotification = () => {
    if (latestMessage) {
      router.push(
        `/notifications?focus=${encodeURIComponent(latestMessage.id)}`
      );
      return;
    }
    router.push("/notifications");
  };

  return (
    <header className="sticky top-0 z-[60] flex h-14 items-center gap-2 border-b border-border/60 bg-surface/85 px-3 backdrop-blur-2xl sm:gap-3 sm:px-6 lg:px-8">
      <HamburgerButton
        open={menuOpen}
        onClick={() => onMenuClick?.()}
        className="lg:hidden"
      />

      <div className="min-w-0 lg:hidden">
        <h1 className="truncate text-[15px] font-semibold tracking-tight">
          {title}
        </h1>
      </div>

      <div className="mx-auto hidden w-full max-w-md flex-1 md:block lg:absolute lg:left-1/2 lg:max-w-md lg:-translate-x-1/2">
        <button
          type="button"
          onClick={onSearchClick}
          className="flex h-9 w-full items-center gap-2 rounded-full border border-border/70 bg-card/90 px-3.5 text-left text-[13px] text-muted-foreground shadow-soft transition-colors hover:bg-card"
          aria-label="Open command palette"
        >
          <Search className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="flex-1 truncate">Search</span>
          <kbd className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <div className="hidden sm:block">
          <ConnectionBadge compact />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onSearchClick}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={
            latestMessage
              ? "Open latest notification"
              : "Open notifications"
          }
          onClick={openLatestNotification}
        >
          <Bell className={cn("h-4 w-4", hasNotification && "text-ember")} />
          {hasNotification ? (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-ember ring-2 ring-surface" />
          ) : null}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full p-0"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8 border border-border/70">
                <AvatarFallback className="bg-secondary text-xs font-semibold">
                  {initials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-0.5 px-1 py-0.5">
                <p className="text-sm font-medium">{user?.name ?? "User"}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.email ?? "—"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <UserRound className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
