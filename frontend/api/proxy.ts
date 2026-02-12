import { requireConvexClient } from "./convexClient";

export async function setProxyValue(input: { key: string; value: string }) {
  return requireConvexClient().mutation("proxy:set" as any, input as any);
}
