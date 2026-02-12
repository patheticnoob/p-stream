import { mutation } from "./_generated/server";

export const upsertUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", identity.subject))
      .first();

    if (existing) {
      return existing._id;
    }

    return ctx.db.insert("users", {
      externalId: identity.subject,
      nickname: identity.name,
      createdAt: Date.now(),
    });
  },
});
