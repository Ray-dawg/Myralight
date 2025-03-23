import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get a vehicle by ID
export const getVehicle = query({
  args: { id: v.id("vehicles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get vehicles by carrier ID
export const getVehiclesByCarrier = query({
  args: { carrierId: v.id("carriers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vehicles")
      .withIndex("by_carrier", (q) => q.eq("carrierId", args.carrierId))
      .collect();
  },
});

// Get vehicles by driver ID
export const getVehiclesByDriver = query({
  args: { driverId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vehicles")
      .withIndex("by_driver", (q) => q.eq("currentDriverId", args.driverId))
      .collect();
  },
});

// Get vehicles by status
export const getVehiclesByStatus = query({
  args: {
    status: v.union(
      v.literal("active"),
      v.literal("maintenance"),
      v.literal("out_of_service"),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vehicles")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Get vehicles by equipment type
export const getVehiclesByEquipmentType = query({
  args: { equipmentType: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vehicles")
      .withIndex("by_equipment_type", (q) =>
        q.eq("equipmentType", args.equipmentType),
      )
      .collect();
  },
});

// Create a new vehicle
export const createVehicle = mutation({
  args: {
    carrierId: v.id("carriers"),
    type: v.union(v.literal("truck"), v.literal("trailer")),
    make: v.string(),
    model: v.string(),
    year: v.number(),
    vin: v.string(),
    licensePlate: v.string(),
    state: v.string(),
    equipmentType: v.string(),
    capacity: v.optional(v.number()),
    dimensions: v.optional(
      v.object({
        length: v.number(),
        width: v.number(),
        height: v.number(),
      }),
    ),
    currentDriverId: v.optional(v.id("users")),
    lastMaintenanceDate: v.optional(v.number()),
    nextMaintenanceDate: v.optional(v.number()),
    currentLocation: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
        lastUpdated: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    // Check if vehicle with this VIN already exists
    const vehicles = await ctx.db.query("vehicles").collect();
    const existingVehicle = vehicles.find((v) => v.vin === args.vin);

    if (existingVehicle) {
      throw new Error("Vehicle with this VIN already exists");
    }

    return await ctx.db.insert("vehicles", {
      ...args,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

// Update vehicle location
export const updateVehicleLocation = mutation({
  args: {
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userRecord) throw new Error("User not found");

    // Find the vehicle assigned to this driver
    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_driver", (q) => q.eq("currentDriverId", userRecord._id))
      .first();

    if (!vehicle) throw new Error("No vehicle assigned");

    const timestamp = Date.now();

    // Update vehicle location
    await ctx.db.patch(vehicle._id, {
      currentLocation: {
        latitude: args.latitude,
        longitude: args.longitude,
        lastUpdated: timestamp,
      },
      updatedAt: timestamp,
    });

    return { success: true };
  },
});

// Update a vehicle
export const updateVehicle = mutation({
  args: {
    id: v.id("vehicles"),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    licensePlate: v.optional(v.string()),
    state: v.optional(v.string()),
    equipmentType: v.optional(v.string()),
    capacity: v.optional(v.number()),
    dimensions: v.optional(
      v.object({
        length: v.number(),
        width: v.number(),
        height: v.number(),
      }),
    ),
    currentDriverId: v.optional(v.id("users")),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("maintenance"),
        v.literal("out_of_service"),
      ),
    ),
    lastMaintenanceDate: v.optional(v.number()),
    nextMaintenanceDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const vehicle = await ctx.db.get(id);

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    return await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });
  },
});
