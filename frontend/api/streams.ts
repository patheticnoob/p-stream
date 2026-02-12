import { requireConvexClient } from "./convexClient";

export async function upsertStream(input: {
  userId: string;
  mediaId: string;
  status: string;
}) {
  return requireConvexClient().mutation("streams:upsert" as any, input as any);
}
