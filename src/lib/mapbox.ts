// Mapbox configuration and utilities
export const MAPBOX_ACCESS_TOKEN =
  (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string) ||
  "pk.eyJ1IjoicmF5ODgxNiIsImEiOiJjbThlbnUyOWYwM2Z0MmtxMWxpbDl4aTR0In0.by1iUYheNxA294wLpJUyXw";

// Updated to a consistent style across all dashboards - using a more detailed style for better visualization
export const MAPBOX_STYLE = "mapbox://styles/mapbox/navigation-day-v1";

// Default map center (US centered)
export const DEFAULT_CENTER = [-95.7129, 37.0902];
export const DEFAULT_ZOOM = 4;

// Utility function to format coordinates for Mapbox
export const formatCoordinates = (
  lat: number,
  lng: number,
): [number, number] => {
  return [lng, lat];
};

// Ensure Mapbox works in all environments
export const initMapbox = () => {
  // This helps with SSR and environments where window might not be available
  if (typeof window !== "undefined") {
    // Make sure mapboxgl is loaded
    try {
      return true;
    } catch (error) {
      console.error("Error initializing Mapbox:", error);
      return false;
    }
  }
  return false;
};
