"use client";

import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  setHydrated: (value: boolean) => void;
  isDeveloper: () => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  hydrated: false,
  setAuth: (user, token) => set({ user, token }),
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null }),
  setHydrated: (hydrated) => set({ hydrated }),
  isDeveloper: () => get().user?.role === "DEVELOPER",
}));
