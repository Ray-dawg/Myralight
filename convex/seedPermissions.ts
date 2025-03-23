import { mutation } from "./schema";
import { v } from "convex/values";
import { PERMISSION_CATEGORIES } from "./permissions";

// Seed the permissions table with default permissions
export const seedPermissions = mutation({
  args: {},
  handler: async (ctx) => {
    const timestamp = Date.now();
    
    // Define all permissions by category
    const permissionsByCategory = {
      "Load Management": [
        { name: "read:loads", description: "View load information" },
        { name: "create:loads", description: "Create new loads" },
        { name: "update:loads", description: "Update load details" },
        { name: "delete:loads", description: "Delete loads" },
        { name: "assign:loads", description: "Assign loads to carriers/drivers" },
        { name: "track:loads", description: "Track load status and location" },
      ],
      "Driver Management": [
        { name: "read:drivers", description: "View driver information" },
        { name: "create:drivers", description: "Create new driver profiles" },
        { name: "update:drivers", description: "Update driver details" },
        { name: "delete:drivers", description: "Delete driver profiles" },
        { name: "assign:drivers", description: "Assign drivers to loads" },
        { name: "track:drivers", description: "Track driver location and status" },
      ],
      "Fleet Management": [
        { name: "read:fleet", description: "View fleet information" },
        { name: "create:vehicles", description: "Add vehicles to the fleet" },
        { name: "update:vehicles", description: "Update vehicle details" },
        { name: "delete:vehicles", description: "Remove vehicles from the fleet" },
        { name: "manage:maintenance", description: "Schedule and track vehicle maintenance" },
      ],
      "Document Management": [
        { name: "read:documents", description: "View documents" },
        { name: "upload:documents", description: "Upload new documents" },
        { name: "update:documents", description: "Update document details" },
        { name: "delete:documents", description: "Delete documents" },
        { name: "verify:documents", description: "Verify document authenticity" },
      ],
      "User Management": [
        { name: "read:users", description: "View user information" },
        { name: "create:users", description: "Create new user accounts" },
        { name: "update:users", description: "Update user details" },
        { name: "delete:users", description: "Delete user accounts" },
        { name: "manage:roles", description: "Assign and manage user roles" },
      ],
      "Analytics": [
        { name: "view:analytics", description: "Access analytics dashboards" },
        { name: "export:reports", description: "Export data reports" },
        { name: "create:reports", description: "Create custom reports" },
      ],
      "Billing": [
        { name: "view:invoices", description: "View invoice information" },
        { name: "create:invoices", description: "Create new invoices" },
        { name: "