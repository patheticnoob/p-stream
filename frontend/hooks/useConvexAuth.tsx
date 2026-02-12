import { useCallback, useMemo } from "react";

import { useAuthStore } from "@/stores/auth";

export function useConvexAuth() {
  const account = useAuthStore((s) => s.account);

  const fetchAccessToken = useCallback(
    async () => account?.token ?? null,
    [account?.token],
  );

  return useMemo(
    () => ({
      isLoading: false,
      isAuthenticated: Boolean(account?.token),
      fetchAccessToken,
    }),
    [account?.token, fetchAccessToken],
  );
}
