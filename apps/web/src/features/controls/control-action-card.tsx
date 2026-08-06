"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { staggerChild } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ActionTone = "danger" | "warning" | "calm" | "neutral";

interface ControlActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: ActionTone;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  onConfirm: () => void | Promise<unknown>;
  index?: number;
}

const toneStyles: Record<
  ActionTone,
  {
    card: string;
    icon: string;
    button: "ember" | "destructive" | "secondary" | "outline";
  }
> = {
  danger: {
    card: "border-ember/25 hover:border-ember/40",
    icon: "bg-ember/12 text-ember",
    button: "ember",
  },
  warning: {
    card: "border-warning/25 hover:border-warning/40",
    icon: "bg-warning/12 text-warning",
    button: "destructive",
  },
  calm: {
    card: "border-success/20 hover:border-success/35",
    icon: "bg-success/12 text-success",
    button: "secondary",
  },
  neutral: {
    card: "border-border/70 hover:border-border",
    icon: "bg-muted text-muted-foreground",
    button: "outline",
  },
};

export function ControlActionCard({
  title,
  description,
  icon: Icon,
  tone = "neutral",
  confirmTitle,
  confirmDescription,
  confirmLabel = "Confirm",
  loading,
  disabled,
  onConfirm,
  index = 0,
}: ControlActionCardProps) {
  const [open, setOpen] = useState(false);
  const styles = toneStyles[tone];

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  return (
    <>
      <motion.div {...staggerChild(index)}>
        <Card interactive className={cn("h-full", styles.card)}>
          <CardContent className="flex h-full flex-col gap-5 p-5 sm:p-6">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl",
                styles.icon
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-1.5">
              <h3 className="text-[17px] font-semibold tracking-tight">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
            <Button
              variant={styles.button}
              size="lg"
              className="w-full"
              disabled={disabled || loading}
              onClick={() => setOpen(true)}
              aria-label={title}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Working…
                </>
              ) : (
                title
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[1.35rem] sm:rounded-[1.35rem]">
          <DialogHeader>
            <DialogTitle>{confirmTitle ?? `Confirm ${title}`}</DialogTitle>
            <DialogDescription>
              {confirmDescription ??
                "This action will be sent to the ESP32 device immediately."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={styles.button}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending…
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
