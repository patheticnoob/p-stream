import { useEffect } from "react";

import { removeFavorite, upsertFavorite } from "@frontend/api";
import { useConvexAuth } from "@frontend/hooks/useConvexAuth";
import { BookmarkUpdateItem, useBookmarkStore } from "@/stores/bookmarks";

const syncIntervalMs = 5 * 1000;

async function syncBookmarks(items: BookmarkUpdateItem[], finish: (id: string) => void) {
  for (const item of items) {
    finish(item.id);

    try {
      if (item.action === "delete") {
        await removeFavorite({ mediaType: item.type === "show" ? "show" : "movie", tmdbId: item.tmdbId });
        continue;
      }

      if (item.action === "add") {
        await upsertFavorite({ mediaType: item.type === "show" ? "show" : "movie", tmdbId: item.tmdbId });
      }
    } catch (err) {
      console.error(`Failed to sync bookmark: ${item.tmdbId} - ${item.action}`, err);
    }
  }
}

export function BookmarkSyncer() {
  const clearUpdateQueue = useBookmarkStore((s) => s.clearUpdateQueue);
  const removeUpdateItem = useBookmarkStore((s) => s.removeUpdateItem);
  const convexAuth = useConvexAuth();

  useEffect(() => {
    clearUpdateQueue();
  }, [clearUpdateQueue]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!convexAuth.isAuthenticated) return;
      const state = useBookmarkStore.getState();
      syncBookmarks(state.updateQueue, removeUpdateItem);
    }, syncIntervalMs);

    return () => clearInterval(interval);
  }, [removeUpdateItem, convexAuth.isAuthenticated]);

  return null;
}
