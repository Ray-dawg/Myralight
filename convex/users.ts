import { mutation, query } from "./schema";
import { v } from "convex/values";

// Get a user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Get a user by ID
export const getUser = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new user
export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("shipper"),
      v.literal("carrier"),
      v.literal("driver"),
    ),
    companyName: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    carrierId: v.optional(v.id("carriers")),
    licenseNumber: v.optional(v.string()),
    licenseExpiry: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    return await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      role: args.role,
      companyName: args.companyName,
      phone: args.phone,
      address: args.address,
      profileImageUrl: args.profileImageUrl,
      isActive: true,
      lastLogin: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      carrierId: args.carrierId,
      licenseNumber: args.licenseNumber,
      licenseExpiry: args.licenseExpiry,
    });
  },
});

// Update a user
export const updateUser = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    companyName: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    licenseNumber: v.optional(v.string()),
    licenseExpiry: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const user = await ctx.db.get(id);

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });
  },
});

// Update user's last login timestamp
export const updateLastLogin = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.patch(args.id, {
      lastLogin: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get users by role
export const getUsersByRole = query({
  args: {
    role: v.union(
      v.literal("admin"),
      v.literal("shipper"),
      v.literal("carrier"),
      v.literal("driver"),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .collect();
  },
});

// Get drivers by carrier ID
export const getDriversByCarrier = query({
  args: { carrierId: v.id("carriers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_carrier", (q) => q.eq("carrierId", args.carrierId))
      .filter((q) => q.eq(q.field("role"), "driver"))
      .collect();
  },
});
