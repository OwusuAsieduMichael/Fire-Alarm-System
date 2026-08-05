"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth-store";
import { useDeviceStore } from "@/stores/device-store";
import type { AuthLoginResponse, User } from "@/types";

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
        const data = await apiClient.post<AuthLoginResponse>(
          "/auth/login",
          { email, password },
          { skipAuth: true }
        );
        setAuth(data.user, data.accessToken);
        toast.success(`Welcome back, ${data.user.name.split(" ")[0]}`);
        router.replace("/dashboard");
        return data;
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Unable to sign in. Check your credentials.";
        toast.error(message);
        throw error;
      }
    },
    [setAuth, router]
  );

  const logout = useCallback(() => {
    disconnectSocket();
    resetLive();
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
    logout,
    setUser: updateUser,
  };
}
