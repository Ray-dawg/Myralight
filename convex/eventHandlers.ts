import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  createNotification,
  createNotificationForCarrier,
  createNotificationForRole,
  NotificationType,
} from "./notifications";

// Event handler for load status changes
export const handleLoadStatusChange = internalMutation({
  args: {
    loadId: Id,
    previousStatus: string,
    newStatus: string,
    shipperId: Id,
    carrierId: Id,
    driverId: Id,
    referenceNumber: string,
  },
  handler: async (ctx, args) => {
    const {
      loadId,
      previousStatus,
      newStatus,
      shipperId,
      carrierId,
      driverId,
      referenceNumber,
    } = args;

    // Status-specific notifications
    switch (newStatus) {
      case "posted":
        // Notify all carriers about new load
        await createNotificationForRole(ctx, {
          role: "carrier",
          type: NotificationType.NEW_LOAD_POSTED,
          title: "New Load Available",
          message: `A new load (${referenceNumber}) has been posted and is available for bidding.`,
          relatedId: loadId,
          relatedType: "load",
          isActionRequired: true,
          actionUrl: `/loads/${loadId}`,
        });
        break;

      case "assigned":
        // Notify carrier users
        if (carrierId) {
          await createNotificationForCarrier(ctx, {
            carrierId,
            type: NotificationType.LOAD_ASSIGNED,
            title: "Load Assigned",
            message: `Load ${referenceNumber} has been assigned to your company.`,
            relatedId: loadId,
            relatedType: "load",
            isActionRequired: true,
            actionUrl: `/loads/${loadId}`,
          });
        }

        // Notify driver
        if (driverId) {
          await createNotification(ctx, {
            userId: driverId,
            type: NotificationType.LOAD_ASSIGNED,
            title: "Load Assigned",
            message: `Load ${referenceNumber} has been assigned to you.`,
            relatedId: loadId,
            relatedType: "load",
            isActionRequired: true,
            actionUrl: `/loads/${loadId}`,
          });
        }
        break;

      case "in_transit":
        // Notify shipper
        await createNotification(ctx, {
          userId: shipperId,
          type: NotificationType.LOAD_IN_TRANSIT,
          title: "Load In Transit",
          message: `Load ${referenceNumber} is now in transit.`,
          relatedId: loadId,
          relatedType: "load",
          isActionRequired: false,
          actionUrl: `/loads/${loadId}`,
        });

        // Notify carrier admin users
        if (carrierId) {
          await createNotificationForCarrier(ctx, {
            carrierId,
            type: NotificationType.LOAD_IN_TRANSIT,
            title: "Load In Transit",
            message: `Load ${referenceNumber} is now in transit.`,
            relatedId: loadId,
            relatedType: "load",
            isActionRequired: false,
            actionUrl: `/loads/${loadId}`,
          });
        }
        break;

      case "delivered":
        // Notify shipper
        await createNotification(ctx, {
          userId: shipperId,
          type: NotificationType.LOAD_DELIVERED,
          title: "Load Delivered",
          message: `Load ${referenceNumber} has been delivered.`,
          relatedId: loadId,
          relatedType: "load",
          isActionRequired: true,
          actionUrl: `/loads/${loadId}/rate`,
        });

        // Notify carrier admin users
        if (carrierId) {
          await createNotificationForCarrier(ctx, {
            carrierId,
            type: NotificationType.LOAD_DELIVERED,
            title: "Load Delivered",
            message: `Load ${referenceNumber} has been delivered.`,
            relatedId: loadId,
            relatedType: "load",
            isActionRequired: true,
            actionUrl: `/loads/${loadId}`,
          });
        }
        break;

      case "completed":
        // Notify all parties
        await createNotification(ctx, {
          userId: shipperId,
          type: NotificationType.LOAD_COMPLETED,
          title: "Load Completed",
          message: `Load ${referenceNumber} has been marked as completed.`,
          relatedId: loadId,
          relatedType: "load",
          isActionRequired: false,
          actionUrl: `/loads/${loadId}`,
        });

        if (carrierId) {
          await createNotificationForCarrier(ctx, {
            carrierId,
            type: NotificationType.LOAD_COMPLETED,
            title: "Load Completed",
            message: `Load ${referenceNumber} has been marked as completed.`,
            relatedId: loadId,
            relatedType: "load",
            isActionRequired: false,
            actionUrl: `/loads/${loadId}`,
          });
        }
        break;

      case "cancelled":
        // Notify relevant parties about cancellation
        await createNotification(ctx, {
          userId: shipperId,
          type: NotificationType.LOAD_STATUS_CHANGED,
          title: "Load Cancelled",
          message: `Load ${referenceNumber} has been cancelled.`,
          relatedId: loadId,
          relatedType: "load",
          isActionRequired: false,
          actionUrl: `/loads/${loadId}`,
        });

        if (carrierId) {
          await createNotificationForCarrier(ctx, {
            carrierId,
            type: NotificationType.LOAD_STATUS_CHANGED,
            title: "Load Cancelled",
            message: `Load ${referenceNumber} has been cancelled.`,
            relatedId: loadId,
            relatedType: "load",
            isActionRequired: false,
            actionUrl: `/loads/${loadId}`,
          });
        }

        if (driverId) {
          await createNotification(ctx, {
            userId: driverId,
            type: NotificationType.LOAD_STATUS_CHANGED,
            title: "Load Cancelled",
            message: `Load ${referenceNumber} has been cancelled.`,
            relatedId: loadId,
            relatedType: "load",
            isActionRequired: false,
            actionUrl: `/loads/${loadId}`,
          });
        }
        break;

      default:
        // Generic status change notification for shipper
        await createNotification(ctx, {
          userId: shipperId,
          type: NotificationType.LOAD_STATUS_CHANGED,
          title: "Load Status Changed",
          message: `Load ${referenceNumber} status changed from ${previousStatus} to ${newStatus}.`,
          relatedId: loadId,
          relatedType: "load",
          isActionRequired: false,
          actionUrl: `/loads/${loadId}`,
        });
    }

    return { success: true };
  },
});

