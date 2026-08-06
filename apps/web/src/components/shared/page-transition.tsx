import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/** Static page wrapper — no enter/exit motion (keeps mobile chrome steady). */
export function PageTransition({ children, className }: PageTransitionProps) {
  return <div className={cn("w-full", className)}>{children}</div>;
}
