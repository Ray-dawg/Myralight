/**
 * Geofencing utility functions for location-based triggers
 */

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  // Earth's radius in meters
  const R = 6371e3;

  // Convert degrees to radians
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  // Haversine formula
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if a location is within a geofence
 * @param currentLat Current latitude
 * @param currentLng Current longitude
 * @param targetLat Target latitude (center of geofence)
 * @param targetLng Target longitude (center of geofence)
 * @param radiusMeters Radius of geofence in meters
 * @returns Boolean indicating if location is within geofence
 */
export function isWithinGeofence(
  currentLat: number,
  currentLng: number,
  targetLat: number,
  targetLng: number,
  radiusMeters: number = 100, // Default 100 meters radius
): boolean {
  const distance = calculateDistance(
    currentLat,
    currentLng,
    targetLat,
    targetLng,
  );
  return distance <= radiusMeters;
}

/**
 * Get accuracy-adjusted radius for geofencing
 * This helps account for GPS inaccuracy by adjusting the geofence radius
 * @param accuracy GPS accuracy in meters (if available from browser)
 * @param baseRadius Base radius in meters
 * @returns Adjusted radius in meters
 */
export function getAdjustedRadius(
  accuracy: number | null,
  baseRadius: number = 100,
): number {
  // If accuracy is not available or unreliable, use base radius
  if (!accuracy || accuracy > 500) {
    return baseRadius;
  }

  // Add a portion of the accuracy to the base radius
  // This makes the geofence larger when GPS is less accurate
  return baseRadius + accuracy * 0.5;
}

/**
 * Geofence status with confidence level
 */
export interface GeofenceStatus {
  isWithin: boolean;
  confidence: "high" | "medium" | "low";
  distance: number;
  accuracy?: number | null;
}

/**
 * Check geofence status with confidence level based on GPS accuracy
 */
export function checkGeofenceWithConfidence(
  currentLat: number,
  currentLng: number,
  targetLat: number,
  targetLng: number,
  accuracy: number | null = null,
  radiusMeters: number = 100,
): GeofenceStatus {
  const distance = calculateDistance(
    currentLat,
    currentLng,
    targetLat,
    targetLng,
  );

  // Adjust radius based on accuracy
  const adjustedRadius = getAdjustedRadius(accuracy, radiusMeters);
  const isWithin = distance <= adjustedRadius;

  // Determine confidence level
  let confidence: "high" | "medium" | "low" = "high";

  if (accuracy === null) {
    confidence = "medium"; // No accuracy data
  } else if (accuracy > 100) {
    confidence = "low"; // Poor GPS accuracy
  } else if (accuracy > 30) {
    confidence = "medium"; // Moderate GPS accuracy
  }

  return {
    isWithin,
    confidence,
    distance,
    accuracy,
  };
}
