"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
    async (email: string, password: string) => {
      try {
        const client = requireSupabase();
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        if (!data.session?.user) {
          throw new Error("Sign-in failed. No session returned.");
        }

        const profile = await fetchProfile(client, data.session.user.id);
        if (!profile) {
          throw new Error(
            "Account exists but profile is missing. Run the Supabase schema SQL, then try again."
          );
        }

        setAuth(profile, data.session.access_token);
        toast.success(`Welcome back, ${profile.name.split(" ")[0]}`);
        router.replace("/dashboard");
        return { user: profile, accessToken: data.session.access_token };
      } catch (error) {
        // Inline UI on the login form handles unconfirmed email.
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

  const signUp = useCallback(
    async (input: SignUpInput) => {
      try {
        const client = requireSupabase();
        const fullName = input.fullName.trim();
        const email = input.email.trim().toLowerCase();
        const phone = input.phone.trim();

        const { data, error } = await client.auth.signUp({
          email,
          password: input.password,
          options: {
            data: {
              name: fullName,
              full_name: fullName,
              phone,
              sms: phone,
            },
          },
        });

        if (error) throw error;
        if (!data.user) {
          throw new Error("Sign-up failed. No user returned.");
        }

        // Email confirmation enabled → no session until confirmed
        if (!data.session) {
          const params = new URLSearchParams({
            verify: "pending",
            email,
          });
          router.replace(`/login?${params.toString()}`);
          return { needsConfirmation: true as const };
        }

        await ensureProfilePhone(client, data.session.user.id, phone);
        const profile = await fetchProfile(client, data.session.user.id);
        if (!profile) {
          throw new Error(
            "Account created but profile is missing. Run supabase/schema.sql (or patch-profile-phone.sql), then sign in."
          );
        }

        setAuth(profile, data.session.access_token);
        toast.success(`Welcome, ${profile.name.split(" ")[0]}`);
        router.replace("/dashboard");
        return { needsConfirmation: false as const, user: profile };
      } catch (error) {
        toast.error(
          authErrorMessage(error, "Unable to create your account.")
        );
        throw error;
      }
    },
    [setAuth, router]
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
    resendConfirmationEmail,
    logout,
    setUser: updateUser,
  };
}
