import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("streams")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    userId: v.id("users"),
    mediaId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("streams")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("mediaId"), args.mediaId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("streams", {
      userId: args.userId,
      mediaId: args.mediaId,
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
