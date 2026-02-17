import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const mediaIdentity = {
  mediaType: v.union(v.literal("movie"), v.literal("show")),
  tmdbId: v.string(),
  seasonId: v.optional(v.string()),
  seasonNumber: v.optional(v.number()),
  episodeId: v.optional(v.string()),
  episodeNumber: v.optional(v.number()),
};

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    email: v.optional(v.string()),
    nickname: v.string(),
    profile: v.object({
      colorA: v.string(),
      colorB: v.string(),
      icon: v.string(),
    }),
    groupOrder: v.optional(v.array(v.string())),
    safeSettings: v.optional(
      v.object({
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
      }),
    ),
    currentDevice: v.optional(
      v.object({
        deviceId: v.string(),
        deviceName: v.string(),
        platform: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        lastSeenAt: v.number(),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastSeenAt: v.number(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_email", ["email"]),
  streams: defineTable({
    userId: v.id("users"),
    mediaId: v.string(),
    status: v.string(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  watchProgress: defineTable({
    userId: v.id("users"),
    ...mediaIdentity,
    watchedSeconds: v.number(),
    durationSeconds: v.number(),
    percent: v.number(),
    completed: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_media", ["userId", "mediaType", "tmdbId"])
    .index("by_user_media_episode", [
      "userId",
      "mediaType",
      "tmdbId",
      "seasonId",
      "episodeId",
    ]),
  watchHistory: defineTable({
    userId: v.id("users"),
    ...mediaIdentity,
    event: v.union(
      v.literal("play"),
      v.literal("resume"),
      v.literal("complete"),
    ),
    watchedSeconds: v.optional(v.number()),
    durationSeconds: v.optional(v.number()),
    percent: v.optional(v.number()),
    timestamp: v.number(),
    context: v.optional(v.string()),
  }).index("by_user", ["userId"]),
  favorites: defineTable({
    userId: v.id("users"),
    ...mediaIdentity,
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_media", [
      "userId",
      "mediaType",
      "tmdbId",
      "seasonId",
      "episodeId",
    ]),
  proxy: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
