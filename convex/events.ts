import { query } from "./schema";
import { v } from "convex/values";

// Get an event by ID
export const getEvent = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get events by load ID
export const getEventsByLoad = query({
  args: {
    loadId: v.id("loads"),
    limit: v.optional(v.number()),
    startAfter: v.optional(v.id("events")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("events")
      .withIndex("by_load", (q) => q.eq("loadId", args.loadId))
      .order("desc");

    if (args.startAfter) {
      const startAfterEvent = await ctx.db.get(args.startAfter);
      if (startAfterEvent) {
        query = query.filter((q) =>
          q.lt(q.field("timestamp"), startAfterEvent.timestamp),
        );
      }
    }

    if (args.limit) {
      query = query.take(args.limit);
    }

    return await query.collect();
  },
});

// Get events by user ID
export const getEventsByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    startAfter: v.optional(v.id("events")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.startAfter) {
      const startAfterEvent = await ctx.db.get(args.startAfter);
      if (startAfterEvent) {
        query = query.filter((q) =>
          q.lt(q.field("timestamp"), startAfterEvent.timestamp),
        );
      }
    }

    if (args.limit) {
      query = query.take(args.limit);
    }

    return await query.collect();
  },
});

// Get events by event type
export const getEventsByType = query({
  args: {
    eventType: v.string(),
    loadId: v.optional(v.id("loads")),
    limit: v.optional(v.number()),
    startAfter: v.optional(v.id("events")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("events")
      .withIndex("by_event_type", (q) => q.eq("eventType", args.eventType))
      .order("desc");

    if (args.loadId) {
      query = query.filter((q) => q.eq(q.field("loadId"), args.loadId));
    }

    if (args.startAfter) {
      const startAfterEvent = await ctx.db.get(args.startAfter);
      if (startAfterEvent) {
        query = query.filter((q) =>
          q.lt(q.field("timestamp"), startAfterEvent.timestamp),
        );
      }
    }

    if (args.limit) {
      query = query.take(args.limit);
    }

    return await query.collect();
  },
});

// Get events by timestamp range
export const getEventsByTimeRange = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
    loadId: v.optional(v.id("loads")),
    eventType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("events")
      .withIndex("by_timestamp")
      .filter(
        (q) =>
          q.gte(q.field("timestamp"), args.startTime) &&
          q.lte(q.field("timestamp"), args.endTime),
      )
      .order("desc");

    if (args.loadId) {
      query = query.filter((q) => q.eq(q.field("loadId"), args.loadId));
    }

    if (args.eventType) {
      query = query.filter((q) => q.eq(q.field("eventType"), args.eventType));
    }

    if (args.limit) {
      query = query.take(args.limit);
    }

    return await query.collect();
  },
});

// Get recent events across all loads
export const getRecentEvents = query({
  args: {
    limit: v.optional(v.number()),
    startAfter: v.optional(v.id("events")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("events").withIndex("by_timestamp").order("desc");

    if (args.startAfter) {
      const startAfterEvent = await ctx.db.get(args.startAfter);
      if (startAfterEvent) {
        query = query.filter((q) =>
          q.lt(q.field("timestamp"), startAfterEvent.timestamp),
        );
      }
    }

    if (args.limit) {
      query = query.take(args.limit);
    } else {
      query = query.take(50); // Default limit
    }

    return await query.collect();
  },
});
