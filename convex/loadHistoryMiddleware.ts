import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { logAction } from "./loadHistory";

/**
 * Higher-order function that wraps mutation handlers to add audit logging
 * @param actionType The type of action being performed
 * @param description Function to generate a human-readable description
 * @param mutationFn The original mutation function to wrap
 */
export function withAuditLogging(
  actionType: string,
  description: (args: any, result: any, before: any, after: any) => string,
  mutationFn: any,
) {
  return mutation({
    args: mutationFn.args,
    handler: async (ctx, args) => {
      // Extract load ID and user ID from args
      const { loadId, userId } = args as {
        loadId: Id<"loads">;
        userId: Id<"users">;
      };

      // Get the "before" state if we have a loadId
      const before = loadId ? await ctx.db.get(loadId) : null;

      // Execute the original mutation
      const result = await mutationFn.handler(ctx, args);

      // Get the "after" state
      const after = loadId ? await ctx.db.get(loadId) : result;

      // Log the action
      if (loadId && userId) {
        await ctx.db.insert("load_history", {
          loadId,
          userId,
          actionType,
          details: {
            before,
            after,
            description: description(args, result, before, after),
            metadata: { args },
          },
          timestamp: new Date().toISOString(),
          createdAt: Date.now(),
        });
      }

      return result;
    },
  });
}

// Example usage with the updateLoadStatus mutation
export const updateLoadStatusWithAudit = withAuditLogging(
  "STATUS_CHANGE",
  (args, result, before, after) =>
    `Load status changed from "${before?.status}" to "${after?.status}"`,
  mutation({
    args: {
      loadId: v.id("loads"),
      userId: v.id("users"),
      status: v.string(),
      notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
      const { loadId, status, notes } = args;

      // Update the load status
      await ctx.db.patch(loadId, {
        status,
        updatedAt: Date.now(),
      });

      return await ctx.db.get(loadId);
    },
  }),
);

// Example of carrier assignment with audit logging
export const assignCarrierWithAudit = withAuditLogging(
  "CARRIER_ASSIGNED",
  (args, result, before, after) =>
    `Carrier assigned to load: ${after?.carrierId}`,
  mutation({
    args: {
      loadId: v.id("loads"),
      userId: v.id("users"),
      carrierId: v.id("users"),
      notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
      const { loadId, carrierId } = args;

      // Update the load with the carrier ID
      await ctx.db.patch(loadId, {
        carrierId,
        updatedAt: Date.now(),
      });

      return await ctx.db.get(loadId);
    },
  }),
);

// Example of driver assignment with audit logging
export const assignDriverWithAudit = withAuditLogging(
  "DRIVER_ASSIGNED",
  (args, result, before, after) =>
    `Driver assigned to load: ${after?.driverId}`,
  mutation({
    args: {
      loadId: v.id("loads"),
      userId: v.id("users"),
      driverId: v.id("users"),
      notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
      const { loadId, driverId } = args;

      // Update the load with the driver ID
      await ctx.db.patch(loadId, {
        driverId,
        updatedAt: Date.now(),
      });

      return await ctx.db.get(loadId);
    },
  }),
);
