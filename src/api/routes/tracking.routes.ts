import { Router } from "express";
import { TrackingController } from "../controllers/tracking.controller";
import { LocationHistoryController } from "../controllers/location-history.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const trackingController = new TrackingController();
const locationHistoryController = new LocationHistoryController();

// Start tracking a driver for a specific load
router.post(
  "/start",
  authMiddleware(["admin", "carrier", "driver"]),
  trackingController.startTracking.bind(trackingController),
);

// Stop tracking a driver
router.post(
  "/stop/:driver_id",
  authMiddleware(["admin", "carrier", "driver"]),
  trackingController.stopTracking.bind(trackingController),
);

// Get all active tracking sessions
router.get(
  "/sessions",
  authMiddleware(["admin"]),
  trackingController.getActiveSessions.bind(trackingController),
);

// Get tracking session for a driver
router.get(
  "/driver/:driver_id",
  authMiddleware(["admin", "carrier", "driver"]),
  trackingController.getDriverSession.bind(trackingController),
);

// Get tracking session for a load
router.get(
  "/load/:load_id",
  authMiddleware(["admin", "carrier", "shipper"]),
  trackingController.getLoadSession.bind(trackingController),
);

// Update tracking interval for a driver
router.put(
  "/interval/:driver_id",
  authMiddleware(["admin", "carrier"]),
  trackingController.updateTrackingInterval.bind(trackingController),
);

// Manual location update for a driver
router.post(
  "/location",
  authMiddleware(["admin", "carrier", "driver"]),
  trackingController.manualLocationUpdate.bind(trackingController),
);

// Get location history for a load
router.get(
  "/history/:load_id",
  authMiddleware(["admin", "carrier", "shipper", "driver"]),
  locationHistoryController.getLocationHistory.bind(locationHistoryController),
);

// Get latest location for a driver
router.get(
  "/driver-location/:driver_id",
  authMiddleware(["admin", "carrier", "shipper"]),
  locationHistoryController.getDriverLocation.bind(locationHistoryController),
);

export default router;
