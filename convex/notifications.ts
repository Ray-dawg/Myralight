import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Define notification types
export const NotificationType = {
  LOAD_CREATED: "load_created",
  LOAD_UPDATED: "load_updated",
  LOAD_DELETED: "load_deleted",
  LOAD_ASSIGNED: "load_assigned",
  LOAD_STATUS_CHANGED: "load_status_changed",
  NEW_LOAD_POSTED: "new_load_posted",
  LOAD_IN_TRANSIT: "load_in_transit",
  LOAD_DELIVERED: "load_delivered",
  LOAD_COMPLETED: "load_completed",
  BID_RECEIVED: "bid_received",
  BID_ACCEPTED: "bid_accepted",
  BID_REJECTED: "bid_rejected",
  DOCUMENT_UPLOADED: "document_uploaded",
  DOCUMENT_VERIFIED: "document_verified",
  DOCUMENT_REQUIRED: "document_required",
  RATING_RECEIVED: "rating_received",
  LOCATION_UPDATED: "location_updated",
  PAYMENT_RECEIVED: "payment_received",
  SYSTEM_ALERT: "system_alert",
  GEOFENCE_ENTRY: "geofence_entry",
  GEOFENCE_EXIT: "geofence_exit",
  APPROACHING_GEOFENCE: "approaching_geofence",
  DWELL_TIME_ALERT: "dwell_time_alert",
  DEMAND_INCREASE: "demand_increase",
  MARKET_SHIFT: "market_shift",
  RATE_INCREASE: "rate_increase",
  NEW_OPPORTUNITY: "new_opportunity",