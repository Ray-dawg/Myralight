import { Router } from "express";
import {
  createGeofence,
  getGeofence,
  getAllGeofences,
  updateGeofence,
  deleteGeofence,
  getGeofenceEvents,
  getVehicleGeofenceEvents,
} from "../controllers/geofence.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Geofence CRUD operations
router.post("/", createGeofence);
router.get("/", getAllGeofences);
router.get("/:id", getGeofence);
router.put("/:id", updateGeofence);
router.delete("/:id", deleteGeofence);

// Geofence events
router.get("/:id/events", getGeofenceEvents);
router.get("/vehicle/:vehicleId/events", getVehicleGeofenceEvents);

export default router;
