import axios, { AxiosInstance } from "axios";
import { logger } from "../utils/logger";

export class HereFleetService {
  private static instance: HereFleetService;
  private apiKey: string;
  private client: AxiosInstance;
  private rateLimiter: Map<string, number> = new Map();
  private readonly MAX_REQUESTS_PER_SECOND = 5;

  private constructor() {
    this.apiKey = "if2Sk-YiV1NTQrtDh5_4VK6WkDiUm7yY_Sup4bXkJn4";
    if (!this.apiKey) {
      logger.error("HERE API key not found");
      throw new Error("HERE API key is required");
    }

    this.client = axios.create({
      baseURL: "https://fleet.ls.hereapi.com/2",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add rate limiting interceptor
    this.client.interceptors.request.use(async (config) => {
      await this.checkRateLimit();
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          logger.warn("HERE API rate limit exceeded");
          // Wait and retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return this.client.request(error.config);
        }
        throw error;
      },
    );
  }

  public static getInstance(): HereFleetService {
    if (!HereFleetService.instance) {
      HereFleetService.instance = new HereFleetService();
    }
    return HereFleetService.instance;
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const recentRequests = Array.from(this.rateLimiter.values()).filter(
      (timestamp) => now - timestamp < 1000,
    ).length;

    if (recentRequests >= this.MAX_REQUESTS_PER_SECOND) {
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          1000 - (now - Math.min(...Array.from(this.rateLimiter.values()))),
        ),
      );
    }

    const requestId = Math.random().toString();
    this.rateLimiter.set(requestId, now);

    // Cleanup old entries
    for (const [id, timestamp] of this.rateLimiter.entries()) {
      if (now - timestamp > 1000) {
        this.rateLimiter.delete(id);
      }
    }
  }

  async createGeofence(params: {
    name: string;
    lat: number;
    lng: number;
    radius: number;
    metadata?: Record<string, any>;
  }): Promise<{ id: string }> {
    try {
      const response = await this.client.post("/geofences.json", null, {
        params: {
          apiKey: this.apiKey,
          ...params,
          center: `${params.lat},${params.lng}`,
        },
      });

      return { id: response.data.id };
    } catch (error) {
      logger.error("Error creating geofence:", error);
      throw new Error("Failed to create geofence");
    }
  }

  async updateDriverLocation(params: {
    driverId: string;
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
  }): Promise<void> {
    try {
      await this.client.put(`/drivers/${params.driverId}/location.json`, null, {
        params: {
          apiKey: this.apiKey,
          location: `${params.lat},${params.lng}`,
          heading: params.heading,
          speed: params.speed,
        },
      });
    } catch (error) {
      logger.error("Error updating driver location:", error);
      throw new Error("Failed to update driver location");
    }
  }

  async getGeofenceEvents(params: {
    driverId?: string;
    geofenceId?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<any[]> {
    try {
      const response = await this.client.get("/geofence-events.json", {
        params: {
          apiKey: this.apiKey,
          ...params,
        },
      });

      return response.data.events || [];
    } catch (error) {
      logger.error("Error getting geofence events:", error);
      throw new Error("Failed to get geofence events");
    }
  }

  async getDriverLocations(driverIds: string[]): Promise<any[]> {
    try {
      const response = await this.client.get("/drivers/locations.json", {
        params: {
          apiKey: this.apiKey,
          driverIds: driverIds.join(","),
        },
      });

      return response.data.locations || [];
    } catch (error) {
      logger.error("Error getting driver locations:", error);
      throw new Error("Failed to get driver locations");
    }
  }

  async deleteGeofence(geofenceId: string): Promise<void> {
    try {
      await this.client.delete(`/geofences/${geofenceId}.json`, {
        params: {
          apiKey: this.apiKey,
        },
      });
    } catch (error) {
      logger.error("Error deleting geofence:", error);
      throw new Error("Failed to delete geofence");
    }
  }
}
