import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[1.35rem] border border-border/70 bg-card/75 px-8 py-16 text-center shadow-soft backdrop-blur-[2px] dark:border-white/[0.06]",
        className
      )}
    >
      {icon ? (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[18px] bg-secondary text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h3 className="text-[17px] font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
