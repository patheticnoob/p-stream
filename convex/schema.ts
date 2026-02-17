import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
    mediaId: v.string(),
    progress: v.number(),
    updatedAt: v.number(),
  }).index("by_user_media", ["userId", "mediaId"]),
  proxy: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
