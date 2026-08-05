"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const DEMO_HINTS = [
  { role: "Developer", email: "developer@fireguard.io" },
  { role: "User", email: "user@fireguard.io" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = React.useState("developer@fireguard.io");
  const [password, setPassword] = React.useState("FireGuard@2026");
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>(
    {}
  );
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setLoading(true);
    try {
      await login(parsed.data.email, parsed.data.password);
    } catch {
      // toast handled in useAuth
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Sign in</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Access live sensors, alerts, and control surfaces.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email ? (
            <p id="email-error" className="text-xs text-destructive">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password ? (
            <p id="password-error" className="text-xs text-destructive">
              {errors.password}
            </p>
          ) : null}
        </div>

        <motion.div whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.01 }}>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </motion.div>
      </form>

      <div className="rounded-2xl border border-border/70 bg-muted/40 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Demo roles
        </p>
        <ul className="space-y-1.5">
          {DEMO_HINTS.map((hint) => (
            <li key={hint.email}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left text-xs transition-colors hover:bg-card"
                onClick={() => {
                  setEmail(hint.email);
                  setPassword("FireGuard@2026");
                }}
              >
                <span className="font-medium text-foreground">{hint.role}</span>
                <span className="font-mono text-muted-foreground">
                  {hint.email}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
