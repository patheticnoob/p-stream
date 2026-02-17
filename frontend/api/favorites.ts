import { requireConvexClient } from "./convexClient";
import { WatchProgressIdentity } from "./watchProgress";

export async function upsertFavorite(input: WatchProgressIdentity) {
  return requireConvexClient().mutation("favorites:upsert" as any, input as any);
}

export async function removeFavorite(input: WatchProgressIdentity) {
  return requireConvexClient().mutation("favorites:remove" as any, input as any);
}
