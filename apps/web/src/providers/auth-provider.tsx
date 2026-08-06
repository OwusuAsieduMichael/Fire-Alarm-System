"use client";

import * as React from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchProfile } from "@/lib/supabase/profile";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Keeps Zustand auth in sync with the Supabase session.
 * Clears stale local JWT tokens when Supabase is the source of truth.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  React.useEffect(() => {
    let cancelled = false;
    const client = getSupabaseBrowserClient();

    async function syncSession() {
      if (!isSupabaseConfigured() || !client) {
        logout();
        if (!cancelled) setHydrated(true);
        return;
      }

      try {
        const { data } = await client.auth.getSession();
        const session = data.session;

        if (!session?.user) {
          logout();
          return;
        }

        const profile = await fetchProfile(client, session.user.id);
        if (!profile) {
          logout();
          return;
        }

        if (!cancelled) {
          setAuth(profile, session.access_token);
        }
      } catch {
        logout();
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    void syncSession();

    if (!client) return;

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        if (!session?.user) {
          logout();
          return;
        }
        const profile = await fetchProfile(client, session.user.id);
        if (profile) {
          setAuth(profile, session.access_token);
        } else {
          logout();
        }
      })();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [logout, setAuth, setHydrated]);

  return <>{children}</>;
}
