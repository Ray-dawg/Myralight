import axios from "axios";
import { logger } from "../utils/logger";

export class HereMapService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.HERE_API_KEY || "";
    this.baseUrl = "https://fleet.ls.hereapi.com/2";

    if (!this.apiKey) {
      logger.warn("HERE API key not found in environment variables");
    }
  }

  /**
   * Get route between two points
   */
  async getRoute(
    origin: [number, number],
    destination: [number, number],
  ): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/calculateroute.json`, {
        params: {
          apiKey: this.apiKey,
          waypoint0: `${origin[0]},${origin[1]}`,
          waypoint1: `${destination[0]},${destination[1]}`,
          mode: "fastest;truck;traffic:enabled",
          representation: "display",
          routeAttributes: "summary,shape",
          truckType: "truck",
          limitedWeight: "40t", // 40 tons default weight limit
          height: "4.0m", // 4 meters default height
          trailerCount: "1",
        },
      });

      const route = response.data.response.route[0];
      return {
        distance: route.summary.distance, // in meters
        duration: route.summary.trafficTime, // in seconds
        geometry: route.shape.map((point: string) => {
          const [lat, lng] = point.split(",");
          return [parseFloat(lng), parseFloat(lat)];
        }),
      };
    } catch (error) {
      logger.error("Error getting route from HERE Maps:", error);
      throw new Error("Failed to calculate route");
    }
  }

  /**
   * Get traffic incidents along a route
   */
  async getTrafficIncidents(
    corridor: [number, number][],
    radius: number,
  ): Promise<any> {
    try {
      // Convert corridor to HERE Maps format
      const corridorString = corridor
        .map((point) => `${point[0]},${point[1]}`)
        .join(";");

      const response = await axios.get(
        `${this.baseUrl}/traffic/incidents.json`,
        {
          params: {
            apiKey: this.apiKey,
            corridor: corridorString,
            radius,
          },
        },
      );

      return response.data.incidents || [];
    } catch (error) {
      logger.error("Error getting traffic incidents from HERE Maps:", error);
      throw new Error("Failed to get traffic incidents");
    }
  }

  /**
   * Geocode an address
   */
  async geocodeAddress(address: string): Promise<[number, number]> {
    try {
      const response = await axios.get(
        "https://geocode.search.hereapi.com/v1/geocode",
        {
          params: {
            apiKey: this.apiKey,
            q: address,
          },
        },
      );

      if (response.data.items && response.data.items.length > 0) {
        const location = response.data.items[0].position;
        return [location.lat, location.lng];
      }

      throw new Error("No results found for the address");
    } catch (error) {
      logger.error("Error geocoding address with HERE Maps:", error);
      throw new Error("Failed to geocode address");
    }
  }

  /**
   * Reverse geocode coordinates
   */
  async reverseGeocode(lat: number, lng: number): Promise<any> {
    try {
      const response = await axios.get(
        "https://revgeocode.search.hereapi.com/v1/revgeocode",
        {
          params: {
            apiKey: this.apiKey,
            at: `${lat},${lng}`,
          },
        },
      );

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].address;
      }

      throw new Error("No results found for the coordinates");
    } catch (error) {
      logger.error("Error reverse geocoding with HERE Maps:", error);
      throw new Error("Failed to reverse geocode coordinates");
    }
  }

  /**
   * Get isoline (reachable area) from a point
   */
  async getIsoline(
    center: [number, number],
    rangeType: "distance" | "time",
    rangeValue: number,
  ): Promise<any> {
    try {
      const response = await axios.get(
        "https://isoline.route.ls.hereapi.com/routing/7.2/calculateisoline.json",
        {
          params: {
            apiKey: this.apiKey,
            mode: "fastest;truck;traffic:enabled",
            start: `${center[0]},${center[1]}`,
            range: rangeValue,
            rangetype: rangeType,
            truckType: "truck",
            limitedWeight: "40t",
            height: "4.0m",
            trailerCount: "1",
          },
        },
      );

      return response.data.response.isoline[0].component[0].shape.map(
        (point: string) => {
          const [lat, lng] = point.split(",");
          return [parseFloat(lng), parseFloat(lat)];
        },
      );
    } catch (error) {
      logger.error("Error getting isoline from HERE Maps:", error);
      throw new Error("Failed to calculate isoline");
    }
  }

  /**
   * Get weather at location
   */
  async getWeather(lat: number, lng: number): Promise<any> {
    try {
      const response = await axios.get(
        "https://weather.ls.hereapi.com/weather/1.0/report.json",
        {
          params: {
            apiKey: this.apiKey,
            product: "observation",
            latitude: lat,
            longitude: lng,
          },
        },
      );

      return response.data.observations.location[0].observation[0];
    } catch (error) {
      logger.error("Error getting weather from HERE Maps:", error);
      throw new Error("Failed to get weather information");
    }
  }

  /**
   * Create a geofence
   */
  async createGeofence(params: {
    name: string;
    lat: number;
    lng: number;
    radius: number;
    type?: string;
  }): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/geofences.json`,
        null,
        {
          params: {
            apiKey: this.apiKey,
            name: params.name,
            center: `${params.lat},${params.lng}`,
            radius: params.radius,
            type: params.type || "circle",
          },
        },
      );

      return {
        id: response.data.id,
        name: params.name,
        center: [params.lat, params.lng],
        radius: params.radius,
      };
    } catch (error) {
      logger.error("Error creating geofence with HERE Maps:", error);
      throw new Error("Failed to create geofence");
    }
  }

  /**
   * Delete a geofence
   */
  async deleteGeofence(geofenceId: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/geofences/${geofenceId}.json`, {
        params: {
          apiKey: this.apiKey,
        },
      });

      return true;
    } catch (error) {
      logger.error("Error deleting geofence with HERE Maps:", error);
      throw new Error("Failed to delete geofence");
    }
  }

  /**
   * Check if a point is inside a geofence
   */
  async checkGeofence(
    geofenceId: string,
    lat: number,
    lng: number,
  ): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/geofences/${geofenceId}/check.json`,
        {
          params: {
            apiKey: this.apiKey,
            point: `${lat},${lng}`,
          },
        },
      );

      return response.data.inside === true;
    } catch (error) {
      logger.error("Error checking geofence with HERE Maps:", error);
      throw new Error("Failed to check geofence");
    }
  }

  /**
   * Get all geofences
   */
  async getGeofences(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/geofences.json`, {
        params: {
          apiKey: this.apiKey,
        },
      });

      return response.data.geofences || [];
    } catch (error) {
      logger.error("Error getting geofences from HERE Maps:", error);
      throw new Error("Failed to get geofences");
    }
  }
}
