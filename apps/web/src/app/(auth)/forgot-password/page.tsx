"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);

    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.email?.[0]);
      return;
    }

    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not configured.");
      }
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Unable to initialize Supabase client.");

      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : undefined;

      const { error: resetError } = await client.auth.resetPasswordForEmail(
        parsed.data.email,
        redirectTo ? { redirectTo } : undefined
      );
      if (resetError) throw resetError;

      setSent(true);
      toast.success("Reset instructions sent if the account exists.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to process request right now."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-7 text-white">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl font-semibold tracking-tight">Reset password</h1>
        <p className="text-sm text-white/70">
          Enter your email and we&apos;ll send recovery instructions.
        </p>
      </div>

      {sent ? (
        <motion.div
          className="rounded-2xl border border-white/20 bg-white/10 p-5 text-center backdrop-blur-md"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
            <MailCheck className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium">Check your inbox</p>
          <p className="mt-1 text-xs text-white/65">
            If <span className="font-mono text-white/85">{email}</span> is
            registered, you&apos;ll receive a reset link shortly.
          </p>
        </motion.div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "email-error" : undefined}
              className={cn(
                "auth-glass-input w-full",
                error && "border-red-300/80"
              )}
            />
            {error ? (
              <p id="email-error" className="text-xs text-red-200">
                {error}
              </p>
            ) : null}
          </div>

          <motion.div whileTap={{ scale: 0.985 }}>
            <button
              type="submit"
              disabled={loading}
              className="auth-glass-button inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-white disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </motion.div>
        </form>
      )}

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  );
}