// Event handler for document uploads
export const handleDocumentUploaded = internalMutation({
  args: {
    documentId: Id,
    loadId: Id,
    uploaderId: Id,
    documentType: string,
    documentName: string,
    shipperId: Id,
    carrierId: Id,
    referenceNumber: string,
  },
  handler: async (ctx, args) => {
    const {
      documentId,
      loadId,
      uploaderId,
      documentType,
      documentName,
      shipperId,
      carrierId,
      referenceNumber,
    } = args;

    // Notify shipper about document upload
    if (uploaderId !== shipperId) {
      await createNotification(ctx, {
        userId: shipperId,
        type: NotificationType.DOCUMENT_UPLOADED,
        title: "Document Uploaded",
        message: `A new ${documentType} document "${documentName}" has been uploaded for load ${referenceNumber}.`,
        relatedId: documentId,
        relatedType: "document",
        isActionRequired: true,
        actionUrl: `/loads/${loadId}/documents`,
      });
    }

    // Notify carrier about document upload if they didn't upload it
    if (carrierId && uploaderId !== carrierId) {
      await createNotificationForCarrier(ctx, {
        carrierId,
        type: NotificationType.DOCUMENT_UPLOADED,
        title: "Document Uploaded",
        message: `A new ${documentType} document "${documentName}" has been uploaded for load ${referenceNumber}.`,
        relatedId: documentId,
        relatedType: "document",
        isActionRequired: false,
        actionUrl: `/loads/${loadId}/documents`,
      });
    }

    return { success: true };
  },
});

// Event handler for bid submissions
export const handleBidSubmitted = internalMutation({
  args: {
    bidId: Id,
    loadId: Id,
    carrierId: Id,
    bidderId: Id,
    amount: number,
    shipperId: Id,
    referenceNumber: string,
  },
  handler: async (ctx, args) => {
    const {
      bidId,
      loadId,
      carrierId,
      bidderId,
      amount,
      shipperId,
      referenceNumber,
    } = args;

    // Format amount as currency
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount / 100); // Convert cents to dollars

    // Notify shipper about new bid
    await createNotification(ctx, {
      userId: shipperId,
      type: NotificationType.BID_RECEIVED,
      title: "New Bid Received",
      message: `A new bid of ${formattedAmount} has been submitted for load ${referenceNumber}.`,
      relatedId: bidId,
      relatedType: "bid",
      isActionRequired: true,
      actionUrl: `/loads/${loadId}/bids`,
    });

    return { success: true };
  },
});

