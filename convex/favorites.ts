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

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return ctx.db.query("favorites").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
  },
});

export const upsert = mutation({
  args: mediaArgs,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_media", (q) =>
        q
          .eq("userId", user._id)
          .eq("mediaType", args.mediaType)
          .eq("tmdbId", args.tmdbId)
          .eq("seasonId", args.seasonId)
          .eq("episodeId", args.episodeId),
      )
      .first();

    if (existing) return existing._id;
    return ctx.db.insert("favorites", { userId: user._id, ...args, createdAt: Date.now() });
  },
});

export const remove = mutation({
  args: mediaArgs,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_media", (q) =>
        q
          .eq("userId", user._id)
          .eq("mediaType", args.mediaType)
          .eq("tmdbId", args.tmdbId)
          .eq("seasonId", args.seasonId)
          .eq("episodeId", args.episodeId),
      )
      .first();

    if (existing) await ctx.db.delete(existing._id);
    return { removed: Boolean(existing) };
  },
});
