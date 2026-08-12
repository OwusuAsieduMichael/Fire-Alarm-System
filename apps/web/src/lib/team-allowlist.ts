/**
 * Closed team allowlist — only these emails may sign up.
 */
export const TEAM_ALLOWED_EMAILS = [
  "geraldfrimpong10@gmail.com",
  "kelvinnanaba3@gmail.com",
  "danielwonder567@gmail.com",
  "akuaboachie80@gmail.com",
  "realkweku627@gmail.com",
] as const;

const allowedSet = new Set(
  TEAM_ALLOWED_EMAILS.map((email) => email.toLowerCase())
);

export function isTeamAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowedSet.has(email.trim().toLowerCase());
}

export const TEAM_SIGNUP_DENIED_MESSAGE =
  "This email is not on the FireGuard team list. Use your assigned team email, or log in if you already have an account.";