// Event handler for bid responses (accepted/rejected)
export const handleBidResponse = internalMutation({
  args: {
    bidId: Id,
    loadId: Id,
    carrierId: Id,
    bidderId: Id,
    status: string,
    amount: number,
    referenceNumber: string,
    responseNotes: string,
  },
  handler: async (ctx, args) => {
    const {
      bidId,
      loadId,
      carrierId,
      bidderId,
      status,
      amount,
      referenceNumber,
      responseNotes,
    } = args;

    // Format amount as currency
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount / 100); // Convert cents to dollars

    // Determine notification type and title based on status
    const type =
      status === "accepted"
        ? NotificationType.BID_ACCEPTED
        : NotificationType.BID_REJECTED;
    const title = status === "accepted" ? "Bid Accepted" : "Bid Rejected";
    const message =
      status === "accepted"
        ? `Your bid of ${formattedAmount} for load ${referenceNumber} has been accepted.${responseNotes ? ` Note: ${responseNotes}` : ""}`
        : `Your bid of ${formattedAmount} for load ${referenceNumber} has been rejected.${responseNotes ? ` Reason: ${responseNotes}` : ""}`;

    // Notify carrier about bid response
    await createNotificationForCarrier(ctx, {
      carrierId,
      type,
      title,
      message,
      relatedId: bidId,
      relatedType: "bid",
      isActionRequired: status === "accepted",
      actionUrl: `/loads/${loadId}`,
    });

    // Specifically notify the user who placed the bid
    await createNotification(ctx, {
      userId: bidderId,
      type,
      title,
      message,
      relatedId: bidId,
      relatedType: "bid",
      isActionRequired: status === "accepted",
      actionUrl: `/loads/${loadId}`,
    });

    return { success: true };
  },
});

// Event handler for location updates
export const handleLocationUpdate = internalMutation({
  args: {
    loadId: Id,
    latitude: number,
    longitude: number,
    timestamp: number,
    estimatedTimeOfArrival: number,
    shipperId: Id,
    referenceNumber: string,
  },
  handler: async (ctx, args) => {
    const {
      loadId,
      latitude,
      longitude,
      timestamp,
      estimatedTimeOfArrival,
      shipperId,
      referenceNumber,
    } = args;

    // Only send notifications for significant location updates or ETA changes
    // This is a simplified example - in a real app, you might want to implement more sophisticated logic

    if (estimatedTimeOfArrival) {
      const etaDate = new Date(estimatedTimeOfArrival);
      const formattedETA = etaDate.toLocaleString();

      // Notify shipper about updated ETA
      await createNotification(ctx, {
        userId: shipperId,
        type: NotificationType.LOCATION_UPDATED,
        title: "ETA Updated",
        message: `The estimated time of arrival for load ${referenceNumber} has been updated to ${formattedETA}.`,
        relatedId: loadId,
        relatedType: "load",
        isActionRequired: false,
        actionUrl: `/loads/${loadId}`,
      });
    }

    return { success: true };
  },
});

