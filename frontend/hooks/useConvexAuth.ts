import { useCallback, useMemo } from "react";

import { useAuthStore } from "@/stores/auth";

/**
 * Bridge legacy account storage into Convex provider auth contract.
 * @deprecated Use real Convex Auth provider once backend migration is complete.
 */
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
