import { useEffect } from "react";

import {
  importLegacyWatchProgress,
  PROGRESS_SYNC_INTERVAL_MS,
  upsertWatchProgress,
} from "@frontend/api";
import { useConvexAuth } from "@frontend/hooks/useConvexAuth";
import { ProgressUpdateItem, useProgressStore } from "@/stores/progress";

function mapProgressUpdate(item: ProgressUpdateItem) {
  return {
    mediaType: (item.type === "show" ? "show" : "movie") as "show" | "movie",
    tmdbId: item.tmdbId,
    seasonId: item.seasonId,
    seasonNumber: item.seasonNumber,
    episodeId: item.episodeId,
    episodeNumber: item.episodeNumber,
    watchedSeconds: item.progress?.watched ?? 0,
    durationSeconds: item.progress?.duration ?? 0,
  };
}

async function syncProgress(items: ProgressUpdateItem[], finish: (id: string) => void) {
  for (const item of items) {
    finish(item.id);
    if (item.action !== "upsert") continue;

    try {
      await upsertWatchProgress(mapProgressUpdate(item));
    } catch (err) {
      console.error(`Failed to sync progress: ${item.tmdbId} - ${item.action}`, err);
    }
  }
}

export function ProgressSyncer() {
  const clearUpdateQueue = useProgressStore((s) => s.clearUpdateQueue);
  const removeUpdateItem = useProgressStore((s) => s.removeUpdateItem);
  const convexAuth = useConvexAuth();

  useEffect(() => {
    clearUpdateQueue();
  }, [clearUpdateQueue]);

  useEffect(() => {
    if (!convexAuth.isAuthenticated) return;

    const migrationKey = "__MW::convexProgressMigrated";
    if (localStorage.getItem(migrationKey)) return;

    const legacyItems = useProgressStore.getState().items;
    const entries: any[] = [];
    for (const [tmdbId, item] of Object.entries(legacyItems)) {
      if (item.type === "movie") {
        if (!item.progress) continue;
        entries.push({
          mediaType: "movie" as const,
          tmdbId,
          watchedSeconds: item.progress.watched,
          durationSeconds: item.progress.duration,
        });
        continue;
      }

      for (const episode of Object.values(item.episodes)) {
        entries.push({
          mediaType: "show" as const,
          tmdbId,
          seasonId: episode.seasonId,
          episodeId: episode.id,
          seasonNumber: item.seasons[episode.seasonId]?.number,
          episodeNumber: episode.number,
          watchedSeconds: episode.progress.watched,
          durationSeconds: episode.progress.duration,
        });
      }
    }

    if (entries.length === 0) {
      localStorage.setItem(migrationKey, "1");
      return;
    }

    importLegacyWatchProgress(entries)
      .then(() => localStorage.setItem(migrationKey, "1"))
      .catch((error) => console.error("Failed to import legacy progress to Convex", error));
  }, [convexAuth.isAuthenticated]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!convexAuth.isAuthenticated) return;
      const state = useProgressStore.getState();
      syncProgress(state.updateQueue, removeUpdateItem);
    }, PROGRESS_SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [removeUpdateItem, convexAuth.isAuthenticated]);

  return null;
}
