import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new geofence
export const createGeofence = mutation({
  args: {
    loadId: v.id("loads"),
    name: v.string(),
    type: v.union(
      v.literal("pickup"),
      v.literal("delivery"),
      v.literal("stop"),
    ),
    latitude: v.number(),
    longitude: v.number(),
    radius: v.number(), // in meters
    address: v.string(),
    hereGeofenceId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    // Create the geofence
    const geofenceId = await ctx.db.insert("geofences", {
      loadId: args.loadId,
      name: args.name,
      type: args.type,
      location: {
        latitude: args.latitude,
        longitude: args.longitude,
      },
      radius: args.radius,
      address: args.address,
      hereGeofenceId: args.hereGeofenceId,
      metadata: args.metadata,
      isActive: true,
      createdBy: user.subject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create an event for geofence creation
    await ctx.db.insert("events", {
      loadId: args.loadId,
      userId: user.subject,
      eventType: "geofence_created",
      newValue: args.name,
      timestamp: Date.now(),
      notes: `Geofence ${args.name} created for load`,
      metadata: {
        geofenceId,
        type: args.type,
        radius: args.radius,
      },
      createdAt: Date.now(),
    });

    return { geofenceId, name: args.name };
  },
});

// Get geofences for a load
export const getGeofencesByLoad = query({
  args: { loadId: v.id("loads") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("geofences")
      .withIndex("by_load", (q) => q.eq("loadId", args.loadId))
      .collect();
  },
});

// Update geofence status
export const updateGeofenceStatus = mutation({
  args: {
    geofenceId: v.id("geofences"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { geofenceId, isActive } = args;

    // Get the authenticated user
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    // Get the geofence
    const geofence = await ctx.db.get(geofenceId);
    if (!geofence) throw new Error("Geofence not found");

    // Update the geofence status
    await ctx.db.patch(geofenceId, {
      isActive,
      updatedAt: Date.now(),
    });

    // Create a status change event
    await ctx.db.insert("events", {
      loadId: geofence.loadId,
      userId: user.subject,
      eventType: isActive ? "geofence_activated" : "geofence_deactivated",
      timestamp: Date.now(),
      notes: `Geofence ${geofence.name} ${isActive ? "activated" : "deactivated"}`,
      metadata: {
        geofenceId,
        previousStatus: !isActive,
        newStatus: isActive,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Record geofence entry/exit event
export const recordGeofenceEvent = mutation({
  args: {
    geofenceId: v.id("geofences"),
    loadId: v.id("loads"),
    eventType: v.union(v.literal("entry"), v.literal("exit")),
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.optional(v.number()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const {
      geofenceId,
      loadId,
      eventType,
      latitude,
      longitude,
      accuracy,
      timestamp,
    } = args;

    // Get the authenticated user
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    // Get the geofence
    const geofence = await ctx.db.get(geofenceId);
    if (!geofence) throw new Error("Geofence not found");

    // Record the geofence event
    const geofenceEventId = await ctx.db.insert("geofenceEvents", {
      geofenceId,
      loadId,
      userId: user.subject,
      eventType,
      location: {
        latitude,
        longitude,
        accuracy: accuracy || null,
      },
      timestamp,
      createdAt: Date.now(),
    });

    // Create a system event
    await ctx.db.insert("events", {
      loadId,
      userId: user.subject,
      eventType: `geofence_${eventType}`,
      timestamp: Date.now(),
      notes: `${eventType === "entry" ? "Entered" : "Exited"} geofence ${geofence.name}`,
      metadata: {
        geofenceId,
        geofenceEventId,
        location: {
          latitude,
          longitude,
        },
      },
      createdAt: Date.now(),
    });

    // If this is an entry event for a pickup or delivery, update the load status
    if (eventType === "entry") {
      if (geofence.type === "pickup") {
        // Update load status to in_transit if currently assigned
        const load = await ctx.db.get(loadId);
        if (load && load.status === "assigned") {
          await ctx.db.patch(loadId, {
            status: "in_transit",
            actualPickupTime: timestamp,
            updatedAt: Date.now(),
          });
        }
      } else if (geofence.type === "delivery") {
        // Update load status to delivered if currently in_transit
        const load = await ctx.db.get(loadId);
        if (load && load.status === "in_transit") {
          await ctx.db.patch(loadId, {
            status: "delivered",
            actualDeliveryTime: timestamp,
            updatedAt: Date.now(),
          });
        }
      }
    }

    return { success: true, geofenceEventId };
  },
});
