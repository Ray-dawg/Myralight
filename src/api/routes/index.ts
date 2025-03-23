import { Router } from "express";
import loadRoutes from "./load.routes";
import trackingRoutes from "./tracking.routes";
import routeOptimizationRoutes from "./route-optimization.routes";
import loadMatchingRoutes from "./load-matching.routes";

const router = Router();

// Load routes
router.use("/load", loadRoutes);

// Tracking routes
router.use("/tracking", trackingRoutes);

// Route optimization routes
router.use("/routes", routeOptimizationRoutes);

// Load matching routes
router.use("/matching", loadMatchingRoutes);

export default router;
