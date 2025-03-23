import { Request, Response } from "express";
import { SupabaseService } from "../services/supabase.service";
import { logger } from "../utils/logger";

export class LocationHistoryController {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = new SupabaseService();
  }

  /**
   * Get location history for a load
   */
  async getLocationHistory(req: Request, res: Response): Promise<void> {
    try {
      const { load_id } = req.params;
      const { limit } = req.query;

      if (!load_id) {
        res.status(400).json({ error: "Load ID is required" });
        return;
      }

      // Get location history
      const history = await this.supabaseService.getLocationHistory(
        load_id,
        limit ? parseInt(limit as string) : 100,
      );

      res.status(200).json({
        success: true,
        history,
      });
    } catch (error) {
      logger.error("Error in getLocationHistory:", error);
      res.status(500).json({ error: "Failed to get location history" });
    }
  }

  /**
   * Get latest location for a driver
   */
  async getDriverLocation(req: Request, res: Response): Promise<void> {
    try {
      const { driver_id } = req.params;

      if (!driver_id) {
        res.status(400).json({ error: "Driver ID is required" });
        return;
      }

      // Get driver details with current location
      const driver = await this.supabaseService.getDriverById(driver_id);

      if (!driver || !driver.currentLocation) {
        res.status(404).json({
          success: false,
          message: "Driver location not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        location: {
          latitude: driver.currentLocation.latitude,
          longitude: driver.currentLocation.longitude,
          heading: driver.currentLocation.heading,
          speed: driver.currentLocation.speed,
          timestamp: driver.currentLocation.lastUpdated,
        },
      });
    } catch (error) {
      logger.error("Error in getDriverLocation:", error);
      res.status(500).json({ error: "Failed to get driver location" });
    }
  }
}
