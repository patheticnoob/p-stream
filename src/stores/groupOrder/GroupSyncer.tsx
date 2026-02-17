import { useEffect, useRef } from "react";

import { updateGroupOrderConvex } from "@frontend/api";
import { useConvexAuth } from "@frontend/hooks/useConvexAuth";
import { useGroupOrderStore } from "@/stores/groupOrder";

const syncIntervalMs = 5 * 1000;

export function GroupSyncer() {
  const groupOrder = useGroupOrderStore((s) => s.groupOrder);
  const lastSyncedOrder = useRef<string[]>([]);
  const isInitialized = useRef(false);
  const convexAuth = useConvexAuth();

  useEffect(() => {
    if (!isInitialized.current) {
      lastSyncedOrder.current = [...groupOrder];
      isInitialized.current = true;
    }
  }, [groupOrder]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!convexAuth.isAuthenticated) return;
      const currentOrder = useGroupOrderStore.getState().groupOrder;
      const hasChanged = JSON.stringify(currentOrder) !== JSON.stringify(lastSyncedOrder.current);

      if (hasChanged) {
        updateGroupOrderConvex(currentOrder)
          .then(() => {
            lastSyncedOrder.current = [...currentOrder];
          })
          .catch((err) => console.error("Failed to sync group order:", err));
      }
    }, syncIntervalMs);

    return () => clearInterval(interval);
  }, [convexAuth.isAuthenticated]);

  return null;
}