// Event handler for ratings
export const handleRatingSubmitted = internalMutation({
  args: {
    ratingId: Id,
    loadId: Id,
    fromUserId: Id,
    toUserId: Id,
    toCarrierId: Id,
    rating: number,
    referenceNumber: string,
  },
  handler: async (ctx, args) => {
    const {
      ratingId,
      loadId,
      fromUserId,
      toUserId,
      toCarrierId,
      rating,
      referenceNumber,
    } = args;

    // Notify user who received the rating
    await createNotification(ctx, {
      userId: toUserId,
      type: NotificationType.RATING_RECEIVED,
      title: "New Rating Received",
      message: `You received a ${rating}-star rating for load ${referenceNumber}.`,
      relatedId: ratingId,
      relatedType: "rating",
      isActionRequired: false,
      actionUrl: `/loads/${loadId}`,
    });

    // If rating was for a carrier, notify carrier admin users
    if (toCarrierId) {
      await createNotificationForCarrier(ctx, {
        carrierId: toCarrierId,
        type: NotificationType.RATING_RECEIVED,
        title: "New Rating Received",
        message: `Your company received a ${rating}-star rating for load ${referenceNumber}.`,
        relatedId: ratingId,
        relatedType: "rating",
        isActionRequired: false,
        actionUrl: `/loads/${loadId}`,
      });
    }

    return { success: true };
  },
});

// Event handler for geofence entry
export const handleGeofenceEntry = internalMutation({
  args: {
    geofenceId: Id,
    loadId: Id,
    driverId: Id,
    shipperId: Id,
    carrierId: Id,
    referenceNumber: string,
    geofenceType: string, // "pickup" or "delivery"
    locationName: string,
    timestamp: number,
    latitude: number,
    longitude: number,
  },
  handler: async (ctx, args) => {
    const {
      geofenceId,
      loadId,
      driverId,
      shipperId,
      carrierId,
      referenceNumber,
      geofenceType,
      locationName,
      timestamp,
      latitude,
      longitude,
    } = args;

    const entryTime = new Date(timestamp).toLocaleString();
    const isPickup = geofenceType === "pickup";
    const locationTypeText = isPickup ? "pickup" : "delivery";
    const actionText = isPickup ? "arrived at pickup" : "arrived at delivery";

    // Notify driver about geofence entry and prompt for action
    await createNotification(ctx, {
      userId: driverId,
      type: NotificationType.GEOFENCE_ENTRY,
      title: isPickup ? "Pickup Location Reached" : "Delivery Location Reached",
      message: `You have entered the ${locationTypeText} zone for load ${referenceNumber} at ${locationName}. ${isPickup ? "Please prepare for loading." : "Please prepare for unloading."}`,
      relatedId: geofenceId,
      relatedType: "geofence",
      isActionRequired: true,
      actionUrl: isPickup
        ? `/loads/${loadId}/pickup`
        : `/loads/${loadId}/delivery`,
    });

    // Notify shipper about driver arrival
    await createNotification(ctx, {
      userId: shipperId,
      type: NotificationType.GEOFENCE_ENTRY,
      title: `Driver ${actionText}`,
      message: `The driver has ${actionText} location for load ${referenceNumber} at ${locationName} (${entryTime}).`,
      relatedId: loadId,
      relatedType: "load",
      isActionRequired: false,
      actionUrl: `/loads/${loadId}/tracking`,
    });

    // Notify carrier about driver arrival
    if (carrierId) {
      await createNotificationForCarrier(ctx, {
        carrierId,
        type: NotificationType.GEOFENCE_ENTRY,
        title: `Driver ${actionText}`,
        message: `Your driver has ${actionText} location for load ${referenceNumber} at ${locationName} (${entryTime}).`,
        relatedId: loadId,
        relatedType: "load",
        isActionRequired: false,
        actionUrl: `/loads/${loadId}/tracking`,
      });
    }

    // If this is a delivery location, prompt driver to upload BOL
    if (!isPickup) {
      await createNotification(ctx, {
        userId: driverId,
        type: NotificationType.DOCUMENT_REQUIRED,
        title: "BOL Upload Required",
        message: `Please upload the signed Bill of Lading (BOL) for load ${referenceNumber}.`,
        relatedId: loadId,
        relatedType: "load",
        isActionRequired: true,
        actionUrl: `/loads/${loadId}/documents/upload`,
      });
    }

    return { success: true };
  },
});

