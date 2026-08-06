"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { storeAuthHandoff } from "@/lib/auth-handoff";
import {
  authErrorMessage,
  isEmailNotConfirmedError,
} from "@/lib/auth-errors";
import { disconnectSocket } from "@/lib/socket";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  ensureProfilePhone,
  fetchProfile,
} from "@/lib/supabase/profile";
import { useAuthStore } from "@/stores/auth-store";
import { useDeviceStore } from "@/stores/device-store";
import type { User } from "@/types";

export type SignUpInput = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
    );
  }
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error("Unable to initialize Supabase client.");
  }
  return client;
}

export function useAuth() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logoutStore = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const resetLive = useDeviceStore((s) => s.resetLive);

  const isAuthenticated = Boolean(token && user);

  const login = useCallback(
    async (
      email: string,
      password: string,
      options?: { phone?: string; quiet?: boolean }
    ) => {
      try {
        const client = requireSupabase();
        const trimmedEmail = email.trim().toLowerCase();

        // Confirm first so signup → login never hits inbox / rate limits.
        await fetch("/api/auth/confirm-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail }),
        }).catch(() => null);

        let { data, error } = await client.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error && isEmailNotConfirmedError(error)) {
          const confirmRes = await fetch("/api/auth/confirm-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: trimmedEmail }),
          });
          const confirmBody = (await confirmRes.json().catch(() => ({}))) as {
            error?: string;
          };

          if (!confirmRes.ok) {
            throw new Error(
              confirmBody.error ||
                "Email is not confirmed. Check your inbox or enable service role for presentation unlock."
            );
          }

          const retry = await client.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });
          data = retry.data;
          error = retry.error;
        }

        if (error) throw error;
        if (!data.session?.user) {
          throw new Error("Sign-in failed. No session returned.");
        }

        if (options?.phone) {
          await ensureProfilePhone(
            client,
            data.session.user.id,
            options.phone
          );
        }

        const profile = await fetchProfile(client, data.session.user.id);
        if (!profile) {
          throw new Error(
            "Account exists but profile is missing. Run the Supabase schema SQL, then try again."
          );
        }

        setAuth(profile, data.session.access_token);
        if (!options?.quiet) {
          toast.success(`Welcome back, ${profile.name.split(" ")[0]}`);
        }
        router.replace("/dashboard");
        return { user: profile, accessToken: data.session.access_token };
      } catch (error) {
        if (!isEmailNotConfirmedError(error)) {
          toast.error(
            authErrorMessage(
              error,
              "Unable to sign in. Check your credentials."
            )
          );
        }
        throw error;
      }
    },
    [setAuth, router]
  );

  const resendConfirmationEmail = useCallback(async (email: string) => {
    const client = requireSupabase();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      throw new Error("Enter your email address first.");
    }

    const { error } = await client.auth.resend({
      type: "signup",
      email: trimmed,
    });

    if (error) throw error;
    return true;
  }, []);

  /** Presentation: server ensures confirmed account (no email), then adopts session. */
  const presentationLogin = useCallback(async () => {
    try {
      const client = requireSupabase();
      const res = await fetch("/api/auth/presentation", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        access_token?: string;
        refresh_token?: string;
      };

      if (!res.ok) {
        throw new Error(body.error || "Presentation login is unavailable.");
      }
      if (!body.access_token || !body.refresh_token) {
        throw new Error("Presentation login returned no session.");
      }

      const { data, error } = await client.auth.setSession({
        access_token: body.access_token,
        refresh_token: body.refresh_token,
      });
      if (error) throw error;
      if (!data.session?.user) {
        throw new Error("Presentation session could not be established.");
      }

      const profile = await fetchProfile(client, data.session.user.id);
      if (!profile) {
        throw new Error(
          "Presentation account profile is missing. Run supabase/schema.sql, then try again."
        );
      }

      setAuth(profile, data.session.access_token);
      toast.success(`Welcome, ${profile.name.split(" ")[0]}`);
      router.replace("/dashboard");
      return { user: profile, accessToken: data.session.access_token };
    } catch (error) {
      toast.error(
        authErrorMessage(error, "Unable to enter presentation mode.")
      );
      throw error;
    }
  }, [setAuth, router]);

  const signUp = useCallback(
    async (input: SignUpInput) => {
      try {
        requireSupabase();
        const fullName = input.fullName.trim();
        const email = input.email.trim().toLowerCase();
        const phone = input.phone.trim();

        // Admin create (confirmed, no confirmation email / rate limits).
        const registerRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password: input.password,
            fullName,
            phone,
          }),
        });
        const registerBody = (await registerRes.json().catch(() => ({}))) as {
          error?: string;
        };

        if (!registerRes.ok) {
          throw new Error(
            registerBody.error || "Unable to create your account."
          );
        }

        storeAuthHandoff({
          email,
          password: input.password,
          phone,
        });
        toast.success("Account ready — signing you in…");
        router.replace("/login?autologin=1");
        return { needsConfirmation: false as const, handoff: true as const };
      } catch (error) {
        toast.error(
          authErrorMessage(error, "Unable to create your account.")
        );
        throw error;
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    disconnectSocket();
    resetLive();
    try {
      const client = getSupabaseBrowserClient();
      if (client) await client.auth.signOut();
    } catch {
      // ignore sign-out network errors
    }
    logoutStore();
    toast.message("Signed out");
    router.replace("/login");
  }, [logoutStore, resetLive, router]);

  const updateUser = useCallback(
    (next: User | null) => {
      setUser(next);
    },
    [setUser]
  );

  return {
    user,
    token,
    hydrated,
    isAuthenticated,
    login,
    signUp,
    presentationLogin,
    resendConfirmationEmail,
    logout,
    setUser: updateUser,
  };
}
