import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Log an action to the load history audit trail
 */
export const logAction = mutation({
  args: {
    loadId: v.id("loads"),
    userId: v.id("users"),
    actionType: v.string(),
    details: v.object({
      before: v.optional(v.any()),
      after: v.optional(v.any()),
      description: v.string(),
      metadata: v.optional(v.record(v.string(), v.any())),
    }),
  },
  handler: async (ctx, args) => {
    const { loadId, userId, actionType, details } = args;

    // Validate that the load exists
    const load = await ctx.db.get(loadId);
    if (!load) {
      throw new Error(`Load with ID ${loadId} not found`);
    }

    // Validate that the user exists
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Create the audit log entry
    const historyId = await ctx.db.insert("load_history", {
      loadId,
      userId,
      actionType,
      details,
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
    });

    return { success: true, historyId };
  },
});

/**
 * Get the complete history for a specific load
 */
export const getLoadHistory = query({
  args: {
    loadId: v.id("loads"),
  },
  handler: async (ctx, args) => {
    const { loadId } = args;

    return await ctx.db
      .query("load_history")
      .withIndex("by_load", (q) => q.eq("loadId", loadId))
      .order("desc", (q) => q.field("timestamp"))
      .collect();
  },
});

/**
 * Get filtered load history based on various criteria
 */
export const getFilteredLoadHistory = query({
  args: {
    loadId: v.id("loads"),
    filters: v.optional(
      v.object({
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        actionType: v.optional(v.string()),
        userId: v.optional(v.id("users")),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { loadId, filters } = args;

    // Start with base query for this load
    let query = ctx.db
      .query("load_history")
      .withIndex("by_load", (q) => q.eq("loadId", loadId));

    // Apply filters if provided
    if (filters) {
      if (filters.startDate) {
        query = query.filter((q) =>
          q.gte(q.field("timestamp"), filters.startDate!),
        );
      }

      if (filters.endDate) {
        query = query.filter((q) =>
          q.lte(q.field("timestamp"), filters.endDate!),
        );
      }

      if (filters.actionType) {
        query = query.filter((q) =>
          q.eq(q.field("actionType"), filters.actionType!),
        );
      }

      if (filters.userId) {
        query = query.filter((q) => q.eq(q.field("userId"), filters.userId!));
      }
    }

    // Return ordered results
    return await query.order("desc", (q) => q.field("timestamp")).collect();
  },
});

/**
 * Get load history by user role with appropriate filtering
 */
export const getLoadHistoryByRole = query({
  args: {
    loadId: v.id("loads"),
    userId: v.id("users"),
    role: v.string(),
    filters: v.optional(
      v.object({
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        actionType: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { loadId, userId, role, filters } = args;

    // Verify the user has access to this load
    const user = await ctx.db.get(args.userId);
    const load = await ctx.db.get(args.loadId);

    if (!user || !load) {
      throw new Error("User or load not found");
    }

    // Base query to filter by load ID
    let query = ctx.db
      .query("load_history")
      .withIndex("by_load", (q) => q.eq("loadId", loadId));

    // Apply role-specific filters
    if (role === "shipper") {
      // Shippers see status changes, carrier assignments, and delivery events
      query = query.filter((q) =>
        q.or(
          q.eq(q.field("actionType"), "STATUS_CHANGE"),
          q.eq(q.field("actionType"), "CARRIER_ASSIGNED"),
          q.eq(q.field("actionType"), "DELIVERY_CONFIRMED"),
          q.eq(q.field("actionType"), "LOAD_CREATED"),
        ),
      );
    } else if (role === "carrier") {
      // Carriers see driver assignments, status changes, and route modifications
      query = query.filter((q) =>
        q.or(
          q.eq(q.field("actionType"), "DRIVER_ASSIGNED"),
          q.eq(q.field("actionType"), "STATUS_CHANGE"),
          q.eq(q.field("actionType"), "ROUTE_MODIFIED"),
          q.eq(q.field("actionType"), "DELIVERY_CONFIRMED"),
        ),
      );
    }
    // Admins see everything (no additional filtering)

    // Apply user-selected filters if provided
    if (filters) {
      if (filters.startDate) {
        query = query.filter((q) =>
          q.gte(q.field("timestamp"), filters.startDate!),
        );
      }

      if (filters.endDate) {
        query = query.filter((q) =>
          q.lte(q.field("timestamp"), filters.endDate!),
        );
      }

      if (filters.actionType) {
        query = query.filter((q) =>
          q.eq(q.field("actionType"), filters.actionType!),
        );
      }
    }

    return await query.order("desc", (q) => q.field("timestamp")).collect();
  },
});