// Event handler for geofence exit
export const handleGeofenceExit = internalMutation({
  args: {
    geofenceId: Id,
    loadId: Id,
    driverId: Id,
    shipperId: Id,
    carrierId: Id,
    referenceNumber: string,
    geofenceType: string, // "pickup" or "delivery"
    locationName: string,
    timestamp: number,
    dwellTime: number, // Time spent in geofence in minutes
  },
  handler: async (ctx, args) => {
    const {
      geofenceId,
      loadId,
      driverId,
      shipperId,
      carrierId,
      referenceNumber,
      geofenceType,
      locationName,
      timestamp,
      dwellTime,
    } = args;

    const exitTime = new Date(timestamp).toLocaleString();
    const isPickup = geofenceType === "pickup";
    const locationTypeText = isPickup ? "pickup" : "delivery";
    const actionText = isPickup
      ? "departed from pickup"
      : "departed from delivery";
    const formattedDwellTime =
      dwellTime >= 60
        ? `${Math.floor(dwellTime / 60)} hours ${dwellTime % 60} minutes`
        : `${dwellTime} minutes`;

    // Notify shipper about driver departure
    await createNotification(ctx, {
      userId: shipperId,
      type: NotificationType.GEOFENCE_EXIT,
      title: `Driver ${actionText}`,
      message: `The driver has ${actionText} location for load ${referenceNumber} at ${exitTime}. Total time at location: ${formattedDwellTime}.`,
      relatedId: loadId,
      relatedType: "load",
      isActionRequired: false,
      actionUrl: `/loads/${loadId}/tracking`,
    });

    // Notify carrier about driver departure
    if (carrierId) {
      await createNotificationForCarrier(ctx, {
        carrierId,
        type: NotificationType.GEOFENCE_EXIT,
        title: `Driver ${actionText}`,
        message: `Your driver has ${actionText} location for load ${referenceNumber} at ${exitTime}. Total time at location: ${formattedDwellTime}.`,
        relatedId: loadId,
        relatedType: "load",
        isActionRequired: false,
        actionUrl: `/loads/${loadId}/tracking`,
      });
    }

    // If this is a pickup location, update load status to in_transit
    if (isPickup) {
      // Notify driver about status change
      await createNotification(ctx, {
        userId: driverId,
        type: NotificationType.LOAD_STATUS_CHANGED,
        title: "Load Status Updated",
        message: `Load ${referenceNumber} status has been updated to In Transit.`,
        relatedId: loadId,
        relatedType: "load",
        isActionRequired: false,
        actionUrl: `/loads/${loadId}`,
      });
    }

    return { success: true };
  },
});

// Event handler for approaching geofence
export const handleApproachingGeofence = internalMutation({
  args: {
    geofenceId: Id,
    loadId: Id,
    driverId: Id,
    shipperId: Id,
    carrierId: Id,
    referenceNumber: string,
    geofenceType: string, // "pickup" or "delivery"
    locationName: string,
    estimatedTimeOfArrival: number,
    distanceInMeters: number,
  },
  handler: async (ctx, args) => {
    const {
      geofenceId,
      loadId,
      driverId,
      shipperId,
      carrierId,
      referenceNumber,
      geofenceType,
      locationName,
      estimatedTimeOfArrival,
      distanceInMeters,
    } = args;

    const etaDate = new Date(estimatedTimeOfArrival);
    const formattedETA = etaDate.toLocaleString();
    const distanceInMiles = Math.round((distanceInMeters / 1609.34) * 10) / 10; // Convert to miles with 1 decimal place
    const isPickup = geofenceType === "pickup";
    const locationTypeText = isPickup ? "pickup" : "delivery";

    // Only notify if we're within a reasonable distance (e.g., 10 miles)
    if (distanceInMiles <= 10) {
      // Notify facility about approaching driver
      await createNotification(ctx, {
        userId: shipperId,
        type: NotificationType.APPROACHING_GEOFENCE,
        title: `Driver Approaching ${isPickup ? "Pickup" : "Delivery"} Location`,
        message: `A driver is ${distanceInMiles} miles away from the ${locationTypeText} location for load ${referenceNumber}. ETA: ${formattedETA}.`,
        relatedId: loadId,
        relatedType: "load",
        isActionRequired: false,
        actionUrl: `/loads/${loadId}/tracking`,
      });

      // Notify carrier about driver approaching location
      if (carrierId) {
        await createNotificationForCarrier(ctx, {
          carrierId,
          type: NotificationType.APPROACHING_GEOFENCE,
          title: `Driver Approaching ${isPickup ? "Pickup" : "Delivery"} Location`,
          message: `Your driver is ${distanceInMiles} miles away from the ${locationTypeText} location for load ${referenceNumber}. ETA: ${formattedETA}.`,
          relatedId: loadId,
          relatedType: "load",
          isActionRequired: false,
          actionUrl: `/loads/${loadId}/tracking`,
        });
      }

      // Notify driver with facility information
      await createNotification(ctx, {
        userId: driverId,
        type: NotificationType.APPROACHING_GEOFENCE,
        title: `Approaching ${isPickup ? "Pickup" : "Delivery"} Location`,
        message: `You are ${distanceInMiles} miles away from ${locationName}. Please follow facility protocols upon arrival.`,
        relatedId: loadId,
        relatedType: "load",
        isActionRequired: false,
        actionUrl: `/loads/${loadId}/details`,
      });
    }

    return { success: true };
  },
});

