import { Request, Response } from "express";
import { LoadService } from "../services/load.service";
import { WebSocketService } from "../services/websocket.service";
import { TrackingService } from "../services/tracking.service";
import { validateLoadRequest } from "../validators/load.validator";
import { logger } from "../utils/logger";

export class LoadController {
  private loadService: LoadService;
  private wsService: WebSocketService;
  private trackingService: TrackingService;

  constructor() {
    this.loadService = new LoadService();
    this.wsService = WebSocketService.getInstance();
    this.trackingService = TrackingService.getInstance();
  }

  /**
   * Request nearby loads for a driver
   */
  async requestLoads(req: Request, res: Response): Promise<void> {
    try {
      const { driver_id, current_lat, current_lng, max_distance } = req.body;

      // Validate request
      const validationError = validateLoadRequest(req.body);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      // Find nearby loads
      const nearbyLoads = await this.loadService.findNearbyLoads(
        driver_id,
        current_lat,
        current_lng,
        max_distance || 50, // Default 50 miles if not specified
      );

      // Update load statuses to pending
      if (nearbyLoads.length > 0) {
        await this.loadService.updateLoadStatusesToPending(
          nearbyLoads.map((load) => load.id),
        );

        // Emit WebSocket event for real-time updates
        this.wsService.emitLoadStatusChange(nearbyLoads, "pending");
      }

      res.status(200).json({
        success: true,
        loads: nearbyLoads.map((load) => ({
          id: load.id,
          pickup_location: load.pickup_location,
          delivery_location: load.delivery_location,
          distance: this.loadService.calculateDistance(
            current_lat,
            current_lng,
            load.pickup_lat,
            load.pickup_lng,
          ),
          estimated_price: load.rate,
          weight: load.weight,
          dimensions: load.dimensions,
          pickup_time: load.pickup_window_start,
        })),
      });
    } catch (error) {
      logger.error("Error in requestLoads:", error);
      res.status(500).json({ error: "Failed to request loads" });
    }
  }

  /**
   * Accept a load by a driver
   */
  async acceptLoad(req: Request, res: Response): Promise<void> {
    try {
      const { driver_id, load_id } = req.body;

      if (!driver_id || !load_id) {
        res.status(400).json({ error: "Driver ID and Load ID are required" });
        return;
      }

      // Check if load is available
      const load = await this.loadService.getLoadById(load_id);
      if (!load) {
        res.status(404).json({ error: "Load not found" });
        return;
      }

      if (load.status !== "pending" && load.status !== "posted") {
        res.status(400).json({ error: `Load is already ${load.status}` });
        return;
      }

      // Assign load to driver
      const updatedLoad = await this.loadService.assignLoadToDriver(
        load_id,
        driver_id,
      );

      // Emit WebSocket event
      this.wsService.emitLoadAssigned(updatedLoad, driver_id);

      // Start tracking the driver for this load
      await this.trackingService.initializeDriverTracking(driver_id, load_id);

      res.status(200).json({
        success: true,
        load: updatedLoad,
        tracking: true,
      });
    } catch (error) {
      logger.error("Error in acceptLoad:", error);
      res.status(500).json({ error: "Failed to accept load" });
    }
  }

  /**
   * Update load status
   */
  async updateLoadStatus(req: Request, res: Response): Promise<void> {
    try {
      const { load_id, status, location, notes } = req.body;

      if (!load_id || !status) {
        res.status(400).json({ error: "Load ID and status are required" });
        return;
      }

      // Validate status
      const validStatuses = [
        "assigned",
        "in_transit",
        "delivered",
        "completed",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }

      // Update load status
      const updatedLoad = await this.loadService.updateLoadStatus(
        load_id,
        status,
        location,
        notes,
      );

      // Emit WebSocket event
      this.wsService.emitLoadStatusChange([updatedLoad], status);

      // If load is completed or cancelled, stop tracking
      if (status === "completed" || status === "cancelled") {
        if (updatedLoad.driverId) {
          await this.trackingService.stopDriverTracking(updatedLoad.driverId);
        }
      }

      res.status(200).json({
        success: true,
        load: updatedLoad,
      });
    } catch (error) {
      logger.error("Error in updateLoadStatus:", error);
      res.status(500).json({ error: "Failed to update load status" });
    }
  }

  /**
   * Update driver location
   */
  async updateDriverLocation(req: Request, res: Response): Promise<void> {
    try {
      const { driver_id, latitude, longitude, heading, speed } = req.body;

      if (!driver_id || latitude === undefined || longitude === undefined) {
        res
          .status(400)
          .json({ error: "Driver ID, latitude, and longitude are required" });
        return;
      }

      // Update driver location
      const updatedDriver = await this.loadService.updateDriverLocation(
        driver_id,
        latitude,
        longitude,
        heading,
        speed,
      );

      // Get active load for driver if any
      const activeLoad =
        await this.loadService.getActiveLoadForDriver(driver_id);

      if (activeLoad) {
        // Update load ETA based on new location
        const updatedEta = await this.loadService.updateLoadETA(
          activeLoad.id,
          latitude,
          longitude,
        );

        // Emit WebSocket event for location update
        this.wsService.emitDriverLocationUpdate(driver_id, {
          latitude,
          longitude,
          heading,
          speed,
          load_id: activeLoad.id,
          eta: updatedEta,
        });
      }

      res.status(200).json({
        success: true,
        driver: updatedDriver,
      });
    } catch (error) {
      logger.error("Error in updateDriverLocation:", error);
      res.status(500).json({ error: "Failed to update driver location" });
    }
  }

  /**
   * Get load details
   */
  async getLoadDetails(req: Request, res: Response): Promise<void> {
    try {
      const { load_id } = req.params;

      if (!load_id) {
        res.status(400).json({ error: "Load ID is required" });
        return;
      }

      // Get load details
      const load = await this.loadService.getLoadWithDetails(load_id);

      if (!load) {
        res.status(404).json({ error: "Load not found" });
        return;
      }

      res.status(200).json({
        success: true,
        load,
      });
    } catch (error) {
      logger.error("Error in getLoadDetails:", error);
      res.status(500).json({ error: "Failed to get load details" });
    }
  }

  /**
   * Search loads with filters
   */
  async searchLoads(req: Request, res: Response): Promise<void> {
    try {
      const { status, origin, destination, date_from, date_to, page, limit } =
        req.query;

      // Search loads with filters
      const result = await this.loadService.searchLoads({
        status: status as string,
        origin: origin as string,
        destination: destination as string,
        dateFrom: date_from as string,
        dateTo: date_to as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error("Error in searchLoads:", error);
      res.status(500).json({ error: "Failed to search loads" });
    }
  }
}
