import { cn } from "@/lib/utils";

type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "info"
  | "safe"
  | "alarm"
  | "offline";

const tones: Record<StatusTone, string> = {
  success: "bg-success/15 text-success border-success/20",
  safe: "bg-success/15 text-success border-success/20",
  warning: "bg-warning/15 text-warning-foreground dark:text-warning border-warning/25",
  danger: "bg-ember/15 text-ember border-ember/25",
  alarm: "bg-ember/15 text-ember border-ember/25",
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-secondary text-secondary-foreground border-border",
  offline: "bg-muted text-muted-foreground border-border",
};

interface StatusPillProps {
  label: string;
  tone?: StatusTone;
  pulse?: boolean;
  className?: string;
}

export function StatusPill({
  label,
  tone = "neutral",
  pulse = false,
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {pulse ? (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            (tone === "success" || tone === "safe") && "live-dot",
            (tone === "danger" || tone === "alarm") && "live-dot-alert",
            tone === "warning" && "bg-warning animate-pulse",
            (tone === "neutral" || tone === "info" || tone === "offline") &&
              "bg-muted-foreground/60"
          )}
        />
      ) : null}
      {label}
    </span>
  );
}
