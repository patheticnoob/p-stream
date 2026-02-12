import { requireConvexClient } from "./convexClient";

export async function fetchCurrentUser() {
  return requireConvexClient().query("users:me" as any, {});
}
