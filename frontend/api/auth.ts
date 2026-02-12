import { requireConvexClient } from "./convexClient";

export async function upsertConvexUser() {
  return requireConvexClient().mutation("auth:upsertUser" as any, {});
}
