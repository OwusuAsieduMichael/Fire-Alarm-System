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
  success: "bg-success/10 text-success border-success/15",
  safe: "bg-success/10 text-success border-success/15",
  warning:
    "bg-warning/10 text-warning-foreground dark:text-warning border-warning/20",
  danger: "bg-ember/10 text-ember border-ember/20",
  alarm: "bg-ember/10 text-ember border-ember/20",
  neutral: "bg-muted text-muted-foreground border-border/70",
  info: "bg-info/10 text-info border-info/15",
  offline: "bg-muted text-muted-foreground border-border/70",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
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
