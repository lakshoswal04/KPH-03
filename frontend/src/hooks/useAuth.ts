"use client";

import { useEffect } from "react";

import { apiGet, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { UserMe } from "@/types";

/** Auth convenience hook. On mount it validates the persisted token against
 * GET /auth/me, refreshing the cached user or clearing auth on 401. */
export function useAuth() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    apiGet<UserMe>("/auth/me", token)
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch((err) => {
        if (!cancelled && err instanceof ApiError && err.status === 401) clearAuth();
      });
    return () => {
      cancelled = true;
    };
    // Re-validate only when the token itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return {
    token,
    user,
    isAuthenticated: Boolean(token),
    setAuth,
    setUser,
    logout: clearAuth,
  };
}
