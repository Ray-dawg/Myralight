import { Router } from "express";
import { LoadMatchingController } from "../controllers/load-matching.controller";

const router = Router();
const loadMatchingController = new LoadMatchingController();

// Find nearby loads for a driver
router.get(
  "/driver/:driverId/nearby",
  loadMatchingController.findNearbyLoads.bind(loadMatchingController),
);

// Assign load to driver
router.post(
  "/load/:loadId/assign/:driverId",
  loadMatchingController.assignLoadToDriver.bind(loadMatchingController),
);

// Release pending load
router.post(
  "/load/:loadId/release/:driverId",
  loadMatchingController.releasePendingLoad.bind(loadMatchingController),
);

// Get load match details
router.get(
  "/load/:loadId/details/:driverId",
  loadMatchingController.getLoadMatchDetails.bind(loadMatchingController),
);

export default router;
