import { requireConvexClient } from "./convexClient";

export async function setWatchProgress(input: {
  userId: string;
  mediaId: string;
  progress: number;
}) {
  return requireConvexClient().mutation(
    "watchProgress:set" as any,
    input as any,
  );
}
