import { requireConvexClient } from "./convexClient";

export const PROGRESS_SYNC_INTERVAL_MS = Number(
  import.meta.env.VITE_PROGRESS_SYNC_INTERVAL_MS ?? 7000,
);

export interface WatchProgressIdentity {
  mediaType: "movie" | "show";
  tmdbId: string;
  seasonId?: string;
  seasonNumber?: number;
  episodeId?: string;
  episodeNumber?: number;
}

export interface UpsertWatchProgressInput extends WatchProgressIdentity {
  watchedSeconds: number;
  durationSeconds: number;
}

export async function upsertWatchProgress(input: UpsertWatchProgressInput) {
  return requireConvexClient().mutation("watchProgress:upsert" as any, input as any);
}

export async function getResumePosition(input: WatchProgressIdentity) {
  return requireConvexClient().query("watchProgress:getResumePosition" as any, input as any);
}

export async function listContinueWatching() {
  return requireConvexClient().query("watchProgress:listContinueWatching" as any, {} as any);
}

export async function recordWatchHistoryEvent(
  input: WatchProgressIdentity & {
    event: "play" | "resume" | "complete";
    watchedSeconds?: number;
    durationSeconds?: number;
    context?: string;
  },
) {
  return requireConvexClient().mutation("watchProgress:recordHistoryEvent" as any, input as any);
}

export async function importLegacyWatchProgress(entries: UpsertWatchProgressInput[]) {
  return requireConvexClient().mutation("watchProgress:importLegacy" as any, { entries } as any);
}
