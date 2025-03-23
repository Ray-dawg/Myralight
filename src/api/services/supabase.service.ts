import { createClient, SupabaseClient } from "@supabase/supabase-js";
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

export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseKey) {
      logger.error("Supabase URL or key not found in environment variables");
      throw new Error("Supabase configuration missing");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get driver by ID
   */
  async getDriverById(driverId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from("users")
        .select("*")
        .eq("id", driverId)
        .eq("role", "driver")
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error getting driver by ID:", error);
      throw error;
    }
  }

  /**
   * Get carrier by ID
   */
  async getCarrierById(carrierId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from("carriers")
        .select("*")
        .eq("id", carrierId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error getting carrier by ID:", error);
      throw error;
    }
  }

  /**
   * Find nearby loads
   */
  async findNearbyLoads(
    lat: number,
    lng: number,
    maxDistance: number,
    filters?: any,
  ): Promise<any[]> {
    try {
      // This is a simplified version - in a real implementation, you would use PostGIS functions
      // like ST_DWithin to find loads within a certain distance
      // For now, we'll fetch all loads and filter them in memory

      let query = this.supabase
        .from("loads")
        .select(
          `
          *,
          pickup_location:pickupLocationId(*),
          delivery_location:deliveryLocationId(*)
        `,
        )
        .eq("status", "posted");

      if (filters?.equipmentType) {
        query = query.eq("equipmentType", filters.equipmentType);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter loads by distance (this would normally be done in the database)
      return data.filter((load) => {
        const pickupLat = load.pickup_location.coordinates.latitude;
        const pickupLng = load.pickup_location.coordinates.longitude;

        // Calculate distance using Haversine formula
        const distance = this.calculateDistance(lat, lng, pickupLat, pickupLng);

        // Add distance to the load object
        load.distance = distance;

        // Return loads within the max distance
        return distance <= maxDistance;
      });
    } catch (error) {
      logger.error("Error finding nearby loads:", error);
      throw error;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
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
   * Update load statuses
   */
  async updateLoadStatuses(loadIds: string[], status: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("loads")
        .update({ status, updatedAt: new Date().toISOString() })
        .in("id", loadIds);

      if (error) throw error;
    } catch (error) {
      logger.error("Error updating load statuses:", error);
      throw error;
    }
  }

  /**
   * Get load by ID
   */
  async getLoadById(loadId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from("loads")
        .select(
          `
          *,
          pickup_location:pickupLocationId(*),
          delivery_location:deliveryLocationId(*)
        `,
        )
        .eq("id", loadId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error getting load by ID:", error);
      throw error;
    }
  }

  /**
   * Assign load to driver
   */
  async assignLoadToDriver(loadId: string, data: any): Promise<any> {
    try {
      const { data: updatedLoad, error } = await this.supabase
        .from("loads")
        .update({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", loadId)
        .select(
          `
          *,
          pickup_location:pickupLocationId(*),
          delivery_location:deliveryLocationId(*)
        `,
        )
        .single();

      if (error) throw error;

      // Create an event for the assignment
      await this.createLoadEvent({
        loadId,
        userId: data.driverId,
        eventType: "load_assigned",
        previousValue: null,
        newValue: { driverId: data.driverId, carrierId: data.carrierId },
        timestamp: new Date().toISOString(),
        notes: `Load assigned to driver ${data.driverId}`,
      });

      return updatedLoad;
    } catch (error) {
      logger.error("Error assigning load to driver:", error);
      throw error;
    }
  }

  /**
   * Update load
   */
  async updateLoad(loadId: string, data: any): Promise<any> {
    try {
      const { data: updatedLoad, error } = await this.supabase
        .from("loads")
        .update({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", loadId)
        .select(
          `
          *,
          pickup_location:pickupLocationId(*),
          delivery_location:deliveryLocationId(*)
        `,
        )
        .single();

      if (error) throw error;
      return updatedLoad;
    } catch (error) {
      logger.error("Error updating load:", error);
      throw error;
    }
  }

  /**
   * Create load event
   */
  async createLoadEvent(data: any): Promise<any> {
    try {
      const { data: event, error } = await this.supabase
        .from("events")
        .insert({
          ...data,
          createdAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return event;
    } catch (error) {
      logger.error("Error creating load event:", error);
      throw error;
    }
  }

  /**
   * Update driver location
   */
  async updateDriverLocation(
    driverId: string,
    locationData: any,
  ): Promise<any> {
    try {
      // First, update the user record with the current location
      const { data: updatedDriver, error } = await this.supabase
        .from("users")
        .update({
          currentLocation: {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            heading: locationData.heading,
            speed: locationData.speed,
            lastUpdated: locationData.timestamp,
          },
          updatedAt: new Date().toISOString(),
        })
        .eq("id", driverId)
        .select()
        .single();

      if (error) throw error;

      // Then, if there's a vehicle assigned to the driver, update its location too
      if (updatedDriver.vehicleId) {
        await this.supabase
          .from("vehicles")
          .update({
            currentLocation: {
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              lastUpdated: locationData.timestamp,
            },
            updatedAt: new Date().toISOString(),
          })
          .eq("id", updatedDriver.vehicleId);
      }

      return updatedDriver;
    } catch (error) {
      logger.error("Error updating driver location:", error);
      throw error;
    }
  }

  /**
   * Get active load for driver
   */
  async getActiveLoadForDriver(driverId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from("loads")
        .select(
          `
          *,
          pickup_location:pickupLocationId(*),
          delivery_location:deliveryLocationId(*)
        `,
        )
        .eq("driverId", driverId)
        .in("status", ["assigned", "in_transit"])
        .order("updatedAt", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is the error code for no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      logger.error("Error getting active load for driver:", error);
      throw error;
    }
  }

  /**
   * Get load with details
   */
  async getLoadWithDetails(loadId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from("loads")
        .select(
          `
          *,
          pickup_location:pickupLocationId(*),
          delivery_location:deliveryLocationId(*),
          carrier:carrierId(*),
          driver:driverId(*),
          vehicle:vehicleId(*),
          shipper:shipperId(*)
        `,
        )
        .eq("id", loadId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error getting load with details:", error);
      throw error;
    }
  }

  /**
   * Get load events
   */
  async getLoadEvents(loadId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from("events")
        .select("*")
        .eq("loadId", loadId)
        .order("timestamp", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error getting load events:", error);
      throw error;
    }
  }

  /**
   * Get load documents
   */
  async getLoadDocuments(loadId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from("documents")
        .select("*")
        .eq("loadId", loadId)
        .order("uploadDate", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error getting load documents:", error);
      throw error;
    }
  }

  /**
   * Create location history entry
   */
  async createLocationHistory(data: any): Promise<any> {
    try {
      const { data: locationHistory, error } = await this.supabase
        .from("location_history")
        .insert({
          ...data,
          createdAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return locationHistory;
    } catch (error) {
      logger.error("Error creating location history:", error);
      throw error;
    }
  }

  /**
   * Get location history for a load
   */
  async getLocationHistory(
    loadId: string,
    limit: number = 100,
  ): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from("location_history")
        .select("*")
        .eq("loadId", loadId)
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error getting location history:", error);
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

      // Start building the query
      let query = this.supabase.from("loads").select(
        `
          *,
          pickup_location:pickupLocationId(*),
          delivery_location:deliveryLocationId(*),
          carrier:carrierId(*),
          driver:driverId(*)
        `,
        { count: "exact" },
      );

      // Apply filters
      if (status) {
        query = query.eq("status", status);
      }

      if (dateFrom) {
        query = query.gte("pickupWindowStart", dateFrom);
      }

      if (dateTo) {
        query = query.lte("pickupWindowStart", dateTo);
      }

      // Apply origin filter (this is simplified - in a real app, you'd use PostGIS)
      if (origin) {
        // This is a simplification - in a real app, you'd join with locations table
        // and use text search or PostGIS functions
        query = query.textSearch("pickup_location.city", origin, {
          type: "websearch",
          config: "english",
        });
      }

      // Apply destination filter (this is simplified - in a real app, you'd use PostGIS)
      if (destination) {
        // This is a simplification - in a real app, you'd join with locations table
        // and use text search or PostGIS functions
        query = query.textSearch("delivery_location.city", destination, {
          type: "websearch",
          config: "english",
        });
      }

      // Calculate pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Apply pagination and order
      query = query.order("updatedAt", { ascending: false }).range(from, to);

      // Execute query
      const { data, error, count } = await query;

      if (error) throw error;

      return {
        loads: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("Error searching loads:", error);
      throw error;
    }
  }
}
