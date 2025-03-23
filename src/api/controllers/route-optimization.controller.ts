import { Request, Response } from "express";
import { RouteOptimizationService } from "../services/route-optimization.service";
import { logger } from "../utils/logger";

export class RouteOptimizationController {
  private routeOptimizationService: RouteOptimizationService;

  constructor() {
    this.routeOptimizationService = new RouteOptimizationService();
  }

  /**
   * Generate route from driver to load
   */
  async generateDriverToLoadRoute(req: Request, res: Response): Promise<void> {
    try {
      const { driverId, loadId } = req.params;
      const options = req.body.options || {};

      if (!driverId || !loadId) {
        res.status(400).json({ error: "Driver ID and Load ID are required" });
        return;
      }

      const route =
        await this.routeOptimizationService.generateDriverToLoadRoute(
          driverId,
          loadId,
          options,
        );

      res.status(200).json(route);
    } catch (error: any) {
      logger.error("Error generating driver to load route:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to generate route" });
    }
  }

  /**
   * Find optimal driver for a load
   */
  async findOptimalDriverForLoad(req: Request, res: Response): Promise<void> {
    try {
      const { loadId } = req.params;
      const { maxDrivers, maxDistance } = req.query;

      if (!loadId) {
        res.status(400).json({ error: "Load ID is required" });
        return;
      }

      const drivers =
        await this.routeOptimizationService.findOptimalDriverForLoad(
          loadId,
          maxDrivers ? parseInt(maxDrivers as string, 10) : undefined,
          maxDistance ? parseInt(maxDistance as string, 10) : undefined,
        );

      res.status(200).json(drivers);
    } catch (error: any) {
      logger.error("Error finding optimal driver for load:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to find optimal driver" });
    }
  }

  /**
   * Generate multi-stop route for a driver with multiple loads
   */
  async generateMultiStopRoute(req: Request, res: Response): Promise<void> {
    try {
      const { driverId } = req.params;
      const { loadIds, options } = req.body;

      if (
        !driverId ||
        !loadIds ||
        !Array.isArray(loadIds) ||
        loadIds.length === 0
      ) {
        res
          .status(400)
          .json({ error: "Driver ID and at least one Load ID are required" });
        return;
      }

      const route = await this.routeOptimizationService.generateMultiStopRoute(
        driverId,
        loadIds,
        options,
      );

      res.status(200).json(route);
    } catch (error: any) {
      logger.error("Error generating multi-stop route:", error);
      res
        .status(500)
        .json({
          error: error.message || "Failed to generate multi-stop route",
        });
    }
  }

  /**
   * Cancel route updates for a driver and load
   */
  async cancelRouteUpdates(req: Request, res: Response): Promise<void> {
    try {
      const { driverId, loadId } = req.params;

      if (!driverId || !loadId) {
        res.status(400).json({ error: "Driver ID and Load ID are required" });
        return;
      }

      this.routeOptimizationService.cancelRouteUpdates(driverId, loadId);

      res.status(200).json({ message: "Route updates cancelled successfully" });
    } catch (error: any) {
      logger.error("Error cancelling route updates:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to cancel route updates" });
    }
  }
}
