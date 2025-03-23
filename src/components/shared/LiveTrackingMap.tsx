import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Clock, Navigation } from "lucide-react";
import { format } from "date-fns";

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Custom truck icon
const truckIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3028/3028335.png",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Custom pickup icon
const pickupIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Custom delivery icon
const deliveryIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1048/1048953.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface Location {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

interface LoadLocation {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface LiveTrackingMapProps {
  loadId: string;
  driverId: string;
  driverLocation?: Location;
  pickupLocation: LoadLocation;
  deliveryLocation: LoadLocation;
  routeGeometry?: number[][];
  eta?: string;
  status: string;
  onRefresh?: () => void;
  height?: string;
  showControls?: boolean;
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  loadId,
  driverId,
  driverLocation,
  pickupLocation,
  deliveryLocation,
  routeGeometry,
  eta,
  status,
  onRefresh,
  height = "500px",
  showControls = true,
}) => {
  const [locationHistory, setLocationHistory] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [autoCenter, setAutoCenter] = useState<boolean>(true);
  const mapRef = useRef<any>(null);

  // Convert coordinates to Leaflet format [lat, lng]
  const pickupCoords: [number, number] = [
    pickupLocation.coordinates.latitude,
    pickupLocation.coordinates.longitude,
  ];

  const deliveryCoords: [number, number] = [
    deliveryLocation.coordinates.latitude,
    deliveryLocation.coordinates.longitude,
  ];

  const driverCoords: [number, number] | null = driverLocation
    ? [driverLocation.latitude, driverLocation.longitude]
    : null;

  // Format route geometry for Leaflet
  const routePoints: [number, number][] = routeGeometry
    ? routeGeometry.map((point) => [point[1], point[0]])
    : [];

  // Format location history for trail
  const historyPoints: [number, number][] = locationHistory.map((loc) => [
    loc.latitude,
    loc.longitude,
  ]);

  // Calculate bounds to fit all points
  const getBounds = () => {
    const points = [
      pickupCoords,
      deliveryCoords,
      ...(driverCoords ? [driverCoords] : []),
    ];
    return L.latLngBounds(points);
  };

  // Fetch location history
  const fetchLocationHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tracking/history/${loadId}`);
      const data = await response.json();
      if (data.success && data.history) {
        setLocationHistory(data.history);
      }
    } catch (error) {
      console.error("Error fetching location history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Center map on driver
  const centerOnDriver = () => {
    if (mapRef.current && driverCoords) {
      mapRef.current.setView(driverCoords, 12);
    }
  };

  // Center map to fit all points
  const fitAllPoints = () => {
    if (mapRef.current) {
      mapRef.current.fitBounds(getBounds(), { padding: [50, 50] });
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchLocationHistory();
    if (onRefresh) {
      onRefresh();
    }
  };

  // Initialize map and fetch data
  useEffect(() => {
    fetchLocationHistory();

    // Import and use the unified WebSocket service
    import("@/lib/websocket")
      .then(
        ({
          getWebSocket,
          subscribeToLoad,
          unsubscribeFromLoad,
          authenticateUser,
        }) => {
          // Authenticate user
          const userId = localStorage.getItem("userId");
          if (userId) {
            authenticateUser(userId);
          }

          // Subscribe to load updates
          subscribeToLoad(loadId);

          // Set up event listeners for driver location updates
          const handleLocationUpdate = (event: CustomEvent) => {
            const data = event.detail;

            if (data.driverId === driverId) {
              // Update driver location in parent component via callback
              if (onRefresh) {
                onRefresh();
              }

              // Auto-center map on driver if enabled
              if (autoCenter && mapRef.current && data.location) {
                mapRef.current.setView(
                  [data.location.latitude, data.location.longitude],
                  mapRef.current.getZoom(),
                );
              }
            }
          };

          // Listen for driver location updates
          window.addEventListener(
            "driver:location_update",
            handleLocationUpdate as EventListener,
          );

          return () => {
            // Unsubscribe and remove event listeners on unmount
            unsubscribeFromLoad(loadId);
            window.removeEventListener(
              "driver:location_update",
              handleLocationUpdate as EventListener,
            );
          };
        },
      )
      .catch((error) => {
        console.error("Error initializing WebSocket:", error);
      });
  }, [loadId, driverId]);

  // Auto-center map when driver location changes
  useEffect(() => {
    if (autoCenter && mapRef.current && driverCoords) {
      mapRef.current.setView(driverCoords, mapRef.current.getZoom());
    }
  }, [driverCoords, autoCenter]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Live Tracking</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge
              variant={status === "in_transit" ? "success" : "secondary"}
              className="text-xs"
            >
              {status.replace("_", " ").toUpperCase()}
            </Badge>
            {eta && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="w-3 h-3 mr-1" />
                ETA: {format(new Date(eta), "MMM d, h:mm a")}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ height }}>
          <MapContainer
            center={driverCoords || pickupCoords}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
            whenCreated={(map) => {
              mapRef.current = map;
              map.fitBounds(getBounds(), { padding: [50, 50] });
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Pickup marker */}
            <Marker position={pickupCoords} icon={pickupIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>Pickup Location</strong>
                  <p>{pickupLocation.address}</p>
                  <p>
                    {pickupLocation.city}, {pickupLocation.state}{" "}
                    {pickupLocation.zipCode}
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Delivery marker */}
            <Marker position={deliveryCoords} icon={deliveryIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>Delivery Location</strong>
                  <p>{deliveryLocation.address}</p>
                  <p>
                    {deliveryLocation.city}, {deliveryLocation.state}{" "}
                    {deliveryLocation.zipCode}
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Driver marker */}
            {driverCoords && (
              <Marker
                position={driverCoords}
                icon={truckIcon}
                rotationAngle={driverLocation?.heading || 0}
                rotationOrigin="center"
              >
                <Popup>
                  <div className="text-sm">
                    <strong>Driver Location</strong>
                    <p>
                      Updated:{" "}
                      {format(
                        new Date(driverLocation?.timestamp || ""),
                        "MMM d, h:mm:ss a",
                      )}
                    </p>
                    {driverLocation?.speed && (
                      <p>Speed: {Math.round(driverLocation.speed)} mph</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Route line */}
            {routePoints.length > 0 && (
              <Polyline
                positions={routePoints}
                color="#3b82f6"
                weight={4}
                opacity={0.7}
              />
            )}

            {/* Location history trail */}
            {historyPoints.length > 0 && (
              <Polyline
                positions={historyPoints}
                color="#10b981"
                weight={3}
                opacity={0.5}
                dashArray="5, 10"
              />
            )}
          </MapContainer>
        </div>

        {showControls && (
          <div className="flex justify-between items-center p-4">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={centerOnDriver}
                disabled={!driverCoords}
              >
                <Truck className="w-4 h-4 mr-1" />
                Center on Driver
              </Button>
              <Button size="sm" variant="outline" onClick={fitAllPoints}>
                <MapPin className="w-4 h-4 mr-1" />
                Show All Points
              </Button>
            </div>
            <div className="flex space-x-2 items-center">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoCenter"
                  checked={autoCenter}
                  onChange={(e) => setAutoCenter(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="autoCenter" className="text-sm">
                  Auto-center
                </label>
              </div>
              <Button size="sm" onClick={handleRefresh} disabled={isLoading}>
                <Navigation className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveTrackingMap;
