import React, { useState, useEffect } from "react";
import MapComponent from "./MapComponent";
import { MAPBOX_ACCESS_TOKEN } from "@/lib/mapbox";
import { Button } from "@/components/ui/button";

interface RouteMapProps {
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  waypoints?: Array<{ latitude: number; longitude: number }>;
  originLabel?: string;
  destinationLabel?: string;
  height?: string;
  className?: string;
  showControls?: boolean;
  onRouteCalculated?: (route: any) => void;
}

const RouteMap: React.FC<RouteMapProps> = ({
  origin,
  destination,
  waypoints = [],
  originLabel = "Origin",
  destinationLabel = "Destination",
  height = "400px",
  className = "",
  showControls = true,
  onRouteCalculated,
}) => {
  const [route, setRoute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate the route using Mapbox Directions API
  useEffect(() => {
    const fetchRoute = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build coordinates string for the API request
        let coordinatesStr = `${origin.longitude},${origin.latitude}`;

        // Add waypoints if any
        waypoints.forEach((point) => {
          coordinatesStr += `;${point.longitude},${point.latitude}`;
        });

        // Add destination
        coordinatesStr += `;${destination.longitude},${destination.latitude}`;

        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesStr}?` +
            `alternatives=false&geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_ACCESS_TOKEN}`,
        );

        if (!response.ok) throw new Error("Failed to fetch route");

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          setRoute(data.routes[0]);
          if (onRouteCalculated) {
            onRouteCalculated(data.routes[0]);
          }
        } else {
          throw new Error("No route found");
        }
      } catch (err) {
        console.error("Error fetching route:", err);
        setError(
          err instanceof Error ? err.message : "Failed to calculate route",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [origin, destination, waypoints]);

  // Calculate map bounds to fit all points
  const getBounds = () => {
    const points = [
      [origin.longitude, origin.latitude],
      [destination.longitude, destination.latitude],
      ...waypoints.map((wp) => [wp.longitude, wp.latitude]),
    ] as [number, number][];

    // Find min/max coordinates to create a bounding box
    const lngs = points.map((p) => p[0]);
    const lats = points.map((p) => p[1]);

    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    // Calculate center point
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    return {
      center: [centerLng, centerLat] as [number, number],
      // We don't need to calculate zoom here as MapComponent will handle fitting the bounds
    };
  };

  const bounds = getBounds();

  // Prepare markers and route for the map
  const markers = [
    {
      id: "origin",
      longitude: origin.longitude,
      latitude: origin.latitude,
      color: "#3FB1CE",
      popupContent: originLabel,
    },
    {
      id: "destination",
      longitude: destination.longitude,
      latitude: destination.latitude,
      color: "#F84C4C",
      popupContent: destinationLabel,
    },
    ...waypoints.map((wp, index) => ({
      id: `waypoint-${index}`,
      longitude: wp.longitude,
      latitude: wp.latitude,
      color: "#FFBB00",
      popupContent: `Waypoint ${index + 1}`,
    })),
  ];

  const routes = route
    ? [
        {
          id: "main-route",
          coordinates: route.geometry.coordinates,
          color: "#3887be",
          width: 5,
        },
      ]
    : [];

  return (
    <div className={`relative ${className}`}>
      <MapComponent
        center={bounds.center}
        markers={markers}
        routes={routes}
        style={{ width: "100%", height }}
        interactive={showControls}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2">Calculating route...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
          <div className="text-center text-red-500 p-4 bg-white rounded shadow">
            <p>Error: {error}</p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteMap;
