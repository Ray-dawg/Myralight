import { Request, Response } from "express";
import { TrackingService } from "../services/tracking.service";
import { LoadService } from "../services/load.service";
import { WebSocketService } from "../services/websocket.service";
import { logger } from "../utils/logger";

export class TrackingController {
  private trackingService: TrackingService;
  private loadService: LoadService;
  private wsService: WebSocketService;

  constructor() {
    this.trackingService = TrackingService.getInstance();
    this.loadService = new LoadService();
    this.wsService = WebSocketService.getInstance();
  }

  /**
   * Start tracking a driver for a specific load
   */
  async startTracking(req: Request, res: Response): Promise<void> {
    try {
      const { driver_id, load_id, update_interval } = req.body;

      if (!driver_id || !load_id) {
        res.status(400).json({ error: "Driver ID and Load ID are required" });
        return;
      }

      // Start tracking
      const success = await this.trackingService.initializeDriverTracking(
        driver_id,
        load_id,
        update_interval || 30000, // Default 30 seconds if not specified
      );

      // Notify relevant parties
      const load = await this.loadService.getLoadById(load_id);
      if (load) {
        this.wsService.emitNotification(load.shipperId, {
          type: "tracking_started",
          message: `Real-time tracking started for load ${load_id}`,
          loadId: load_id,
          timestamp: new Date().toISOString(),
        });

        if (load.carrierId) {
          this.wsService.emitNotification(load.carrierId, {
            type: "tracking_started",
            message: `Real-time tracking started for driver on load ${load_id}`,
            loadId: load_id,
            timestamp: new Date().toISOString(),
          });
        }
      }

      res.status(200).json({
        success,
        message: "Driver tracking initialized successfully",
      });
    } catch (error) {
      logger.error("Error in startTracking:", error);
      res.status(500).json({ error: "Failed to start driver tracking" });
    }
  }

  /**
   * Stop tracking a driver
   */
  async stopTracking(req: Request, res: Response): Promise<void> {
    try {
      const { driver_id } = req.params;

      if (!driver_id) {
        res.status(400).json({ error: "Driver ID is required" });
        return;
      }

      // Get tracking session before stopping
      const session = this.trackingService.getDriverTrackingSession(driver_id);

      // Stop tracking
      const success = await this.trackingService.stopDriverTracking(driver_id);

      // Notify relevant parties if session existed
      if (session && session.loadId) {
        const load = await this.loadService.getLoadById(session.loadId);
        if (load) {
          this.wsService.emitNotification(load.shipperId, {
            type: "tracking_stopped",
            message: `Real-time tracking stopped for load ${session.loadId}`,
            loadId: session.loadId,
            timestamp: new Date().toISOString(),
          });

          if (load.carrierId) {
            this.wsService.emitNotification(load.carrierId, {
              type: "tracking_stopped",
              message: `Real-time tracking stopped for driver on load ${session.loadId}`,
              loadId: session.loadId,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }

      res.status(200).json({
        success,
        message: success
          ? "Driver tracking stopped successfully"
          : "No active tracking session found",
      });
    } catch (error) {
      logger.error("Error in stopTracking:", error);
      res.status(500).json({ error: "Failed to stop driver tracking" });
    }
  }

  /**
   * Get active tracking sessions
   */
  async getActiveSessions(req: Request, res: Response): Promise<void> {
    try {
      const sessions = this.trackingService.getActiveTrackingSessions();

      res.status(200).json({
        success: true,
        sessions: sessions.map((session) => ({
          driver_id: session.driverId,
          load_id: session.loadId,
          active: session.active,
          last_update: session.lastUpdate,
          update_interval: session.updateInterval,
        })),
      });
    } catch (error) {
      logger.error("Error in getActiveSessions:", error);
      res.status(500).json({ error: "Failed to get active tracking sessions" });
    }
  }

  /**
   * Get tracking session for a driver
   */
  async getDriverSession(req: Request, res: Response): Promise<void> {
    try {
      const { driver_id } = req.params;

      if (!driver_id) {
        res.status(400).json({ error: "Driver ID is required" });
        return;
      }

      const session = this.trackingService.getDriverTrackingSession(driver_id);

      if (!session) {
        res.status(404).json({
          success: false,
          message: "No active tracking session found for driver",
        });
        return;
      }

      res.status(200).json({
        success: true,
        session: {
          driver_id: session.driverId,
          load_id: session.loadId,
          active: session.active,
          last_update: session.lastUpdate,
          update_interval: session.updateInterval,
        },
      });
    } catch (error) {
      logger.error("Error in getDriverSession:", error);
      res.status(500).json({ error: "Failed to get driver tracking session" });
    }
  }

  /**
   * Get tracking session for a load
   */
  async getLoadSession(req: Request, res: Response): Promise<void> {
    try {
      const { load_id } = req.params;

      if (!load_id) {
        res.status(400).json({ error: "Load ID is required" });
        return;
      }

      const session = this.trackingService.getLoadTrackingSession(load_id);

      if (!session) {
        res.status(404).json({
          success: false,
          message: "No active tracking session found for load",
        });
        return;
      }

      res.status(200).json({
        success: true,
        session: {
          driver_id: session.driverId,
          load_id: session.loadId,
          active: session.active,
          last_update: session.lastUpdate,
          update_interval: session.updateInterval,
        },
      });
    } catch (error) {
      logger.error("Error in getLoadSession:", error);
      res.status(500).json({ error: "Failed to get load tracking session" });
    }
  }

  /**
   * Update tracking interval for a driver
   */
  async updateTrackingInterval(req: Request, res: Response): Promise<void> {
    try {
      const { driver_id } = req.params;
      const { update_interval } = req.body;

      if (!driver_id) {
        res.status(400).json({ error: "Driver ID is required" });
        return;
      }

      if (!update_interval || update_interval < 5000) {
        res.status(400).json({
          error: "Update interval is required and must be at least 5000ms",
        });
        return;
      }

      const success = this.trackingService.updateTrackingInterval(
        driver_id,
        update_interval,
      );

      if (!success) {
        res.status(404).json({
          success: false,
          message: "No active tracking session found for driver",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Tracking interval updated to ${update_interval}ms`,
      });
    } catch (error) {
      logger.error("Error in updateTrackingInterval:", error);
      res.status(500).json({ error: "Failed to update tracking interval" });
    }
  }

  /**
   * Manual location update for a driver
   */
  async manualLocationUpdate(req: Request, res: Response): Promise<void> {
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

        // Check if driver is in a tracking session
        const session =
          this.trackingService.getDriverTrackingSession(driver_id);
        if (session && session.active) {
          // Update session with last location
          session.lastUpdate = {
            latitude,
            longitude,
            heading,
            speed,
            timestamp: new Date().toISOString(),
          };
        }
      }

      res.status(200).json({
        success: true,
        driver: updatedDriver,
      });
    } catch (error) {
      logger.error("Error in manualLocationUpdate:", error);
      res.status(500).json({ error: "Failed to update driver location" });
    }
  }
}
