"use client";

import * as React from "react";
import { Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type EmailConfirmNoticeProps = {
  email: string;
  variant: "pending" | "blocked";
  resending: boolean;
  cooldownSeconds: number;
  resendMessage?: string | null;
  resendError?: string | null;
  onResend: () => void;
  className?: string;
};

export function EmailConfirmNotice({
  email,
  variant,
  resending,
  cooldownSeconds,
  resendMessage,
  resendError,
  onResend,
  className,
}: EmailConfirmNoticeProps) {
  const canResend = !resending && cooldownSeconds <= 0;
  const title =
    variant === "pending"
      ? "Confirm your email to continue"
      : "Email not confirmed yet";
  const body =
    variant === "pending"
      ? `We sent a confirmation link to ${email || "your inbox"}. Open it, then sign in here.`
      : `Sign-in is blocked until you confirm ${email || "your email"}. Check your inbox (and spam), or resend a new link.`;

  return (
    <div
      role="status"
      className={cn(
        "rounded-2xl border px-4 py-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        variant === "pending"
          ? "border-emerald-300/35 bg-emerald-500/15"
          : "border-amber-300/40 bg-amber-500/15",
        className
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            variant === "pending" ? "bg-emerald-400/20" : "bg-amber-400/20"
          )}
        >
          <Mail
            className={cn(
              "h-4 w-4",
              variant === "pending" ? "text-emerald-100" : "text-amber-100"
            )}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs leading-relaxed text-white/75">{body}</p>
          </div>

          <button
            type="button"
            onClick={onResend}
            disabled={!canResend}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white underline-offset-4 transition-opacity hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline"
          >
            {resending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending…
              </>
            ) : cooldownSeconds > 0 ? (
              `Resend available in ${cooldownSeconds}s`
            ) : (
              "Resend confirmation email"
            )}
          </button>

          {resendMessage ? (
            <p className="text-xs text-emerald-100/90">{resendMessage}</p>
          ) : null}
          {resendError ? (
            <p className="text-xs text-red-200">{resendError}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
