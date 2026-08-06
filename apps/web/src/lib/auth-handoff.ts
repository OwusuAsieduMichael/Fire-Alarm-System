/** One-shot signup → login credential handoff (sessionStorage only). */

const HANDOFF_KEY = "fireguard.authHandoff";

export type AuthHandoff = {
  email: string;
  password: string;
  phone?: string;
};

export function storeAuthHandoff(handoff: AuthHandoff) {
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(handoff));
  } catch {
    // ignore quota / private mode
  }
}

export function peekAuthHandoff(): AuthHandoff | null {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthHandoff>;
    if (!parsed.email || !parsed.password) return null;
    return {
      email: String(parsed.email).trim(),
      password: String(parsed.password),
      phone: parsed.phone ? String(parsed.phone).trim() : undefined,
    };
  } catch {
    return null;
  }
}

export function consumeAuthHandoff(): AuthHandoff | null {
  const handoff = peekAuthHandoff();
  try {
    sessionStorage.removeItem(HANDOFF_KEY);
  } catch {
    // ignore
  }
  return handoff;
}
