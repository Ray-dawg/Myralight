import React, { useState } from "react";
import MapComponent from "./MapComponent";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Target } from "lucide-react";

interface GeofenceMapProps {
  initialLocation?: { latitude: number; longitude: number };
  initialRadius?: number;
  onGeofenceCreate?: (geofence: {
    latitude: number;
    longitude: number;
    radius: number;
    address?: string;
    name?: string;
  }) => void;
  height?: string;
  className?: string;
  viewOnly?: boolean;
  existingGeofences?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    radius: number;
    name: string;
  }>;
}

const GeofenceMap: React.FC<GeofenceMapProps> = ({
  initialLocation,
  initialRadius = 500, // meters
  onGeofenceCreate,
  height = "400px",
  className = "",
  viewOnly = false,
  existingGeofences = [],
}) => {
  const [center, setCenter] = useState<[number, number]>(
    initialLocation
      ? [initialLocation.longitude, initialLocation.latitude]
      : [-95.7129, 37.0902], // Default to US center
  );
  const [radius, setRadius] = useState(initialRadius);
  const [geofenceLocation, setGeofenceLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(initialLocation || null);
  const [geofenceName, setGeofenceName] = useState("");
  const [selectedExistingGeofence, setSelectedExistingGeofence] = useState<
    string | null
  >(null);

  // Handle map click to set geofence location
  const handleMapClick = (lngLat: { lng: number; lat: number }) => {
    if (viewOnly) return;

    setGeofenceLocation({
      latitude: lngLat.lat,
      longitude: lngLat.lng,
    });
    setCenter([lngLat.lng, lngLat.lat]);
    setSelectedExistingGeofence(null);
  };

  // Handle radius change
  const handleRadiusChange = (value: number[]) => {
    setRadius(value[0]);
  };

  // Handle geofence creation
  const handleCreateGeofence = () => {
    if (!geofenceLocation) return;

    if (onGeofenceCreate) {
      const geofenceData = {
        latitude: geofenceLocation.latitude,
        longitude: geofenceLocation.longitude,
        radius,
        address: geofenceName,
        name: geofenceName,
      };

      // Call the parent component callback
      onGeofenceCreate(geofenceData);

      // Reset form
      setGeofenceName("");
      setGeofenceLocation(null);
    }
  };

  // Prepare markers for the map
  let markers = geofenceLocation
    ? [
        {
          id: "geofence-center",
          longitude: geofenceLocation.longitude,
          latitude: geofenceLocation.latitude,
          color: "#4CAF50",
          popupContent: `
            <div class="p-2">
              <div class="font-bold">Geofence Center</div>
              <div>Lat: ${geofenceLocation.latitude.toFixed(6)}</div>
              <div>Lng: ${geofenceLocation.longitude.toFixed(6)}</div>
              <div>Radius: ${radius} meters</div>
            </div>
          `,
        },
      ]
    : [];

  // Add existing geofences as markers
  if (existingGeofences && existingGeofences.length > 0) {
    const existingMarkers = existingGeofences.map((geofence) => ({
      id: `existing-${geofence.id}`,
      longitude: geofence.longitude,
      latitude: geofence.latitude,
      color: selectedExistingGeofence === geofence.id ? "#FF5722" : "#2196F3",
      popupContent: `
        <div class="p-2">
          <div class="font-bold">${geofence.name}</div>
          <div>Lat: ${geofence.latitude.toFixed(6)}</div>
          <div>Lng: ${geofence.longitude.toFixed(6)}</div>
          <div>Radius: ${geofence.radius} meters</div>
        </div>
      `,
    }));

    markers = [...markers, ...existingMarkers];
  }

  // Create a circle to represent the geofence
  // Note: This is a simplified approach - in a real app, you'd use a proper circle layer
  const createCirclePoints = (
    center: [number, number],
    radiusInMeters: number,
    points = 64,
  ) => {
    const coordinates: [number, number][] = [];
    const km = radiusInMeters / 1000;

    // Earth's radius in km
    const earthRadius = 6371;

    // Convert latitude and longitude to radians
    const lat = (center[1] * Math.PI) / 180;
    const lng = (center[0] * Math.PI) / 180;

    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;

      // Calculate the point at the given angle and distance
      const latPoint = Math.asin(
        Math.sin(lat) * Math.cos(km / earthRadius) +
          Math.cos(lat) * Math.sin(km / earthRadius) * Math.cos(angle),
      );

      const lngPoint =
        lng +
        Math.atan2(
          Math.sin(angle) * Math.sin(km / earthRadius) * Math.cos(lat),
          Math.cos(km / earthRadius) - Math.sin(lat) * Math.sin(latPoint),
        );

      // Convert back to degrees
      const latDeg = (latPoint * 180) / Math.PI;
      const lngDeg = (lngPoint * 180) / Math.PI;

      coordinates.push([lngDeg, latDeg]);
    }

    return coordinates;
  };

  // Prepare routes (circle) for the map
  let routes = geofenceLocation
    ? [
        {
          id: "geofence-circle",
          coordinates: createCirclePoints(
            [geofenceLocation.longitude, geofenceLocation.latitude],
            radius,
          ),
          color: "#4CAF50",
          width: 2,
        },
      ]
    : [];

  // Add existing geofences as circles
  if (existingGeofences && existingGeofences.length > 0) {
    const existingCircles = existingGeofences.map((geofence) => ({
      id: `existing-circle-${geofence.id}`,
      coordinates: createCirclePoints(
        [geofence.longitude, geofence.latitude],
        geofence.radius,
      ),
      color: selectedExistingGeofence === geofence.id ? "#FF5722" : "#2196F3",
      width: 2,
    }));

    routes = [...routes, ...existingCircles];
  }

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <MapComponent
            center={center}
            zoom={12}
            markers={markers}
            routes={routes}
            onMapClick={handleMapClick}
            style={{ width: "100%", height }}
          />
        </div>

        {!viewOnly && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Geofence Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="geofence-name">Geofence Name</Label>
                  <Input
                    id="geofence-name"
                    placeholder="Enter a name for this geofence"
                    value={geofenceName}
                    onChange={(e) => setGeofenceName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Radius (meters)</Label>
                  <div className="flex items-center space-x-2">
                    <Slider
                      value={[radius]}
                      min={50}
                      max={5000}
                      step={50}
                      onValueChange={handleRadiusChange}
                    />
                    <span className="w-12 text-right">{radius}m</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  {geofenceLocation ? (
                    <div className="text-sm">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-primary" />
                        <span>
                          {geofenceLocation.latitude.toFixed(6)},{" "}
                          {geofenceLocation.longitude.toFixed(6)}
                        </span>
                      </div>
                      <p className="text-gray-500 mt-1">
                        Click on the map to change location
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Click on the map to set a location
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  disabled={!geofenceLocation}
                  onClick={handleCreateGeofence}
                >
                  Create Geofence
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeofenceMap;
