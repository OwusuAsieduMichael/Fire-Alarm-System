"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Phone, UserRound } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .min(8, "Enter a valid SMS contact number")
    .regex(/^[+\d][\d\s()-]{6,}$/, "Use digits, optional + country code"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function SignUpPage() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    const parsed = signupSchema.safeParse({
      fullName,
      email,
      phone,
      password,
    });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        fullName: fieldErrors.fullName?.[0],
        email: fieldErrors.email?.[0],
        phone: fieldErrors.phone?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setLoading(true);
    try {
      await signUp(parsed.data);
    } catch {
      // toast handled in useAuth
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-7 text-white">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl font-semibold tracking-tight">Sign up</h1>
        <p className="text-sm text-white/70">
          Create an account to monitor your fire alarm system. SMS contact is
          used for alert notifications.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="fullName" className="sr-only">
            Full name
          </label>
          <div className="relative">
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              aria-invalid={Boolean(errors.fullName)}
              className={cn(
                "auth-glass-input w-full pr-11",
                errors.fullName && "border-red-300/80"
              )}
            />
            <UserRound
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55"
              aria-hidden="true"
            />
          </div>
          {errors.fullName ? (
            <p className="text-xs text-red-200">{errors.fullName}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            aria-invalid={Boolean(errors.email)}
            className={cn(
              "auth-glass-input w-full",
              errors.email && "border-red-300/80"
            )}
          />
          {errors.email ? (
            <p className="text-xs text-red-200">{errors.email}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="sr-only">
            SMS contact
          </label>
          <div className="relative">
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="SMS contact (e.g. +233…)"
              aria-invalid={Boolean(errors.phone)}
              className={cn(
                "auth-glass-input w-full pr-11",
                errors.phone && "border-red-300/80"
              )}
            />
            <Phone
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55"
              aria-hidden="true"
            />
          </div>
          {errors.phone ? (
            <p className="text-xs text-red-200">{errors.phone}</p>
          ) : (
            <p className="px-0.5 text-[11px] text-white/45">
              Alerts and fire notifications are sent to this number.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-invalid={Boolean(errors.password)}
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
            <p className="text-xs text-red-200">{errors.password}</p>
          ) : null}
        </div>

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
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </button>
        </motion.div>
      </form>

      <p className="text-center text-sm text-white/65">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-white underline-offset-4 hover:underline"
        >
          Login
        </Link>
      </p>
    </div>
  );
}
