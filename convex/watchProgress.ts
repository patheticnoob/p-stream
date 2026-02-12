import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { userId: v.id("users"), mediaId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("watchProgress")
      .withIndex("by_user_media", (q) =>
        q.eq("userId", args.userId).eq("mediaId", args.mediaId),
      )
      .first();
  },
});

export const set = mutation({
  args: { userId: v.id("users"), mediaId: v.string(), progress: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("watchProgress")
      .withIndex("by_user_media", (q) =>
        q.eq("userId", args.userId).eq("mediaId", args.mediaId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        progress: args.progress,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("watchProgress", {
      userId: args.userId,
      mediaId: args.mediaId,
      progress: args.progress,
      updatedAt: Date.now(),
    });
  },
});
