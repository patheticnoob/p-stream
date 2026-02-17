import { requireConvexClient } from "./convexClient";

export async function fetchCurrentUser() {
  return requireConvexClient().query("users:me" as any, {});
}

export async function updateCurrentUserProfile(input: {
  nickname?: string;
  profile?: {
    colorA: string;
    colorB: string;
    icon: string;
  };
  deviceName?: string;
  platform?: string;
  userAgent?: string;
}) {
  return requireConvexClient().mutation("users:updateProfile" as any, input);
}


export async function updateGroupOrderConvex(groupOrder: string[]) {
  return requireConvexClient().mutation("users:updateGroupOrder" as any, { groupOrder } as any);
}