// Event handler for geofence dwell time alerts
export const handleGeofenceDwellTimeAlert = internalMutation({
  args: {
    geofenceId: Id,
    loadId: Id,
    driverId: Id,
    shipperId: Id,
    carrierId: Id,
    referenceNumber: string,
    geofenceType: string, // "pickup" or "delivery"
    locationName: string,
    entryTimestamp: number,
    currentDwellTime: number, // Time spent in geofence in minutes
    thresholdExceeded: string, // "warning" or "critical"
  },
  handler: async (ctx, args) => {
    const {
      geofenceId,
      loadId,
      driverId,
      shipperId,
      carrierId,
      referenceNumber,
      geofenceType,
      locationName,
      entryTimestamp,
      currentDwellTime,
      thresholdExceeded,
    } = args;

    const entryTime = new Date(entryTimestamp).toLocaleString();
    const isPickup = geofenceType === "pickup";
    const locationTypeText = isPickup ? "pickup" : "delivery";
    const formattedDwellTime =
      currentDwellTime >= 60
        ? `${Math.floor(currentDwellTime / 60)} hours ${currentDwellTime % 60} minutes`
        : `${currentDwellTime} minutes`;
    const isCritical = thresholdExceeded === "critical";

    // Notification title and message based on severity
    const title = isCritical
      ? `CRITICAL: Extended Dwell Time at ${locationTypeText}`
      : `WARNING: Extended Dwell Time at ${locationTypeText}`;

    const message = `Driver has been at the ${locationTypeText} location for load ${referenceNumber} for ${formattedDwellTime}. This exceeds the ${isCritical ? "critical" : "warning"} threshold.`;

    // Notify shipper about extended dwell time
    await createNotification(ctx, {
      userId: shipperId,
      type: NotificationType.DWELL_TIME_ALERT,
      title,
      message,
      relatedId: loadId,
      relatedType: "load",
      isActionRequired: isCritical,
      actionUrl: `/loads/${loadId}/tracking`,
    });

    // Notify carrier about extended dwell time
    if (carrierId) {
      await createNotificationForCarrier(ctx, {
        carrierId,
        type: NotificationType.DWELL_TIME_ALERT,
        title,
        message,
        relatedId: loadId,
        relatedType: "load",
        isActionRequired: isCritical,
        actionUrl: `/loads/${loadId}/tracking`,
      });
    }

    // If critical, also notify driver
    if (isCritical) {
      await createNotification(ctx, {
        userId: driverId,
        type: NotificationType.DWELL_TIME_ALERT,
        title: `Extended Time at ${isPickup ? "Pickup" : "Delivery"} Location`,
        message: `You have been at the ${locationTypeText} location for ${formattedDwellTime}. Please update your status or contact dispatch if you're experiencing delays.`,
        relatedId: loadId,
        relatedType: "load",
        isActionRequired: true,
        actionUrl: `/loads/${loadId}/update-status`,
      });
    }

    return { success: true };
  },
});
