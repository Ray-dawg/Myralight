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

  // Carriers can only access loads assigned to them
  if (
    userRecord.role === "carrier" &&
    load.carrierId !== userRecord.carrierId
  ) {
    throw new Error("Unauthorized: This load is not assigned to your carrier");
  }

  // Drivers can only access loads assigned to them
  if (userRecord.role === "driver" && load.driverId !== userRecord._id) {
    throw new Error("Unauthorized: This load is not assigned to you");
  }

  return { userRecord, load };
}

// Create a document upload URL
export const createDocumentUploadUrl = mutation({
  args: {
    loadId: v.id("loads"),
    fileName: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate access to the load
    const { userRecord } = await validateLoadAccess(ctx, args.loadId);

    // Generate a storage upload URL
    // Note: In a real implementation, you would use Convex Storage or another storage provider
    // This is a placeholder implementation
    const uploadUrl = `https://api.example.com/upload?fileName=${encodeURIComponent(args.fileName)}&fileType=${encodeURIComponent(args.fileType)}`;

    return { uploadUrl };
  },
});

// Create a document record after upload
export const createDocument = mutation({
  args: {
    loadId: v.id("loads"),
    type: v.union(
      v.literal("bill_of_lading"),
      v.literal("proof_of_delivery"),
      v.literal("rate_confirmation"),
      v.literal("invoice"),
      v.literal("weight_ticket"),
      v.literal("lumper_receipt"),
      v.literal("other"),
    ),
    name: v.string(),
    fileUrl: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate access to the load
    const { userRecord, load } = await validateLoadAccess(ctx, args.loadId);

    // Create the document record
    const documentId = await ctx.db.insert("documents", {
      loadId: args.loadId,
      userId: userRecord._id,
      type: args.type,
      name: args.name,
      fileUrl: args.fileUrl,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      uploadDate: Date.now(),
      verificationStatus: "pending",
      notes: args.notes,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create an event for document upload
    await ctx.db.insert("events", {
      loadId: args.loadId,
      userId: userRecord._id,
      eventType: "document_uploaded",
      newValue: args.type,
      timestamp: Date.now(),
      notes: `Document ${args.name} uploaded`,
      createdAt: Date.now(),
    });

    // Create notifications for relevant users
    // For BOL and POD, notify the shipper
    if (args.type === "bill_of_lading" || args.type === "proof_of_delivery") {
      await ctx.db.insert("notifications", {
        userId: load.shipperId,
        type: "document_uploaded",
        title: `${args.type === "bill_of_lading" ? "Bill of Lading" : "Proof of Delivery"} Uploaded`,
        message: `A ${args.type === "bill_of_lading" ? "Bill of Lading" : "Proof of Delivery"} has been uploaded for load ${load.referenceNumber}.`,
        relatedId: args.loadId,
        relatedType: "load",
        isRead: false,
        isActionRequired: true,
        actionUrl: `/loads/${args.loadId}/documents`,
        createdAt: Date.now(),
      });
    }

    // For rate confirmation, notify the carrier
    if (args.type === "rate_confirmation" && load.carrierId) {
      const carrierUsers = await ctx.db
        .query("users")
        .withIndex("by_carrier", (q) => q.eq("carrierId", load.carrierId))
        .collect();

      for (const user of carrierUsers) {
        await ctx.db.insert("notifications", {
          userId: user._id,
          type: "document_uploaded",
          title: "Rate Confirmation Uploaded",
          message: `A Rate Confirmation has been uploaded for load ${load.referenceNumber}.`,
          relatedId: args.loadId,
          relatedType: "load",
          isRead: false,
          isActionRequired: true,
          actionUrl: `/loads/${args.loadId}/documents`,
          createdAt: Date.now(),
        });
      }
    }

    return { documentId };
  },
});

// Verify a document
export const verifyDocument = mutation({
  args: {
    documentId: v.id("documents"),
    verificationStatus: v.union(v.literal("verified"), v.literal("rejected")),
    notes: v.optional(v.string()),
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

    // Only shippers, carriers, and admins can verify documents
    if (
      userRecord.role !== "shipper" &&
      userRecord.role !== "carrier" &&
      userRecord.role !== "admin"
    ) {
      throw new Error(
        "Unauthorized: Only shippers, carriers, and admins can verify documents",
      );
    }

    // Get the document
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("Document not found");

    // Validate access to the load
    await validateLoadAccess(ctx, document.loadId);

    // Update the document verification status
    await ctx.db.patch(args.documentId, {
      verificationStatus: args.verificationStatus,
      verifiedBy: userRecord._id,
      verificationDate: Date.now(),
      notes: args.notes || document.notes,
      updatedAt: Date.now(),
    });

    // Create an event for document verification
    await ctx.db.insert("events", {
      loadId: document.loadId,
      userId: userRecord._id,
      eventType: "document_verified",
      previousValue: "pending",
      newValue: args.verificationStatus,
      timestamp: Date.now(),
      notes: `Document ${document.name} ${args.verificationStatus}`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get documents for a load
export const getDocuments = query({
  args: {
    loadId: v.id("loads"),
  },
  handler: async (ctx, args) => {
    // Validate access to the load
    await validateLoadAccess(ctx, args.loadId);

    // Get documents for the load
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_load", (q) => q.eq("loadId", args.loadId))
      .collect();

    // Enhance documents with user information
    const enhancedDocuments = await Promise.all(
      documents.map(async (document) => {
        const uploadedBy = await ctx.db.get(document.userId);
        let verifiedBy = null;
        if (document.verifiedBy) {
          verifiedBy = await ctx.db.get(document.verifiedBy);
        }

        return {
          ...document,
          uploadedBy,
          verifiedBy,
        };
      }),
    );

    return enhancedDocuments;
  },
});

// Delete a document
export const deleteDocument = mutation({
  args: {
    documentId: v.id("documents"),
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

    // Get the document
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("Document not found");

    // Validate access to the load
    const { load } = await validateLoadAccess(ctx, document.loadId);

    // Only the user who uploaded the document, the shipper who owns the load, or an admin can delete it
    if (
      userRecord._id !== document.userId &&
      !(userRecord.role === "shipper" && load.shipperId === userRecord._id) &&
      userRecord.role !== "admin"
    ) {
      throw new Error(
        "Unauthorized: You don't have permission to delete this document",
      );
    }

    // Delete the document
    await ctx.db.delete(args.documentId);

    // Create an event for document deletion
    await ctx.db.insert("events", {
      loadId: document.loadId,
      userId: userRecord._id,
      eventType: "document_deleted",
      previousValue: document.name,
      newValue: null,
      timestamp: Date.now(),
      notes: `Document ${document.name} deleted`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
