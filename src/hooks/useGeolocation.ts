import { useState, useEffect, useRef } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
  error: GeolocationPositionError | null;
  isWatching: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
  watchPosition?: boolean;
  watchInterval?: number; // For fallback polling in milliseconds
}

/**
 * React hook for tracking geolocation with enhanced reliability
 * Provides continuous location updates with fallback polling
 */
export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    maximumAge = 30000, // 30 seconds
    timeout = 27000, // 27 seconds
    watchPosition = true,
    watchInterval = 10000, // 10 seconds fallback polling
  } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    heading: null,
    speed: null,
    timestamp: null,
    error: null,
    isWatching: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Function to get current position
  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: new GeolocationPositionError({
          code: 2,
          message: "Geolocation is not supported by this browser.",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        }),
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
          error: null,
          isWatching: watchPosition,
        });
      },
      (error) => {
        setState((prev) => ({ ...prev, error }));
      },
      { enableHighAccuracy, maximumAge, timeout },
    );
  };

  // Start watching position
  useEffect(() => {
    // Initial position fetch
    getCurrentPosition();

    // Set up continuous watching if enabled
    if (watchPosition && navigator.geolocation) {
      // Primary method: Use browser's watchPosition
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
            error: null,
            isWatching: true,
          });
        },
        (error) => {
          setState((prev) => ({ ...prev, error }));
        },
        { enableHighAccuracy, maximumAge, timeout },
      );

      // Fallback method: Polling at regular intervals
      // This helps on devices where watchPosition updates are infrequent
      intervalIdRef.current = setInterval(getCurrentPosition, watchInterval);
    }

    // Cleanup
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [watchPosition, enableHighAccuracy, maximumAge, timeout, watchInterval]);

  return state;
}
