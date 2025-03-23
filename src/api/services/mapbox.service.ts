import axios from "axios";
import { logger } from "../utils/logger";

export class MapboxService {
  private accessToken: string;
  private baseUrl: string;

  constructor() {
    this.accessToken = process.env.MAPBOX_ACCESS_TOKEN || "";
    this.baseUrl = "https://api.mapbox.com";

    if (!this.accessToken) {
      logger.warn("Mapbox access token not found in environment variables");
    }
  }

  /**
   * Get route between two points
   */
  async getRoute(
    origin: [number, number],
    destination: [number, number],
    waypoints?: [number, number][],
  ): Promise<any> {
    try {
      // Format coordinates for Mapbox API
      let coordinates = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;

      // Add waypoints if provided
      if (waypoints && waypoints.length > 0) {
        coordinates = `${origin[0]},${origin[1]}`;
        for (const waypoint of waypoints) {
          coordinates += `;${waypoint[0]},${waypoint[1]}`;
        }
        coordinates += `;${destination[0]},${destination[1]}`;
      }

      const response = await axios.get(
        `${this.baseUrl}/directions/v5/mapbox/driving/${coordinates}`,
        {
          params: {
            access_token: this.accessToken,
            geometries: "geojson",
            overview: "full",
            steps: true,
            annotations: "duration,distance,speed",
          },
        },
      );

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        return {
          distance: route.distance, // in meters
          duration: route.duration, // in seconds
          geometry: route.geometry,
          legs: route.legs.map((leg: any) => ({
            distance: leg.distance,
            duration: leg.duration,
            steps: leg.steps.map((step: any) => ({
              distance: step.distance,
              duration: step.duration,
              instruction: step.maneuver.instruction,
              location: step.maneuver.location,
            })),
          })),
        };
      }

      throw new Error("No routes found");
    } catch (error) {
      logger.error("Error getting route from Mapbox:", error);
      throw new Error("Failed to calculate route");
    }
  }

  /**
   * Get optimized route for multiple stops
   */
  async getOptimizedRoute(coordinates: [number, number][]): Promise<any> {
    try {
      if (coordinates.length < 2) {
        throw new Error("At least 2 coordinates are required for a route");
      }

      // Format coordinates for Mapbox API
      const coordinatesString = coordinates
        .map((coord) => `${coord[0]},${coord[1]}`)
        .join(";");

      const response = await axios.get(
        `${this.baseUrl}/optimized-trips/v1/mapbox/driving/${coordinatesString}`,
        {
          params: {
            access_token: this.accessToken,
            geometries: "geojson",
            overview: "full",
            steps: true,
            roundtrip: false,
          },
        },
      );

      if (response.data.trips && response.data.trips.length > 0) {
        const trip = response.data.trips[0];
        return {
          distance: trip.distance,
          duration: trip.duration,
          geometry: trip.geometry,
          waypoints: response.data.waypoints.map((waypoint: any) => ({
            originalIndex: waypoint.waypoint_index,
            name: waypoint.name,
            location: waypoint.location,
          })),
          legs: trip.legs.map((leg: any) => ({
            distance: leg.distance,
            duration: leg.duration,
            steps: leg.steps.map((step: any) => ({
              distance: step.distance,
              duration: step.duration,
              instruction: step.maneuver.instruction,
              location: step.maneuver.location,
            })),
          })),
        };
      }

      throw new Error("No optimized trips found");
    } catch (error) {
      logger.error("Error getting optimized route from Mapbox:", error);
      throw new Error("Failed to calculate optimized route");
    }
  }

  /**
   * Geocode an address
   */
  async geocodeAddress(address: string): Promise<[number, number]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
        {
          params: {
            access_token: this.accessToken,
            limit: 1,
          },
        },
      );

      if (response.data.features && response.data.features.length > 0) {
        const [lng, lat] = response.data.features[0].center;
        return [lng, lat];
      }

      throw new Error("No results found for the address");
    } catch (error) {
      logger.error("Error geocoding address with Mapbox:", error);
      throw new Error("Failed to geocode address");
    }
  }

  /**
   * Reverse geocode coordinates
   */
  async reverseGeocode(lng: number, lat: number): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/geocoding/v5/mapbox.places/${lng},${lat}.json`,
        {
          params: {
            access_token: this.accessToken,
            limit: 1,
          },
        },
      );

      if (response.data.features && response.data.features.length > 0) {
        return {
          placeName: response.data.features[0].place_name,
          address: response.data.features[0].properties.address,
          context: response.data.features[0].context.reduce(
            (acc: any, ctx: any) => {
              const id = ctx.id.split(".")[0];
              acc[id] = ctx.text;
              return acc;
            },
            {},
          ),
        };
      }

      throw new Error("No results found for the coordinates");
    } catch (error) {
      logger.error("Error reverse geocoding with Mapbox:", error);
      throw new Error("Failed to reverse geocode coordinates");
    }
  }

  /**
   * Get isochrone (reachable area) from a point
   */
  async getIsochrone(
    lng: number,
    lat: number,
    minutes: number[],
  ): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/isochrone/v1/mapbox/driving/${lng},${lat}`,
        {
          params: {
            access_token: this.accessToken,
            contours_minutes: minutes.join(","),
            polygons: true,
          },
        },
      );

      return response.data.features.map((feature: any, index: number) => ({
        minutes: minutes[index],
        geometry: feature.geometry,
      }));
    } catch (error) {
      logger.error("Error getting isochrone from Mapbox:", error);
      throw new Error("Failed to calculate isochrone");
    }
  }

  /**
   * Get matrix of travel times between multiple points
   */
  async getMatrix(coordinates: [number, number][]): Promise<any> {
    try {
      if (coordinates.length < 2) {
        throw new Error("At least 2 coordinates are required for a matrix");
      }

      // Format coordinates for Mapbox API
      const coordinatesString = coordinates
        .map((coord) => `${coord[0]},${coord[1]}`)
        .join(";");

      const response = await axios.get(
        `${this.baseUrl}/directions-matrix/v1/mapbox/driving/${coordinatesString}`,
        {
          params: {
            access_token: this.accessToken,
            annotations: "duration,distance",
          },
        },
      );

      return {
        durations: response.data.durations, // 2D array of durations in seconds
        distances: response.data.distances, // 2D array of distances in meters
        sources: response.data.sources.map((source: any) => source.location),
        destinations: response.data.destinations.map(
          (dest: any) => dest.location,
        ),
      };
    } catch (error) {
      logger.error("Error getting matrix from Mapbox:", error);
      throw new Error("Failed to calculate distance matrix");
    }
  }
}
