// Mapbox configuration and utilities
export const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoicmF5ODgxNiIsImEiOiJjbThlbnUyOWYwM2Z0MmtxMWxpbDl4aTR0In0.by1iUYheNxA294wLpJUyXw";

// Updated to a more neutral base style that works better with data visualizations
export const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";

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
