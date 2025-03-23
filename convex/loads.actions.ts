import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const acceptLoad = mutation({
  args: { loadId: v.id("loads") },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userRecord) throw new Error("User not found");

    // Get the load
    const load = await ctx.db.get(args.loadId);
    if (!load) throw new Error("Load not found");
    if (load.status !== "posted") throw new Error("Load is not available");

    // Update load status
    await ctx.db.patch(args.loadId, {
      status: "assigned",
      driverId: userRecord._id,
      assignedDate: Date.now(),
    });

    // Create an event
    await ctx.db.insert("events", {
      loadId: args.loadId,
      userId: userRecord._id,
      eventType: "load_accepted",
      timestamp: Date.now(),
      notes: `Load ${load.referenceNumber} accepted by driver`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const rejectLoad = mutation({
  args: { loadId: v.id("loads") },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userRecord) throw new Error("User not found");

    // Get the load
    const load = await ctx.db.get(args.loadId);
    if (!load) throw new Error("Load not found");

    // Create rejection record
    await ctx.db.insert("loadRejections", {
      loadId: args.loadId,
      driverId: userRecord._id,
      timestamp: Date.now(),
    });

    // Create an event
    await ctx.db.insert("events", {
      loadId: args.loadId,
      userId: userRecord._id,
      eventType: "load_rejected",
      timestamp: Date.now(),
      notes: `Load ${load.referenceNumber} rejected by driver`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
