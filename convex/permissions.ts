import { mutation, query } from "./schema";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Define permission types
export const PERMISSION_CATEGORIES = [
  "Load Management",
  "Driver Management",
  "Fleet Management",
  "Document Management",
  "User Management",
  "Analytics",
  "Billing",
  "System Settings",
];

// Get all roles
export const getAllRoles = query({
  handler: async (ctx) => {
    return await ctx.db.query("roles").collect();
  },
});

// Get role by ID
export const getRole = query({
  args: { id: v.id("roles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get roles by organization ID
export const getRolesByOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roles")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();
  },
});

// Create a new role
export const createRole = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
    organizationId: v.id("organizations"),
    isCustom: v.boolean(),
    dashboardConfig: v.optional(
      v.object({
        visibleTabs: v.array(v.string()),
        defaultTab: v.string(),
        widgets: v.array(v.string()),
      }),
    ),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    // Check if role with same name already exists in organization
    const existingRole = await ctx.db
      .query("roles")
      .withIndex("by_organization_name", (q) =>
        q.eq("organizationId", args.organizationId).eq("name", args.name),
      )
      .first();

    if (existingRole) {
      throw new Error(
        `Role with name '${args.name}' already exists in this organization`,
      );
    }

    return await ctx.db.insert("roles", {
      name: args.name,
      description: args.description || "",
      permissions: args.permissions,
      organizationId: args.organizationId,
      isCustom: args.isCustom,
      dashboardConfig: args.dashboardConfig || {
        visibleTabs: ["loads", "analytics"],
        defaultTab: "loads",
        widgets: ["activeLoads", "completedLoads", "totalLoads"],
      },
      createdBy: args.createdBy,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

// Update an existing role
export const updateRole = mutation({
  args: {
    id: v.id("roles"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    dashboardConfig: v.optional(
      v.object({
        visibleTabs: v.array(v.string()),
        defaultTab: v.string(),
        widgets: v.array(v.string()),
      }),
    ),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { id, updatedBy, ...updates } = args;
    const role = await ctx.db.get(id);

    if (!role) {
      throw new Error("Role not found");
    }

    // Don't allow modification of system roles
    if (!role.isCustom) {
      throw new Error("Cannot modify system roles");
    }

    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
      updatedBy,
    });
  },
});

// Delete a role
export const deleteRole = mutation({
  args: {
    id: v.id("roles"),
  },
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.id);

    if (!role) {
      throw new Error("Role not found");
    }

    // Don't allow deletion of system roles
    if (!role.isCustom) {
      throw new Error("Cannot delete system roles");
    }

    // Check if any users are assigned to this role
    const usersWithRole = await ctx.db
      .query("users")
      .withIndex("by_role_id", (q) => q.eq("roleId", args.id))
      .first();

    if (usersWithRole) {
      throw new Error("Cannot delete role that has users assigned to it");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Get all permissions
export const getAllPermissions = query({
  handler: async (ctx) => {
    return await ctx.db.query("permissions").collect();
  },
});

// Get permissions by category
export const getPermissionsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("permissions")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

// Check if user has permission
export const checkUserPermission = query({
  args: {
    userId: v.id("users"),
    permission: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return false;
    }

    // If user has no roleId, check the legacy role field
    if (!user.roleId && user.role === "admin") {
      return true; // Legacy admins have all permissions
    }

    if (!user.roleId) {
      return false;
    }

    const role = await ctx.db.get(user.roleId);
    if (!role) {
      return false;
    }

    // Check if role has the specific permission or 'all' permission
    return (
      role.permissions.includes(args.permission) ||
      role.permissions.includes("all")
    );
  },
});

// Assign role to user
export const assignRoleToUser = mutation({
  args: {
    userId: v.id("users"),
    roleId: v.id("roles"),
    assignedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const role = await ctx.db.get(args.roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    // Update user with new role
    return await ctx.db.patch(args.userId, {
      roleId: args.roleId,
      updatedAt: Date.now(),
    });
  },
});

// Get users by role
export const getUsersByRole = query({
  args: { roleId: v.id("roles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role_id", (q) => q.eq("roleId", args.roleId))
      .collect();
  },
});

// Get dashboard configuration for user
export const getUserDashboardConfig = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // If user has custom dashboard config, return that
    if (user.dashboardConfig) {
      return user.dashboardConfig;
    }

    // Otherwise get from role
    if (user.roleId) {
      const role = await ctx.db.get(user.roleId);
      if (role?.dashboardConfig) {
        return role.dashboardConfig;
      }
    }

    // Default configuration if nothing else is available
    return {
      visibleTabs: ["loads", "analytics"],
      defaultTab: "loads",
      widgets: ["activeLoads", "completedLoads", "totalLoads"],
    };
  },
});

// Update user's custom dashboard configuration
export const updateUserDashboardConfig = mutation({
  args: {
    userId: v.id("users"),
    dashboardConfig: v.object({
      visibleTabs: v.array(v.string()),
      defaultTab: v.string(),
      widgets: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.patch(args.userId, {
      dashboardConfig: args.dashboardConfig,
      updatedAt: Date.now(),
    });
  },
});
