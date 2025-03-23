import { HereMapService } from "./here-map.service";
import { MapboxService } from "./mapbox.service";
import { FreightPathService } from "./freight-path.service";
import { SupabaseService } from "./supabase.service";
import { RouteOptimizationService } from "./route-optimization.service";
import { logger } from "../utils/logger";

interface LoadSearchParams {
  status?: string;
  origin?: string;
  destination?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export class LoadService {
  private hereMapService: HereMapService;
  private mapboxService: MapboxService;
  private freightPathService: FreightPathService;
  private supabaseService: SupabaseService;
  private routeOptimizationService: RouteOptimizationService;

  constructor() {
    this.hereMapService = new HereMapService();
    this.mapboxService = new MapboxService();
    this.freightPathService = new FreightPathService();
    this.supabaseService = new SupabaseService();
    this.routeOptimizationService = new RouteOptimizationService();
  }

  /**
   * Find nearby loads for a driver
   */
  async findNearbyLoads(
    driverId: string,
    lat: number,
    lng: number,
    maxDistance: number,
  ): Promise<any[]> {
    try {
      // Get driver details to check equipment type, etc.
      const driver = await this.supabaseService.getDriverById(driverId);
      if (!driver) {
        throw new Error("Driver not found");
      }

      // Get carrier details for the driver
      const carrier = await this.supabaseService.getCarrierById(
        driver.carrierId,
      );
      if (!carrier) {
        throw new Error("Carrier not found");
      }

      // Query loads that match driver's equipment type and are within range
      const loads = await this.supabaseService.findNearbyLoads(
        lat,
        lng,
        maxDistance,
        {
          equipmentType: driver.equipmentType,
          carrierId: carrier.id,
        },
      );

      // Calculate exact distances and ETAs using routing service
      const loadsWithDistances = await Promise.all(
        loads.map(async (load) => {
          const route = await this.mapboxService.getRoute(
            [lng, lat], // Current location
            [
              load.pickup_location.coordinates.longitude,
              load.pickup_location.coordinates.latitude,
            ], // Pickup location
          );

          return {
            ...load,
            distance: route.distance / 1609.34, // Convert meters to miles
            duration: route.duration / 60, // Convert seconds to minutes
            route: route.geometry,
          };
        }),
      );

      // Sort by distance
      return loadsWithDistances.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      logger.error("Error finding nearby loads:", error);
      throw error;
    }
  }

  /**
   * Update load statuses to pending
   */
  async updateLoadStatusesToPending(loadIds: string[]): Promise<void> {
    try {
      await this.supabaseService.updateLoadStatuses(loadIds, "pending");
    } catch (error) {
      logger.error("Error updating load statuses to pending:", error);
      throw error;
    }
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 3958.8; // Earth radius in miles
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in miles
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Convert degrees to radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Get load by ID
   */
  async getLoadById(loadId: string): Promise<any> {
    try {
      return await this.supabaseService.getLoadById(loadId);
    } catch (error) {
      logger.error("Error getting load by ID:", error);
      throw error;
    }
  }

  /**
   * Assign load to driver
   */
  async assignLoadToDriver(loadId: string, driverId: string): Promise<any> {
    try {
      // Get driver details
      const driver = await this.supabaseService.getDriverById(driverId);
      if (!driver) {
        throw new Error("Driver not found");
      }

      // Get load details
      const load = await this.supabaseService.getLoadById(loadId);
      if (!load) {
        throw new Error("Load not found");
      }

      // Check if load is available
      if (load.status !== "pending" && load.status !== "posted") {
        throw new Error(`Load is already ${load.status}`);
      }

      // Update load with driver and carrier info
      const updatedLoad = await this.supabaseService.assignLoadToDriver(
        loadId,
        {
          driverId,
          carrierId: driver.carrierId,
          vehicleId: driver.vehicleId,
          status: "assigned",
          assignedDate: new Date().toISOString(),
        },
      );

      // Generate optimized route and update ETA using the route optimization service
      try {
        await this.routeOptimizationService.generateDriverToLoadRoute(
          driverId,
          loadId,
          {
            considerTraffic: true,
            includeAlternatives: true,
          },
        );
        logger.info(
          `Generated optimized route for driver ${driverId} and load ${loadId}`,
        );
      } catch (routeError) {
        // Fall back to simple ETA calculation if route optimization fails
        logger.warn(
          `Route optimization failed, falling back to simple ETA calculation: ${routeError}`,
        );
        await this.updateLoadETA(
          loadId,
          driver.currentLocation.latitude,
          driver.currentLocation.longitude,
        );
      }

      return updatedLoad;
    } catch (error) {
      logger.error("Error assigning load to driver:", error);
      throw error;
    }
  }

  /**
   * Update load status
   */
  async updateLoadStatus(
    loadId: string,
    status: string,
    location?: { latitude: number; longitude: number },
    notes?: string,
  ): Promise<any> {
    try {
      // Get load details
      const load = await this.supabaseService.getLoadById(loadId);
      if (!load) {
        throw new Error("Load not found");
      }

      // Prepare update data
      const updateData: any = { status };

      // Add status-specific fields
      if (status === "in_transit") {
        updateData.actualPickupTime = new Date().toISOString();
      } else if (status === "delivered") {
        updateData.actualDeliveryTime = new Date().toISOString();
      }

      // Add location update if provided
      if (location) {
        updateData.lastLocationUpdate = {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString(),
        };
      }

      // Update load status
      const updatedLoad = await this.supabaseService.updateLoad(
        loadId,
        updateData,
      );

      // Create event record
      await this.supabaseService.createLoadEvent({
        loadId,
        userId: load.driverId,
        eventType: "status_change",
        previousValue: load.status,
        newValue: status,
        timestamp: new Date().toISOString(),
        notes: notes || `Load status changed from ${load.status} to ${status}`,
      });

      return updatedLoad;
    } catch (error) {
      logger.error("Error updating load status:", error);
      throw error;
    }
  }

  /**
   * Update driver location
   */
  async updateDriverLocation(
    driverId: string,
    latitude: number,
    longitude: number,
    heading?: number,
    speed?: number,
  ): Promise<any> {
    try {
      const timestamp = new Date().toISOString();

      // Update driver location
      const updatedDriver = await this.supabaseService.updateDriverLocation(
        driverId,
        {
          latitude,
          longitude,
          heading,
          speed,
          timestamp,
        },
      );

      // Check if driver has an active load and update route if needed
      const activeLoad = await this.getActiveLoadForDriver(driverId);
      if (activeLoad) {
        // Only update route if significant movement (e.g., every 500 meters or 5 minutes)
        // This logic would typically be more sophisticated in a production system
        const shouldUpdateRoute = this.shouldUpdateRoute(
          activeLoad,
          latitude,
          longitude,
        );

        if (shouldUpdateRoute) {
          try {
            // Update route asynchronously (don't await to avoid blocking)
            this.routeOptimizationService
              .generateDriverToLoadRoute(driverId, activeLoad.id, {
                considerTraffic: true,
                departureTime: new Date(),
              })
              .catch((error) => {
                logger.error(
                  `Error updating route for driver ${driverId}:`,
                  error,
                );
              });
          } catch (routeError) {
            logger.warn(`Failed to trigger route update: ${routeError}`);
          }
        }
      }

      return updatedDriver;
    } catch (error) {
      logger.error("Error updating driver location:", error);
      throw error;
    }
  }

  /**
   * Determine if route should be updated based on driver movement
   * This is a simple implementation - production systems would use more sophisticated logic
   */
  private shouldUpdateRoute(
    load: any,
    newLat: number,
    newLng: number,
  ): boolean {
    // If no last location update, always update
    if (!load.lastLocationUpdate) return true;

    // Calculate distance moved
    const distance = this.calculateDistance(
      load.lastLocationUpdate.latitude,
      load.lastLocationUpdate.longitude,
      newLat,
      newLng,
    );

    // Calculate time since last update
    const lastUpdateTime = new Date(
      load.lastLocationUpdate.timestamp,
    ).getTime();
    const currentTime = new Date().getTime();
    const timeDiff = (currentTime - lastUpdateTime) / (1000 * 60); // in minutes

    // Update if moved more than 0.5 miles or more than 5 minutes passed
    return distance > 0.5 || timeDiff > 5;
  }

  /**
   * Get active load for driver
   */
  async getActiveLoadForDriver(driverId: string): Promise<any> {
    try {
      return await this.supabaseService.getActiveLoadForDriver(driverId);
    } catch (error) {
      logger.error("Error getting active load for driver:", error);
      throw error;
    }
  }

  /**
   * Update load ETA based on current location
   */
  async updateLoadETA(
    loadId: string,
    latitude: number,
    longitude: number,
  ): Promise<any> {
    try {
      // Get load details
      const load = await this.supabaseService.getLoadById(loadId);
      if (!load) {
        throw new Error("Load not found");
      }

      let destination;
      let eta;

      // Determine destination based on load status
      if (load.status === "assigned" || load.status === "pending") {
        // If not yet picked up, destination is pickup location
        destination = [
          load.pickup_location.coordinates.longitude,
          load.pickup_location.coordinates.latitude,
        ];
      } else {
        // If already picked up, destination is delivery location
        destination = [
          load.delivery_location.coordinates.longitude,
          load.delivery_location.coordinates.latitude,
        ];
      }

      // Get route and ETA from Mapbox
      const route = await this.mapboxService.getRoute(
        [longitude, latitude],
        destination,
      );

      // Calculate ETA
      const now = new Date();
      eta = new Date(now.getTime() + route.duration * 1000).toISOString();

      // Update load with ETA
      await this.supabaseService.updateLoad(loadId, {
        estimatedTimeOfArrival: eta,
        estimatedDistance: route.distance / 1609.34, // Convert meters to miles
        estimatedDuration: route.duration / 60, // Convert seconds to minutes
      });

      return eta;
    } catch (error) {
      logger.error("Error updating load ETA:", error);
      throw error;
    }
  }

  /**
   * Get load with all details
   */
  async getLoadWithDetails(loadId: string): Promise<any> {
    try {
      // Get load with related data
      const load = await this.supabaseService.getLoadWithDetails(loadId);
      if (!load) {
        throw new Error("Load not found");
      }

      // Get events for the load
      const events = await this.supabaseService.getLoadEvents(loadId);

      // Get documents for the load
      const documents = await this.supabaseService.getLoadDocuments(loadId);

      return {
        ...load,
        events,
        documents,
      };
    } catch (error) {
      logger.error("Error getting load with details:", error);
      throw error;
    }
  }

  /**
   * Search loads with filters
   */
  async searchLoads(params: LoadSearchParams): Promise<any> {
    try {
      const {
        status,
        origin,
        destination,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20,
      } = params;

      // Search loads with filters
      const result = await this.supabaseService.searchLoads({
        status,
        origin,
        destination,
        dateFrom,
        dateTo,
        page,
        limit,
      });

      return result;
    } catch (error) {
      logger.error("Error searching loads:", error);
      throw error;
    }
  }
}
