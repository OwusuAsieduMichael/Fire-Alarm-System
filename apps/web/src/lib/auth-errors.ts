/** Detect Supabase "email not confirmed" sign-in failures. */
export function isEmailNotConfirmedError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const record = error as {
    code?: string;
    message?: string;
    status?: number;
  };

  const code = (record.code ?? "").toLowerCase();
  if (code === "email_not_confirmed") return true;

  const message = (record.message ?? "").toLowerCase();
  return (
    message.includes("email not confirmed") ||
    message.includes("email_not_confirmed") ||
    message.includes("confirm your email")
  );
}

export function authErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
