"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient, ApiError } from "@/lib/api";

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
      await apiClient.post(
        "/auth/forgot-password",
        { email: parsed.data.email },
        { skipAuth: true }
      );
      setSent(true);
      toast.success("Reset instructions sent if the account exists.");
    } catch (err) {
      // Soft-fail for portfolio demo if endpoint is not ready
      if (err instanceof ApiError && err.status === 404) {
        setSent(true);
        toast.message("If an account exists, reset instructions were sent.");
      } else {
        const message =
          err instanceof ApiError
            ? err.message
            : "Unable to process request right now.";
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send recovery instructions.
        </p>
      </div>

      {sent ? (
        <motion.div
          className="rounded-2xl border border-border/70 bg-muted/40 p-5 text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-success/15 text-success">
            <MailCheck className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium">Check your inbox</p>
          <p className="mt-1 text-xs text-muted-foreground">
            If <span className="font-mono">{email}</span> is registered, you&apos;ll
            receive a reset link shortly.
          </p>
        </motion.div>
      ) : (
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
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "email-error" : undefined}
            />
            {error ? (
              <p id="email-error" className="text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <motion.div whileTap={{ scale: 0.985 }}>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending…
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </motion.div>
        </form>
      )}

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  );
}
