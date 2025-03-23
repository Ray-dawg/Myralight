import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new location
export const createLocation = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
    coordinates: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    locationType: v.union(
      v.literal("warehouse"),
      v.literal("distribution_center"),
      v.literal("port"),
      v.literal("terminal"),
      v.literal("customer_location"),
      v.literal("other"),
    ),
    specialInstructions: v.optional(v.string()),
  },
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

    // Create the location
    const locationId = await ctx.db.insert("locations", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { locationId };
  },
});
