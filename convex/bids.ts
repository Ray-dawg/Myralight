import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper function to validate access to a load
async function validateLoadAccess(ctx: any, loadId: Id<"loads">) {
  const user = await ctx.auth.getUserIdentity();
  if (!user) throw new Error("Not authenticated");
  
  const userId = user.subject;
  const userRecord = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", user.email))
    .first();
  
  if (!userRecord) throw new Error("User not found");
  
  const load = await ctx.db.get(loadId);
  if (!load) throw new Error("Load not found");
  
  // Admins can access any load
  if (userRecord.role === "admin") return { userRecord, load };
  
  // Shippers can only access their own loads
  if (userRecord.role === "shipper" && load.shipperId !== userRecord._id) {
    throw new Error("Unauthorized: You don't have access to this load");
  }
  
  // Carriers can only access loads assigned to them or loads that are posted
  if (userRecord.role === "carrier") {
    if (load.carrierId && load.carrierId !== userRecord.carrierId && load.status !== "posted") {
      throw new Error("Unauthorized: This load is not assigned to your carrier and is not posted");
    }
  }
  
  // Drivers can only access loads assigned to them
  if (userRecord.role === "driver" && load.driverId !== userRecord._id) {
    throw new Error("Unauthorized: This load is not assigned to you");
  }
  
  return { userRecord, load };
}

// Create a bid on a load
export const createBid = mutation({
  args: {
    loadId: v.id("loads"),
    amount: v.number(),
    notes: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate access to the load
    const { userRecord, load } = await validateLoadAccess(ctx, args.loadId);
    
    // Only carriers can create bids
    if (userRecord.role !== "carrier") {
      throw new Error("Unauthorized: Only carriers can create bids");
    }
    
    // Validate the load status
    if (load.status !== "posted") {
      throw new Error("Can only bid on loads with 'posted' status");
    }
    
    // Check if the carrier already has a pending bid on this load
    const existingBid = await ctx.db
      .query("bids")
      .withIndex("by_load", (q) => q.eq("loadId", args.loadId))
      .filter((q) => 
        q.and(
          q.eq(q.field("carrierId"), userRecord.carrierId as Id<"carriers">),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();
    
    if (existingBid) {
      throw new Error("You already have a pending bid on this load");
    }
    
    // Set default expiration time if not provided (48 hours from now)
    const expiresAt = args.expiresAt || (Date.now() + 48 * 60 * 60 * 1000);
    
    // Create the bid
    const bidId = await ctx.db.insert("bids", {
      loadId: args.loadId,
      carrierId: userRecord.carrierId as Id<"carriers">,
      userId: userRecord._id,
      amount: args.amount,
      notes: args.notes,
      status: "pending",
      expiresAt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Create an event for bid creation
    await ctx.db.insert("events", {
      loadId: args.loadId,
      userId: userRecord._id,
      eventType: "bid_created",
      newValue: JSON.stringify({
        bidId,
        amount: args.amount,
        carrierId: userRecord.carrierId,
      }),
      timestamp: Date.now(),
      notes: `Bid created for $${(args.amount / 100).toFixed(2)}`,
      createdAt: Date.now(),
    });
    
    // Notify the shipper about the new bid
    await ctx.db.insert("notifications", {
      userId: load.shipperId,
      type: "bid_received",
      title: "New Bid Received",
      message: `A new bid of $${(args.amount / 100).toFixed(2)} has been received for load ${load.referenceNumber}.`,
      relatedId: args.loadId,
      relatedType: "load",
      isRead: false,
      isActionRequired: true,
      actionUrl: `/loads/${args.loadId}/bids`,
      createdAt: Date.now(),
    });
    
    return { bidId };
  },
});

// Update a bid
export const updateBid = mutation({
  args: {
    bidId: v.id("bids"),
    amount: v.optional(v.number()),
    notes: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authentication check
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");
    
    // Get user record
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();
    
    if (!userRecord) throw new Error("User not found");
    
    // Get the bid
    const bid = await ctx.db.get(args.bidId);
    if (!bid) throw new Error("Bid not found");
    
    // Only the carrier who created the bid can update it
    if (userRecord.role !== "carrier" || bid.carrierId !== userRecord.carrierId) {
      throw new Error("Unauthorized: You don't have permission to update this bid");
    }
    
    // Can only update pending bids
    if (bid.status !== "pending") {
      throw new Error("Can only update bids with 'pending' status");
    }
    
    // Create update object with