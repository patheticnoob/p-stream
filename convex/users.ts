import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_external_id", (q: any) =>
      q.eq("externalId", identity.subject),
    )
    .first();

  if (!user) throw new Error("User not found");
  return user;
}

const safeSettingsValidator = v.object({
  language: v.optional(v.string()),
  theme: v.optional(v.union(v.string(), v.null())),
  autoplay: v.optional(v.boolean()),
  subtitles: v.optional(
    v.object({
      language: v.optional(v.string()),
      native: v.optional(v.boolean()),
    }),
  ),
  accessibility: v.optional(
    v.object({
      lowPerformanceMode: v.optional(v.boolean()),
      holdToBoost: v.optional(v.boolean()),
      doubleClickToSeek: v.optional(v.boolean()),
    }),
  ),
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", identity.subject))
      .first();
  },
});

export const getSafeSettings = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return user.safeSettings ?? {};
  },
});

export const updateSafeSettings = mutation({
  args: {
    settings: safeSettingsValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ctx.db.patch(user._id, {
      safeSettings: args.settings,
      updatedAt: Date.now(),
    });
    return args.settings;
  },
});

export const updateProfile = mutation({
  args: {
    nickname: v.optional(v.string()),
    profile: v.optional(
      v.object({
        colorA: v.string(),
        colorB: v.string(),
        icon: v.string(),
      }),
    ),
    deviceName: v.optional(v.string()),
    platform: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    await ctx.db.patch(user._id, {
      nickname: args.nickname ?? user.nickname,
      profile: args.profile ?? user.profile,
      currentDevice: args.deviceName
        ? {
            deviceId: user.currentDevice?.deviceId ?? crypto.randomUUID(),
            deviceName: args.deviceName,
            platform: args.platform,
            userAgent: args.userAgent,
            lastSeenAt: now,
          }
        : user.currentDevice,
      updatedAt: now,
      lastSeenAt: now,
    });

    return ctx.db.get(user._id);
  },
});

export const updateGroupOrder = mutation({
  args: {
    groupOrder: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ctx.db.patch(user._id, {
      groupOrder: args.groupOrder,
      updatedAt: Date.now(),
    });
    return ctx.db.get(user._id);
  },
});
