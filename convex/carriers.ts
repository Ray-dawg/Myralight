import { mutation, query } from "./schema";
import { v } from "convex/values";

// Get a carrier by ID
export const getCarrier = query({
  args: { id: v.id("carriers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get all carriers
export const getAllCarriers = query({
  handler: async (ctx) => {
    return await ctx.db.query("carriers").collect();
  },
});

// Get carriers by name (partial match)
export const getCarriersByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // This is a simple implementation that gets all carriers and filters client-side
    // In a production environment, you'd want to use a more efficient search mechanism
    const carriers = await ctx.db.query("carriers").collect();
    return carriers.filter((carrier) =>
      carrier.name.toLowerCase().includes(args.name.toLowerCase()),
    );
  },
});

// Get carriers by DOT number
export const getCarrierByDotNumber = query({
  args: { dotNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("carriers")
      .withIndex("by_dot_number", (q) => q.eq("dotNumber", args.dotNumber))
      .first();
  },
});

// Get carriers by location
export const getCarriersByLocation = query({
  args: { state: v.string(), city: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("carriers")
      .withIndex("by_location", (q) => q.eq("state", args.state));

    if (args.city) {
      query = query.filter((q) => q.eq(q.field("city"), args.city));
    }

    return await query.collect();
  },
});

// Create a new carrier
export const createCarrier = mutation({
  args: {
    name: v.string(),
    dotNumber: v.string(),
    mcNumber: v.optional(v.string()),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
    contactName: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
    fleetSize: v.number(),
    insuranceProvider: v.optional(v.string()),
    insurancePolicyNumber: v.optional(v.string()),
    insuranceExpiryDate: v.optional(v.number()),
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    // Check if carrier with this DOT number already exists
    const existingCarrier = await ctx.db
      .query("carriers")
      .withIndex("by_dot_number", (q) => q.eq("dotNumber", args.dotNumber))
      .first();

    if (existingCarrier) {
      throw new Error("Carrier with this DOT number already exists");
    }

    return await ctx.db.insert("carriers", {
      ...args,
      isVerified: false,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

// Update a carrier
export const updateCarrier = mutation({
  args: {
    id: v.id("carriers"),
    name: v.optional(v.string()),
    mcNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    country: v.optional(v.string()),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    fleetSize: v.optional(v.number()),
    insuranceProvider: v.optional(v.string()),
    insurancePolicyNumber: v.optional(v.string()),
    insuranceExpiryDate: v.optional(v.number()),
    rating: v.optional(v.number()),
    isVerified: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const carrier = await ctx.db.get(id);

    if (!carrier) {
      throw new Error("Carrier not found");
    }

    return await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });
  },
});

// Verify a carrier
export const verifyCarrier = mutation({
  args: { id: v.id("carriers") },
  handler: async (ctx, args) => {
    const carrier = await ctx.db.get(args.id);

    if (!carrier) {
      throw new Error("Carrier not found");
    }

    return await ctx.db.patch(args.id, {
      isVerified: true,
      updatedAt: Date.now(),
    });
  },
});
