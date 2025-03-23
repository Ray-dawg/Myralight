import { v } from "convex/values";
import { query } from "./_generated/server";

// Get all loads for a specific shipper
export const getShipperLoads = query({
  args: {},
  handler: async (ctx) => {
    // Get the authenticated user
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    // Get user record
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userRecord) throw new Error("User not found");

    // Get all loads for this shipper
    const loads = await ctx.db
      .query("loads")
      .withIndex("by_shipper", (q) => q.eq("shipperId", userRecord._id))
      .collect();

    // For each load, get the pickup and delivery locations
    const loadsWithLocations = await Promise.all(
      loads.map(async (load) => {
        const pickupLocation = await ctx.db.get(load.pickupLocationId);
        const deliveryLocation = await ctx.db.get(load.deliveryLocationId);

        return {
          ...load,
          pickupLocation,
          deliveryLocation,
        };
      }),
    );

    return loadsWithLocations;
  },
});

// Get a specific load by ID
export const getLoadById = query({
  args: { loadId: v.id("loads") },
  handler: async (ctx, args) => {
    // Get the authenticated user
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    // Get user record
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userRecord) throw new Error("User not found");

    // Get the load
    const load = await ctx.db.get(args.loadId);
    if (!load) throw new Error("Load not found");

    // Check if user is authorized to view this load
    // Allow if user is the shipper, the carrier, or an admin
    if (
      load.shipperId !== userRecord._id &&
      load.carrierId !== userRecord._id &&
      userRecord.role !== "admin"
    ) {
      throw new Error("Not authorized to view this load");
    }

    // Get the pickup and delivery locations
    const pickupLocation = await ctx.db.get(load.pickupLocationId);
    const deliveryLocation = await ctx.db.get(load.deliveryLocationId);

    // Get events for this load
    const events = await ctx.db
      .query("events")
      .withIndex("by_load", (q) => q.eq("loadId", args.loadId))
      .collect();

    return {
      ...load,
      pickupLocation,
      deliveryLocation,
      events,
    };
  },
});

// Get all loads (admin only)
export const getAllLoads = query({
  args: {},
  handler: async (ctx) => {
    // Get the authenticated user
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    // Get user record
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userRecord) throw new Error("User not found");

    // Check if user is an admin
    if (userRecord.role !== "admin") {
      throw new Error("Not authorized to view all loads");
    }

    // Get all loads
    const loads = await ctx.db.query("loads").collect();

    // For each load, get the pickup and delivery locations
    const loadsWithLocations = await Promise.all(
      loads.map(async (load) => {
        const pickupLocation = await ctx.db.get(load.pickupLocationId);
        const deliveryLocation = await ctx.db.get(load.deliveryLocationId);

        return {
          ...load,
          pickupLocation,
          deliveryLocation,
        };
      }),
    );

    return loadsWithLocations;
  },
});
