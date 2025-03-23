import { mutation, query } from "./schema";
import { v } from "convex/values";

// Get a rating by ID
export const getRating = query({
  args: { id: v.id("ratings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get ratings by load ID
export const getRatingsByLoad = query({
  args: { loadId: v.id("loads") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ratings")
      .withIndex("by_load", (q) => q.eq("loadId", args.loadId))
      .collect();
  },
});

// Get ratings given by a user
export const getRatingsByFromUser = query({
  args: { fromUserId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ratings")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", args.fromUserId))
      .collect();
  },
});

// Get ratings received by a user
export const getRatingsByToUser = query({
  args: { toUserId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ratings")
      .withIndex("by_to_user", (q) => q.eq("toUserId", args.toUserId))
      .collect();
  },
});

// Get ratings received by a carrier
export const getRatingsByToCarrier = query({
  args: { toCarrierId: v.id("carriers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ratings")
      .withIndex("by_to_carrier", (q) => q.eq("toCarrierId", args.toCarrierId))
      .collect();
  },
});

// Calculate average rating for a user
export const getAverageRatingForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_to_user", (q) => q.eq("toUserId", args.userId))
      .collect();
    
    if (ratings.length === 0) {
      return null;
    }
    
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return sum / ratings.length;
  },
});

// Calculate average rating for a carrier
export const getAverageRatingForCarrier = query({
  args: { carrierId: v.id("carriers") },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_to_carrier", (q) => q.eq("toCarrierId", args.carrierId))
      .collect();
    
    if (ratings.length === 0) {
      return null;
    }
    
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return sum / ratings.length;
  },
});

// Create a new rating
export const createRating = mutation({
  args: {
    loadId: v.id("loads"),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    toCarrierId: v.optional(v.id("carriers")),
    rating: v.number(),
    comments: v.optional(v.string()),
    categories: v.optional(
      v.object({
        communication: v.optional(v.number()),
        onTimePickup: v.optional(v.number()),
        onTimeDelivery: v.optional(v.number()),
        loadCondition: v.optional(v.number()),
        documentation: v.optional(v.number()),
        professionalism: v.optional(v.number()),
      })
    ),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { loadId, fromUserId, toUserId, toCarrierId, rating, comments, categories, isPublic } = args;
    const timestamp = Date.now();
    
    // Verify load exists and is completed
    const load = await ctx.db.get(loadId);
    if (!load) {
      throw new Error("Load not found");
    }
    
    if (load.status !== "completed") {
      throw new Error("Can only rate completed loads");
    }
    
    // Verify users exist
    const fromUser = await ctx.db.get(fromUserId);
    if (!fromUser) {
      throw new Error("From user not found");
    }
    
    const toUser = await ctx.db.get(toUserId);
    if (!toUser) {
      throw new Error("To user not found");
    }
    
    // Verify carrier exists if provided
    if (toCarrierId) {
      const carrier = await ctx.db.get(toCarrierId);
      if (!carrier) {
        throw new Error("Carrier not found");
      }
    }
    
    // Verify the rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    
    // Check if a rating already exists for this load from this user to this user/carrier
    const existingRatings = await ctx.db
      .query("ratings")
      .withIndex("by_load", (q) => q.eq("loadId", loadId))
      .filter((q) => 
        q.eq(q.field("fromUserId"), fromUserId) && 
        q.eq(q.field("toUserId"), toUserId)
      )
      .collect();
    
    if (existingRatings.length > 0) {
      throw new Error("A rating already exists for this load from this user");
    }
    
    // Create the rating
    const ratingId = await ctx.db.insert("ratings", {
      loadId,
      fromUserId,
      toUserId,
      toCarrierId,
      rating,
      comments,
      categories,
      isPublic,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    
    // Create an event for this rating
    await ctx.db.insert("events", {
      loadId,
      userId: fromUserId,
      eventType: "rating_created",
      previousValue: null,
      newValue: { ratingId, rating },
      timestamp,
      notes: `Rating of ${rating}/5 submitted by ${fromUser.name}`,
      createdAt: timestamp,
    });
    
    // Create a notification for the rated user
    await ctx.db.insert("notifications", {
      userId: toUserId,
      type: "rating_received",
      title: "New Rating Received",
      message: `You received a ${rating}/5 rating for load ${load.referenceNumber}`,
      relatedId: ratingId,
      relatedType: "ratings",
      isRead: false,
      isActionRequired: false,
      createdAt: timestamp,
    });
    
    // Update carrier rating if applicable
    if (toCarrierId) {
      const carrierRatings = await ctx.db
        .query("ratings")
        .withIndex("by_to_carrier", (q) => q.eq("toCarrierId", toCarrierId))
        .collect();
      
      if (carrierRatings.length > 0) {
        const sum = carrierRatings.reduce((acc, r) => acc + r.rating, 0);
        const avgRating = sum / carrierRatings.length;
        
        await ctx.db.patch(toCarrierId, {
          rating: avgRating,
          updatedAt: timestamp,
        });
      }
    }
    
    return ratingId;
  },
});

// Update a rating
export const updateRating = mutation({
  args: {
    id: v.id("ratings"),
    rating: v.optional(v.number()),
    comments: v.optional(v.string()),
    categories: v.optional(
      v.object({
        communication: v.optional(v.number()),
        onTimePickup: v.optional(v.number()),
        onTimeDelivery: v.optional(v.number()),
        loadCondition: v.optional(v.number()),
        documentation: v.optional(v.number()),
        professionalism: v.optional(v.number()),
      })
    ),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const timestamp = Date.now();
    
    // Get the rating
    const rating = await ctx.db.get(id);
    if (!rating) {
      throw new Error("Rating not found");
    }
    
    // Verify the rating is between 1 and 5 if provided
    if (fields.rating !== undefined && (fields.rating < 1 || fields.rating > 5)) {
      throw new Error("Rating must be between 1 and 5");
    }
    
    // Update the rating
    await ctx.db.patch(id, {
      ...fields,
      updatedAt: timestamp,
    });
    
    // Update carrier rating if applicable and rating value changed
    if (fields.rating