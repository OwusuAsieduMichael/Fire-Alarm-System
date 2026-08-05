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
  { card: string; icon: string; button: "ember" | "destructive" | "secondary" | "outline" }
> = {
  danger: {
    card: "border-ember/30 hover:border-ember/50",
    icon: "bg-ember/15 text-ember",
    button: "ember",
  },
  warning: {
    card: "border-warning/30 hover:border-warning/50",
    icon: "bg-warning/15 text-warning",
    button: "destructive",
  },
  calm: {
    card: "border-success/25 hover:border-success/40",
    icon: "bg-success/15 text-success",
    button: "secondary",
  },
  neutral: {
    card: "border-border/80 hover:border-border",
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
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.35 }}
      >
        <Card className={cn("h-full transition-all", styles.card)}>
          <CardContent className="flex h-full flex-col gap-5 p-6">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl",
                styles.icon
              )}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-1.5">
              <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <motion.div whileTap={{ scale: 0.98 }}>
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
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
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
