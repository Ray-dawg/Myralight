import { logger } from "../utils/logger";

interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  address?: string;
  createdBy: string;
  createdAt: string;
}

interface GeofenceEvent {
  geofenceId: string;
  vehicleId: string;
  driverId: string;
  eventType: "entry" | "exit";
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export class GeofenceService {
  private static instance: GeofenceService;
  private geofences: Map<string, Geofence> = new Map();
  private geofenceEvents: GeofenceEvent[] = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): GeofenceService {
    if (!GeofenceService.instance) {
      GeofenceService.instance = new GeofenceService();
    }
    return GeofenceService.instance;
  }

  /**
   * Create a new geofence
   */
  public createGeofence(
    geofence: Omit<Geofence, "id" | "createdAt">,
  ): Geofence {
    const id = `geofence_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newGeofence: Geofence = {
      ...geofence,
      id,
      createdAt: new Date().toISOString(),
    };

    this.geofences.set(id, newGeofence);
    logger.info(`Created geofence: ${id}`);
    return newGeofence;
  }

  /**
   * Get a geofence by ID
   */
  public getGeofence(id: string): Geofence | undefined {
    return this.geofences.get(id);
  }

  /**
   * Get all geofences
   */
  public getAllGeofences(): Geofence[] {
    return Array.from(this.geofences.values());
  }

  /**
   * Update a geofence
   */
  public updateGeofence(
    id: string,
    updates: Partial<Omit<Geofence, "id" | "createdAt" | "createdBy">>,
  ): Geofence | null {
    const geofence = this.geofences.get(id);
    if (!geofence) {
      logger.error(`Geofence not found: ${id}`);
      return null;
    }

    const updatedGeofence = { ...geofence, ...updates };
    this.geofences.set(id, updatedGeofence);
    logger.info(`Updated geofence: ${id}`);
    return updatedGeofence;
  }

  /**
   * Delete a geofence
   */
  public deleteGeofence(id: string): boolean {
    const deleted = this.geofences.delete(id);
    if (deleted) {
      logger.info(`Deleted geofence: ${id}`);
    } else {
      logger.error(`Geofence not found for deletion: ${id}`);
    }
    return deleted;
  }

  /**
   * Check if a location is within any geofence
   */
  public checkGeofenceEvents(
    vehicleId: string,
    driverId: string,
    latitude: number,
    longitude: number,
  ): GeofenceEvent[] {
    const events: GeofenceEvent[] = [];
    const timestamp = new Date().toISOString();
    const location = { latitude, longitude };

    this.geofences.forEach((geofence) => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        geofence.latitude,
        geofence.longitude,
      );

      const isInside = distance <= geofence.radius;
      const wasInside = this.wasInsideGeofence(vehicleId, geofence.id);

      // Vehicle entered geofence
      if (isInside && !wasInside) {
        const event: GeofenceEvent = {
          geofenceId: geofence.id,
          vehicleId,
          driverId,
          eventType: "entry",
          timestamp,
          location,
        };
        events.push(event);
        this.geofenceEvents.push(event);
        logger.info(`Vehicle ${vehicleId} entered geofence ${geofence.id}`);
      }
      // Vehicle exited geofence
      else if (!isInside && wasInside) {
        const event: GeofenceEvent = {
          geofenceId: geofence.id,
          vehicleId,
          driverId,
          eventType: "exit",
          timestamp,
          location,
        };
        events.push(event);
        this.geofenceEvents.push(event);
        logger.info(`Vehicle ${vehicleId} exited geofence ${geofence.id}`);
      }
    });

    return events;
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
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if a vehicle was inside a geofence based on previous events
   */
  private wasInsideGeofence(vehicleId: string, geofenceId: string): boolean {
    // Get the most recent event for this vehicle and geofence
    const events = this.geofenceEvents
      .filter((e) => e.vehicleId === vehicleId && e.geofenceId === geofenceId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

    if (events.length === 0) return false;

    // If the most recent event was an entry, the vehicle was inside
    return events[0].eventType === "entry";
  }

  /**
   * Get geofence events for a vehicle
   */
  public getGeofenceEventsForVehicle(vehicleId: string): GeofenceEvent[] {
    return this.geofenceEvents
      .filter((e) => e.vehicleId === vehicleId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }

  /**
   * Get geofence events for a geofence
   */
  public getGeofenceEventsForGeofence(geofenceId: string): GeofenceEvent[] {
    return this.geofenceEvents
      .filter((e) => e.geofenceId === geofenceId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }
}
