import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { UserMe } from "@/types";

interface AuthState {
  token: string | null;
  user: UserMe | null;
  setAuth: (token: string, user: UserMe | null) => void;
  setUser: (user: UserMe | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    { name: "kph-auth" },
  ),
);
