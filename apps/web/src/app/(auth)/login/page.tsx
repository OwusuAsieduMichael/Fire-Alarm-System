"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, UserRound } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const DEMO_HINTS = [
  { role: "Developer", email: "developer@fireguard.io" },
  { role: "User", email: "user@fireguard.io" },
];

const REMEMBER_KEY = "fireguard.rememberEmail";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = React.useState("developer@fireguard.io");
  const [password, setPassword] = React.useState("FireGuard@2026");
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch {
      // ignore
    }
  }, []);

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
      try {
        if (remember) {
          localStorage.setItem(REMEMBER_KEY, parsed.data.email);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
      } catch {
        // ignore
      }
      await login(parsed.data.email, parsed.data.password);
    } catch {
      // toast handled in useAuth
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-7 text-white">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl font-semibold tracking-tight">Login</h1>
        <p className="text-sm text-white/70">
          Welcome back — please login to your account.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={cn(
                "auth-glass-input peer w-full pr-11",
                errors.email && "border-red-300/80"
              )}
            />
            <UserRound
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55"
              aria-hidden="true"
            />
          </div>
          {errors.email ? (
            <p id="email-error" className="text-xs text-red-200">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 px-0.5">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="ml-auto text-xs font-medium text-white/65 transition-colors hover:text-white"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={cn(
                "auth-glass-input w-full pr-11",
                errors.password && "border-red-300/80"
              )}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 transition-colors hover:text-white"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p id="password-error" className="text-xs text-red-200">
              {errors.password}
            </p>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 px-0.5 pt-1 text-sm text-white/80">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="peer sr-only"
          />
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-[4px] border border-white/45 transition-colors",
              remember && "border-transparent bg-emerald-500"
            )}
            aria-hidden="true"
          >
            {remember ? (
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white">
                <path
                  d="M2.5 6.2 5 8.5 9.5 3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
          Remember me
        </label>

        <motion.div whileTap={{ scale: 0.985 }} className="pt-1">
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="auth-glass-button inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-white disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Login"
            )}
          </button>
        </motion.div>
      </form>

      <div className="space-y-2.5 border-t border-white/10 pt-5">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
          Demo access
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {DEMO_HINTS.map((hint) => (
            <button
              key={hint.email}
              type="button"
              className="rounded-full border border-white/25 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/85 transition-all hover:border-white/40 hover:bg-white/10"
              onClick={() => {
                setEmail(hint.email);
                setPassword("FireGuard@2026");
              }}
            >
              {hint.role}
            </button>
          ))}
        </div>
        <p className="text-center text-[11px] text-white/45">
          Password: FireGuard@2026
        </p>
      </div>
    </div>
  );
}
