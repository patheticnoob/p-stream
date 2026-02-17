import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const mediaArgs = {
  mediaType: v.union(v.literal("movie"), v.literal("show")),
  tmdbId: v.string(),
  seasonId: v.optional(v.string()),
  seasonNumber: v.optional(v.number()),
  episodeId: v.optional(v.string()),
  episodeNumber: v.optional(v.number()),
};

async function requireUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_external_id", (q: any) => q.eq("externalId", identity.subject))
    .first();

  if (!user) throw new Error("User not found");
  return user;
}

function computePercent(watchedSeconds: number, durationSeconds: number) {
  if (durationSeconds <= 0) return 0;
  return Math.max(0, Math.min(100, (watchedSeconds / durationSeconds) * 100));
}

export const upsert = mutation({
  args: {
    ...mediaArgs,
    watchedSeconds: v.number(),
    durationSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const percent = computePercent(args.watchedSeconds, args.durationSeconds);
    const completed = percent >= 90;

    const existing = await ctx.db
      .query("watchProgress")
      .withIndex("by_user_media_episode", (q) =>
        q
          .eq("userId", user._id)
          .eq("mediaType", args.mediaType)
          .eq("tmdbId", args.tmdbId)
          .eq("seasonId", args.seasonId)
          .eq("episodeId", args.episodeId),
      )
      .first();

    const payload = {
      userId: user._id,
      mediaType: args.mediaType,
      tmdbId: args.tmdbId,
      seasonId: args.seasonId,
      seasonNumber: args.seasonNumber,
      episodeId: args.episodeId,
      episodeNumber: args.episodeNumber,
      watchedSeconds: args.watchedSeconds,
      durationSeconds: args.durationSeconds,
      percent,
      completed,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return ctx.db.insert("watchProgress", payload);
  },
});

export const getResumePosition = query({
  args: mediaArgs,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    return ctx.db
      .query("watchProgress")
      .withIndex("by_user_media_episode", (q) =>
        q
          .eq("userId", user._id)
          .eq("mediaType", args.mediaType)
          .eq("tmdbId", args.tmdbId)
          .eq("seasonId", args.seasonId)
          .eq("episodeId", args.episodeId),
      )
      .first();
  },
});

export const listContinueWatching = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("watchProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return rows
      .filter((row: any) => row.percent > 0 && row.percent < 90)
      .sort((a: any, b: any) => b.updatedAt - a.updatedAt);
  },
});

export const recordHistoryEvent = mutation({
  args: {
    ...mediaArgs,
    event: v.union(v.literal("play"), v.literal("resume"), v.literal("complete")),
    watchedSeconds: v.optional(v.number()),
    durationSeconds: v.optional(v.number()),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const percent =
      args.watchedSeconds !== undefined && args.durationSeconds !== undefined
        ? computePercent(args.watchedSeconds, args.durationSeconds)
        : undefined;

    return ctx.db.insert("watchHistory", {
      userId: user._id,
      mediaType: args.mediaType,
      tmdbId: args.tmdbId,
      seasonId: args.seasonId,
      seasonNumber: args.seasonNumber,
      episodeId: args.episodeId,
      episodeNumber: args.episodeNumber,
      event: args.event,
      watchedSeconds: args.watchedSeconds,
      durationSeconds: args.durationSeconds,
      percent,
      timestamp: Date.now(),
      context: args.context,
    });
  },
});

export const importLegacy = mutation({
  args: {
    entries: v.array(
      v.object({
        ...mediaArgs,
        watchedSeconds: v.number(),
        durationSeconds: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    for (const entry of args.entries) {
      const percent = computePercent(entry.watchedSeconds, entry.durationSeconds);
      const completed = percent >= 90;
      const existing = await ctx.db
        .query("watchProgress")
        .withIndex("by_user_media_episode", (q) =>
          q
            .eq("userId", user._id)
            .eq("mediaType", entry.mediaType)
            .eq("tmdbId", entry.tmdbId)
            .eq("seasonId", entry.seasonId)
            .eq("episodeId", entry.episodeId),
        )
        .first();

      const payload = {
        userId: user._id,
        ...entry,
        percent,
        completed,
        updatedAt: Date.now(),
      };

      if (existing) await ctx.db.patch(existing._id, payload);
      else await ctx.db.insert("watchProgress", payload);
    }

    return { imported: args.entries.length };
  },
});
