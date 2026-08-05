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
        <CardTitle className="text-base">Theme</CardTitle>
        <p className="text-xs text-muted-foreground">
          Prefer light, dark, or match your system appearance.
        </p>
      </CardHeader>
      <CardContent>
        <div
          className="grid grid-cols-3 gap-2"
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
                  "flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary/40 bg-primary/10 text-foreground shadow-soft"
                    : "border-border/70 bg-card text-muted-foreground hover:bg-accent"
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
