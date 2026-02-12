import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    nickname: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_external_id", ["externalId"]),
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
