import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table
  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.optional(v.string()), // Legacy role field
    roleId: v.optional(v.id("roles")), // New role reference
    companyName: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    isActive: v.boolean(),
    lastLogin: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    carrierId: v.optional(v.id("carriers")),
    licenseNumber: v.optional(v.string()),
    licenseExpiry: v.optional(v.number()),
    organizationId: v.optional(v.id("organizations")),
    dashboardConfig: v.optional(
      v.object({
        visibleTabs: v.array(v.string()),
        defaultTab: v.string(),
        widgets: v.array(v.string()),
      }),
    ),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_carrier", ["carrierId"])
    .index("by_role_id", ["roleId"])
    .index("by_organization", ["organizationId"]),

  // Organizations table
  organizations: defineTable({
    name: v.string(),
    type: v.string(), // e.g., "shipper", "carrier", "broker"
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    settings: v.optional(v.any()),
  }).index("by_name", ["name"]),

  // Roles table
  roles: defineTable({
    name: v.string(),
    description: v.string(),
    permissions: v.array(v.string()),
    organizationId: v.id("organizations"),
    isCustom: v.boolean(), // Whether this is a system role or custom role
    dashboardConfig: v.optional(
      v.object({
        visibleTabs: v.array(v.string()),
        defaultTab: v.string(),
        widgets: v.array(v.string()),
      }),
    ),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_name", ["organizationId", "name"]),

  // Permissions table
  permissions: defineTable({
    name: v.string(), // e.g., "read:loads", "write:drivers"
    description: v.string(),
    category: v.string(), // e.g., "Load Management", "Driver Management"
    createdAt: v.number(),
  }).index("by_category", ["category"]),

  // Loads table
  loads: defineTable({
    referenceNumber: v.string(),
    shipperId: v.id("users"),
    carrierId: v.optional(v.id("users")),
    driverId: v.optional(v.id("users")),
    vehicleId: v.optional(v.id("vehicles")),
    status: v.string(),
    pickupLocationId: v.id("locations"),
    deliveryLocationId: v.id("locations"),
    pickupWindowStart: v.number(),
    pickupWindowEnd: v.number(),
    deliveryWindowStart: v.number(),
    deliveryWindowEnd: v.number(),
    pickupInstructions: v.optional(v.string()),
    deliveryInstructions: v.optional(v.string()),
    commodity: v.string(),
    weight: v.number(),
    dimensions: v.optional(
      v.object({
        length: v.number(),
        width: v.number(),
        height: v.number(),
      }),
    ),
    hazmat: v.boolean(),
    equipmentType: v.string(),
    loadType: v.string(),
    rate: v.optional(v.number()),
    miles: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    actualPickupTime: v.optional(v.number()),
    actualDeliveryTime: v.optional(v.number()),
    organizationId: v.optional(v.id("organizations")),
  })
    .index("by_shipper", ["shipperId"])
    .index("by_carrier", ["carrierId"])
    .index("by_driver", ["driverId"])
    .index("by_status", ["status"])
    .index("by_reference", ["referenceNumber"])
    .index("by_pickup_location", ["pickupLocationId"])
    .index("by_delivery_location", ["deliveryLocationId"])
    .index("by_organization", ["organizationId"]),

  // Locations table
  locations: defineTable({
    name: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    contactName: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    organizationId: v.optional(v.id("organizations")),
  })
    .index("by_zip", ["zipCode"])
    .index("by_city_state", ["city", "state"])
    .index("by_organization", ["organizationId"]),

  // Vehicles table
  vehicles: defineTable({
    carrierId: v.id("users"),
    type: v.string(),
    make: v.string(),
    model: v.string(),
    year: v.number(),
    vin: v.string(),
    licensePlate: v.string(),
    state: v.string(),
    capacity: v.optional(v.number()),
    dimensions: v.optional(
      v.object({
        length: v.number(),
        width: v.number(),
        height: v.number(),
      }),
    ),
    status: v.string(),
    lastMaintenanceDate: v.optional(v.number()),
    nextMaintenanceDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    organizationId: v.optional(v.id("organizations")),
  })
    .index("by_carrier", ["carrierId"])
    .index("by_status", ["status"])
    .index("by_license_plate", ["licensePlate"])
    .index("by_organization", ["organizationId"]),

  // Carriers table
  carriers: defineTable({
    name: v.string(),
    dotNumber: v.string(),
    mcNumber: v.optional(v.string()),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
    contactName: v.string(),
    contactPhone: v.string(),
    contactEmail: v.string(),
    insuranceProvider: v.optional(v.string()),
    insurancePolicyNumber: v.optional(v.string()),
    insuranceExpirationDate: v.optional(v.number()),
    rating: v.optional(v.number()),
    status: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    organizationId: v.optional(v.id("organizations")),
  })
    .index("by_dot_number", ["dotNumber"])
    .index("by_status", ["status"])
    .index("by_organization", ["organizationId"]),

  // Documents table
  documents: defineTable({
    name: v.string(),
    type: v.string(),
    category: v.string(),
    url: v.string(),
    mimeType: v.string(),
    size: v.number(),
    uploadedBy: v.id("users"),
    relatedEntityType: v.string(),
    relatedEntityId: v.string(),
    status: v.optional(v.string()),
    verifiedBy: v.optional(v.id("users")),
    verifiedAt: v.optional(v.number()),
    expirationDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    organizationId: v.optional(v.id("organizations")),
  })
    .index("by_related_entity", ["relatedEntityType", "relatedEntityId"])
    .index("by_category", ["category"])
    .index("by_uploaded_by", ["uploadedBy"])
    .index("by_organization", ["organizationId"]),

  // Load history table
  load_history: defineTable({
    loadId: v.id("loads"),
    userId: v.id("users"),
    actionType: v.string(),
    details: v.any(),
    timestamp: v.string(),
    createdAt: v.number(),
    organizationId: v.optional(v.id("organizations")),
  })
    .index("by_load", ["loadId"])
    .index("by_user", ["userId"])
    .index("by_action_type", ["actionType"])
    .index("by_organization", ["organizationId"]),

  // Geofences table
  geofences: defineTable({
    name: v.string(),
    type: v.string(),
    radius: v.optional(v.number()),
    coordinates: v.array(v.array(v.number())),
    locationId: v.optional(v.id("locations")),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    country: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    organizationId: v.optional(v.id("organizations")),
  })
    .index("by_location", ["locationId"])
    .index("by_created_by", ["createdBy"])
    .index("by_organization", ["organizationId"]),

  // Geofence events table
  geofence_events: defineTable({
    geofenceId: v.id("geofences"),
    loadId: v.optional(v.id("loads")),
    driverId: v.id("users"),
    vehicleId: v.optional(v.id("vehicles")),
    eventType: v.string(),
    timestamp: v.number(),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    organizationId: v.optional(v.id("organizations")),
  })
    .index("by_geofence", ["geofenceId"])
    .index("by_load", ["loadId"])
    .index("by_driver", ["driverId"])
    .index("by_organization", ["organizationId"]),

  // Notifications table
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    data: v.optional(v.any()),
    createdAt: v.number(),
    organizationId: v.optional(v.id("organizations")),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"])
    .index("by_organization", ["organizationId"]),

  // Messages table
  messages: defineTable({
    conversationId: v.string(),
    senderId: v.id("users"),
    recipientId: v.optional(v.id("users")),
    content: v.string(),
    attachments: v.optional(v.array(v.string())),
    read: v.boolean(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
    organizationId: v.optional(v.id("organizations")),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"])
    .index("by_recipient", ["recipientId"])
    .index("by_organization", ["organizationId"]),

  // Conversations table
  conversations: defineTable({
    name: v.optional(v.string()),
    type: v.string(),
    participants: v.array(v.id("users")),
    lastMessageAt: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
  })
    .index("by_participant", ["participants"])
    .index("by_related_entity", ["relatedEntityType", "relatedEntityId"])
    .index("by_organization", ["organizationId"]),

  // Audit logs table
  audit_logs: defineTable({
    userId: v.id("users"),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    details: v.any(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
    organizationId: v.optional(v.id("organizations")),
  })
    .index("by_user", ["userId"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_action", ["action"])
    .index("by_organization", ["organizationId"]),
});

// Export query and mutation helpers
export const query = {
  args: <T>(args: T) => args,
  handler: <T, U>(handler: (ctx: any, args: T) => U) => ({ args, handler }),
};

export const mutation = {
  args: <T>(args: T) => args,
  handler: <T, U>(handler: (ctx: any, args: T) => U) => ({ args, handler }),
};
