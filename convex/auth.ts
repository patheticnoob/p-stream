import { mutation } from "./_generated/server";

/**
 * Convex auth provider manifest. This is used by deployment/runtime wiring
 * and keeps placeholders for future OAuth providers.
 */
export const authProviders = {
  anonymous: { enabled: true },
  email: {
    enabled: true,
    strategies: ["password", "magic_link"] as const,
  },
  oauth: {
    google: {
      enabled: false,
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET ?? "",
    },
    github: {
      enabled: false,
      clientId: process.env.AUTH_GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET ?? "",
    },
    discord: {
      enabled: false,
      clientId: process.env.AUTH_DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.AUTH_DISCORD_CLIENT_SECRET ?? "",
    },
  },
};

export const upsertUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", identity.subject))
      .first();

    const now = Date.now();
    const email = (identity.email as string | undefined) ?? undefined;
    const nickname = identity.name ?? email?.split("@")[0] ?? "Guest";

    if (existing) {
      await ctx.db.patch(existing._id, {
        nickname,
        email,
        lastSeenAt: now,
      });
      return existing._id;
    }

    return ctx.db.insert("users", {
      externalId: identity.subject,
      nickname,
      email,
      profile: {
        colorA: "#8B5CF6",
        colorB: "#EC4899",
        icon: "person",
      },
      currentDevice: undefined,
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
    });
  },
});
