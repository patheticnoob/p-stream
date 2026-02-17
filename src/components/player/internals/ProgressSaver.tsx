import { useEffect, useRef } from "react";
import { useInterval } from "react-use";

import {
  PROGRESS_SYNC_INTERVAL_MS,
  recordWatchHistoryEvent,
  upsertWatchProgress,
} from "@frontend/api";
import { playerStatus } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { ProgressItem, useProgressStore } from "@/stores/progress";

function progressIsNotStarted(duration: number, watched: number): boolean {
  if (watched < 20) return true;
  return false;
}

function progressIsCompleted(duration: number, watched: number): boolean {
  const timeFromEnd = duration - watched;
  if (timeFromEnd < 60 * 2) return true;
  return false;
}

function shouldSaveProgress(meta: any, progress: ProgressItem, existingItems: Record<string, any>): boolean {
  const { duration, watched } = progress;
  const isAcceptable = !progressIsNotStarted(duration, watched) && !progressIsCompleted(duration, watched);
  if (meta.type === "movie") return isAcceptable;
  if (isAcceptable) return true;

  const showItem = existingItems[meta.tmdbId];
  if (!showItem || !meta.season) return false;

  const seasonEpisodes = Object.values(showItem.episodes).filter(
    (episode: any) => episode.seasonId === meta.season.tmdbId,
  );

  return seasonEpisodes.some((episode: any) => {
    const epProgress = episode.progress;
    return !progressIsNotStarted(epProgress.duration, epProgress.watched) && !progressIsCompleted(epProgress.duration, epProgress.watched);
  });
}

export function ProgressSaver() {
  const meta = usePlayerStore((s) => s.meta);
  const progress = usePlayerStore((s) => s.progress);
  const updateItem = useProgressStore((s) => s.updateItem);
  const progressItems = useProgressStore((s) => s.items);
  const status = usePlayerStore((s) => s.status);
  const hasPlayedOnce = usePlayerStore((s) => s.mediaPlaying.hasPlayedOnce);

  const lastSavedRef = useRef<ProgressItem | null>(null);

  const dataRef = useRef({ updateItem, progressItems, meta, progress, status, hasPlayedOnce });
  useEffect(() => {
    dataRef.current = { updateItem, progressItems, meta, progress, status, hasPlayedOnce };
  }, [updateItem, progressItems, progress, meta, status, hasPlayedOnce]);

  useInterval(() => {
    const d = dataRef.current;
    if (!d.progress || !d.meta || !d.updateItem) return;
    if (d.status !== playerStatus.PLAYING) return;
    if (!d.hasPlayedOnce) return;

    const nextProgress = { duration: d.progress.duration, watched: d.progress.time };
    const isDifferent =
      !lastSavedRef.current ||
      lastSavedRef.current.duration !== nextProgress.duration ||
      lastSavedRef.current.watched !== nextProgress.watched;

    lastSavedRef.current = nextProgress;

    if (isDifferent && shouldSaveProgress(d.meta, nextProgress, d.progressItems)) {
      d.updateItem({ meta: d.meta, progress: nextProgress });
      upsertWatchProgress({
        mediaType: d.meta.type === "show" ? "show" : "movie",
        tmdbId: d.meta.tmdbId,
        seasonId: d.meta.season?.tmdbId,
        seasonNumber: d.meta.season?.number,
        episodeId: d.meta.episode?.tmdbId,
        episodeNumber: d.meta.episode?.number,
        watchedSeconds: nextProgress.watched,
        durationSeconds: nextProgress.duration,
      }).catch((error) => console.error("Failed to upsert watch progress", error));

      recordWatchHistoryEvent({
        mediaType: d.meta.type === "show" ? "show" : "movie",
        tmdbId: d.meta.tmdbId,
        seasonId: d.meta.season?.tmdbId,
        seasonNumber: d.meta.season?.number,
        episodeId: d.meta.episode?.tmdbId,
        episodeNumber: d.meta.episode?.number,
        event: "resume",
        watchedSeconds: nextProgress.watched,
        durationSeconds: nextProgress.duration,
        context: "progress-sync",
      }).catch(() => undefined);
    }
  }, PROGRESS_SYNC_INTERVAL_MS);

  return null;
}
