import { notificationService, NotificationType, NotificationData } from "./notification.service";
import { logger } from "@/api/utils/logger";

/**
 * Geofence Notification Service
 * Specialized service for handling geofence-related notifications
 */
export class GeofenceNotificationService {
  private static instance: GeofenceNotificationService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): GeofenceNotificationService {
    if (!GeofenceNotificationService.instance) {
      GeofenceNotificationService.instance = new GeofenceNotificationService();
    }
    return GeofenceNotificationService.instance;
  }

  /**
   * Notify stakeholders about a driver entering a geofence
   * @param geofenceData Geofence entry data
   */
  async notifyGeofenceEntry(geofenceData: {
    geofenceId: string;
    loadId: string;
    loadNumber: string;
    driverId: string;
    shipperId: string;
    carrierId?: string;
    geofenceType: "pickup" | "delivery";
    locationName: string;
    timestamp: number;
    latitude: number;
    longitude: number;
  }): Promise<boolean> {
    try {
      const {
        geofenceId,
        loadId,
        loadNumber,
        driverId,
        shipperId,
        carrierId,
        geofenceType,
        locationName,
        timestamp,
        latitude,
        longitude,
      } = geofenceData;

      const entryTime = new Date(timestamp).toLocaleString();
      const isPickup = geofenceType === "pickup";

      // Prepare notification data
      const notificationData: NotificationData = {
        loadId,
        loadNumber,
        geofenceId,
        geofenceType,
        locationName,
        entryTime,
        latitude,
        longitude,
      };

      // Notify driver about geofence entry and prompt for action
      await notificationService.dispatchToParticipant(
        driverId,
        NotificationType.GEOFENCE_ENTRY,
        notificationData
      );

      // Notify shipper about driver arrival
      await notificationService.dispatchToParticipant(
        shipperId,
        NotificationType.GEOFENCE_ENTRY,
        notificationData
      );

      // Notify carrier about driver arrival if carrier ID is provided
      if (carrierId) {
        // In a real implementation, you would get carrier admin users and notify them
        // For now, we'll just log this
        logger.info(`Would notify carrier ${carrierId} about geofence entry`);
      }

      // If this is a delivery location, prompt driver to upload BOL
      if (!isPickup) {
        await notificationService.dispatchToParticipant(
          driverId,
          NotificationType.DOCUMENT_REQUIRED,
          {
            ...notificationData,
            documentType: "Bill of Lading (BOL)",
          }
        );
      }

      return true;
    } catch (error) {
      logger.error(`Error sending geofence entry notifications: ${error}`);
      return false;
    }
  }

  /**
   * Notify stakeholders about a driver exiting a geofence
   * @param geofenceData Geofence exit data
   */
  async notifyGeofenceExit(geofenceData: {
    geofenceId: string;
    loadId: string;
    loadNumber: string;
    driverId: string;
    shipperId: string;
    carrierId?: string;
    geofenceType: "pickup" | "delivery";
    locationName: string;
    timestamp: number;
    dwellTime: number; // Time spent in geofence in minutes
  }): Promise<boolean> {
    try {
      const {
        geofenceId,
        loadId,
        loadNumber,
        driverId,
        shipperId,
        carrierId,
        geofenceType,
        locationName,
        timestamp,
        dwellTime,
      } = geofenceData;

      const exitTime = new Date(timestamp).toLocaleString();
      const isPickup = geofenceType === "pickup";

      // Prepare notification data
      const notificationData: NotificationData = {
        loadId,
        loadNumber,
        geofenceId,
        geofenceType,
        locationName,
        exitTime,
        dwellTime,
      };

      // Notify driver about geofence exit
      await notificationService.dispatchToParticipant(
        driverId,
        NotificationType.GEOFENCE_EXIT,
        notificationData
      );

      // Notify shipper about driver departure
      await notificationService.dispatchToParticipant(
        shipperId,
        NotificationType.GEOFENCE_EXIT,
        notificationData
      );

      // Notify carrier about driver departure if carrier ID is provided
      if (carrierId) {
        // In a real implementation, you would get carrier admin users and notify them
        // For now, we'll just log this
        logger.info(`Would notify carrier ${carrierId} about geofence exit`);
      }

      // If this is a pickup location, update load status to in_transit
      if (isPickup) {
        // Notify driver about status change
        await notificationService.dispatchToParticipant(
          driverId,
          NotificationType.LOAD_STATUS_CHANGE,
          {
            ...notificationData,
            statusChange: "In Transit",
          }
        );
      }

      return true;
    } catch (error) {
      logger.error(`Error sending geofence exit notifications: ${error}`);
      return false;
    }
  }

  /**
   * Notify stakeholders about a driver approaching a geofence
   * @param geofenceData Approaching geofence data
   */
  async notifyApproachingGeofence(geofenceData: {
    geofenceId: string;
    loadId: string;
    loadNumber: string;
    driverId: string;
    shipperId: string;
    carrierId?: string;
    geofenceType: "pickup" | "delivery";
    locationName: string;
    estimatedTimeOfArrival: number;
    distanceInMeters: number;
  }): Promise<boolean> {
    try {
      const {
        geofenceId,
        loadId,
        loadNumber,
        driverId,
        shipperId,
        carrierId,
        geofenceType,
        locationName,
        estimatedTimeOfArrival,
        distanceInMeters,
      } = geofenceData;

      const distanceInMiles = Math.round(distanceInMeters / 1609.34 * 10) / 10; // Convert to miles with 1 decimal place
      
      // Only notify if we're within a reasonable distance (e.g., 10 miles)
      if (distanceInMiles > 10) {
        return true; // Skip notification if too far away
      }

      // Prepare notification data
      const notificationData: NotificationData = {
        loadId,
        loadNumber,
        geofenceId,
        geofenceType,
        locationName,
        estimatedTimeOfArrival,
        distanceInMeters,
      };

      // Notify facility about approaching driver
      await notificationService.dispatchToParticipant(
        shipperId,
        NotificationType.APPROACHING_GEOFENCE,
        notificationData
      );

      // Notify carrier about driver approaching location if carrier ID is provided
      if (carrierId) {
        // In a real implementation, you would get carrier admin users and notify them
        // For now, we'll just log this
        logger.info(`Would notify carrier ${carrierId} about approaching geofence`);
      }

      // Notify driver with facility information
      await notificationService.dispatchToParticipant(
        driverId,
        NotificationType.APPROACHING_GEOFENCE,
        notificationData
      );

      return true;
    } catch (error) {
      logger.error(`Error sending approaching geofence notifications: ${error}`);
      return false;
    }
  }

  /**
   * Notify stakeholders about extended dwell time in a geofence
   * @param geofenceData Dwell time alert data
   */
  async notifyDwellTimeAlert(geofenceData: {
    geofenceId: string;
    loadId: string;
    loadNumber: string;
    driverId: string;
    shipperId: string;
    carrierId?: string;
    geofenceType: "pickup" | "delivery";
    locationName: string;
    entryTimestamp: number;
    currentDwellTime: number; // Time spent in geofence in minutes
    thresholdExceeded: "warning" | "critical";
  }): Promise<boolean> {
    try {
      const {
        geofenceId,
        loadId,
        loadNumber,
        driverId,
