"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader className="pb-3">
        <p className="metric-label">Appearance</p>
        <CardTitle className="mt-1.5">Theme</CardTitle>
        <p className="text-[13px] text-muted-foreground">
          Prefer light, dark, or match your system.
        </p>
      </CardHeader>
      <CardContent>
        <div
          className="grid grid-cols-3 gap-2.5"
          role="radiogroup"
          aria-label="Theme preference"
        >
          {options.map(({ value, label, icon: Icon }) => {
            const selected = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-2.5 rounded-[1.1rem] border px-3 py-5 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-transparent bg-foreground text-background shadow-soft"
                    : "border-border/70 bg-surface/80 text-muted-foreground hover:bg-surface hover:text-foreground dark:border-white/[0.06] dark:bg-secondary/50"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
