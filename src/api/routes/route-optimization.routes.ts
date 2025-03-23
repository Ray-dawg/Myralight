import { Router } from "express";
import { RouteOptimizationController } from "../controllers/route-optimization.controller";

const router = Router();
const routeOptimizationController = new RouteOptimizationController();

// Generate route from driver to load
router.post(
  "/driver/:driverId/load/:loadId",
  routeOptimizationController.generateDriverToLoadRoute.bind(
    routeOptimizationController,
  ),
);

// Find optimal driver for a load
router.get(
  "/load/:loadId/optimal-drivers",
  routeOptimizationController.findOptimalDriverForLoad.bind(
    routeOptimizationController,
  ),
);

// Generate multi-stop route for a driver with multiple loads
router.post(
  "/driver/:driverId/multi-stop",
  routeOptimizationController.generateMultiStopRoute.bind(
    routeOptimizationController,
  ),
);

// Cancel route updates for a driver and load
router.delete(
  "/driver/:driverId/load/:loadId/updates",
  routeOptimizationController.cancelRouteUpdates.bind(
    routeOptimizationController,
  ),
);

export default router;
