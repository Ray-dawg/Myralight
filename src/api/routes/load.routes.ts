import express from "express";
import { LoadController } from "../controllers/load.controller";

const router = express.Router();
const loadController = new LoadController();

// Request nearby loads
router.post("/request", (req, res) => loadController.requestLoads(req, res));

// Accept a load
router.post("/accept", (req, res) => loadController.acceptLoad(req, res));

// Update load status
router.post("/status", (req, res) => loadController.updateLoadStatus(req, res));

// Update driver location
router.post("/location", (req, res) =>
  loadController.updateDriverLocation(req, res),
);

// Get load details
router.get("/:load_id", (req, res) => loadController.getLoadDetails(req, res));

// Search loads
router.get("/", (req, res) => loadController.searchLoads(req, res));

export default router;
