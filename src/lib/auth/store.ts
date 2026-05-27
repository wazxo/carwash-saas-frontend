import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, AuthTokens } from "@/lib/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  hasPermission: (resource: string, action: string) => boolean;
  isSuperAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,
      setAuth: (user, tokens) =>
        set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, isLoading: false }),
      setAccessToken: (token) => set({ accessToken: token }),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isLoading: false }),
      hasPermission: (resource, action) => {
        const perms = get().user?.permissions ?? [];
        if (perms.includes("*:*")) return true;
        return perms.includes(`${resource}:${action}`);
      },
      isSuperAdmin: () => {
        const perms = get().user?.permissions ?? [];
        return perms.includes("*:*");
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
