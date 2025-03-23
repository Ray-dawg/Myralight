import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Hook for load status changes
export const onLoadStatusChange = internalMutation({
  args: {
    loadId: v.id("loads"),
    previousStatus: v.string(),
    newStatus: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { loadId, previousStatus, newStatus, userId } = args;

    // Get the load details
    const load = await ctx.db.get(loadId);
    if (!load) throw new Error("Load not found");

    // Create an event for the status change
    await ctx.db.insert("events", {
      loadId,
      userId,
      eventType: "status_change",
      previousValue: previousStatus,
      newValue: newStatus,
      timestamp: Date.now(),
      notes: `Load status changed from ${previousStatus} to ${newStatus}`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
