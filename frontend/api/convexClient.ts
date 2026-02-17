import { ConvexReactClient } from "convex/react";

const convexUrl =
  import.meta.env.NEXT_PUBLIC_CONVEX_URL ?? import.meta.env.VITE_CONVEX_URL;

export const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function requireConvexClient() {
  if (!convexClient) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL (or VITE_CONVEX_URL for backwards compatibility) is required to use Convex client APIs",
    );
  }
  return convexClient;
}
