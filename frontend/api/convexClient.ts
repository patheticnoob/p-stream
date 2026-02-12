import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

export const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function requireConvexClient() {
  if (!convexClient) {
    throw new Error("VITE_CONVEX_URL is required to use Convex client APIs");
  }
  return convexClient;
}
