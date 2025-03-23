import { Request, Response } from "express";
import { LoadMatchingService } from "../services/load-matching.service";
import { logger } from "../utils/logger";

export class LoadMatchingController {
  private loadMatchingService: LoadMatchingService;

  constructor() {
    this.loadMatchingService = new LoadMatchingService();
  }

  /**
   * Find nearby loads for a driver
   */
  async findNearbyLoads(req: Request, res: Response): Promise<void> {
    try {
      const { driverId } = req.params;
      const { lat, lng, maxResults, maxDistance, includeExternalLoads } =
        req.query;

      if (!driverId || lat === undefined || lng === undefined) {
        res
          .status(400)
          .json({ error: "Driver ID, latitude, and longitude are required" });
        return;
      }

      const options = {
        maxResults: maxResults ? parseInt(maxResults as string, 10) : undefined,
        maxDistance: maxDistance
          ? parseInt(maxDistance as string, 10)
          : undefined,
        includeExternalLoads: includeExternalLoads === "true",
      };

      const loads = await this.loadMatchingService.findNearbyLoads(
        driverId,
        parseFloat(lat as string),
        parseFloat(lng as string),
        options,
      );

      res.status(200).json({
        success: true,
        loads,
      });
    } catch (error: any) {
      logger.error("Error finding nearby loads:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to find nearby loads",
      });
    }
  }

  /**
   * Assign load to driver
   */
  async assignLoadToDriver(req: Request, res: Response): Promise<void> {
    try {
      const { loadId, driverId } = req.params;

      if (!loadId || !driverId) {
        res.status(400).json({ error: "Load ID and Driver ID are required" });
        return;
      }

      const result = await this.loadMatchingService.assignLoadToDriver(
        loadId,
        driverId,
      );

      res.status(200).json({
        success: true,
        load: result,
      });
    } catch (error: any) {
      logger.error("Error assigning load to driver:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to assign load to driver",
      });
    }
  }

  /**
   * Release pending load
   */
  async releasePendingLoad(req: Request, res: Response): Promise<void> {
    try {
      const { loadId, driverId } = req.params;

      if (!loadId || !driverId) {
        res.status(400).json({ error: "Load ID and Driver ID are required" });
        return;
      }

      await this.loadMatchingService.releasePendingLoad(loadId, driverId);

      res.status(200).json({
        success: true,
        message: "Load released successfully",
      });
    } catch (error: any) {
      logger.error("Error releasing pending load:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to release pending load",
      });
    }
  }

  /**
   * Get load match details
   */
  async getLoadMatchDetails(req: Request, res: Response): Promise<void> {
    try {
      const { loadId, driverId } = req.params;

      if (!loadId || !driverId) {
        res.status(400).json({ error: "Load ID and Driver ID are required" });
        return;
      }

      const loadDetails = await this.loadMatchingService.getLoadMatchDetails(
        loadId,
        driverId,
      );

      res.status(200).json({
        success: true,
        load: loadDetails,
      });
    } catch (error: any) {
      logger.error("Error getting load match details:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get load match details",
      });
    }
  }
}
