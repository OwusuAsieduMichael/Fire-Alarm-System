"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-background/45 lg:hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed bottom-0 left-0 top-14 z-50 flex h-[calc(100dvh-3.5rem)] w-[min(17.5rem,86vw)] outline-none lg:hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
            "duration-200"
          )}
          aria-label="Navigation menu"
        >
          <DialogPrimitive.Title className="sr-only">
            Navigation
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Main app navigation links
          </DialogPrimitive.Description>
          <Sidebar
            onNavigate={() => onOpenChange(false)}
            className="h-full w-full max-w-none shadow-elevated"
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
