import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, AlertCircle } from "lucide-react";

interface GeofenceProximityIndicatorProps {
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  nextGeofence?: {
    name: string;
    type: "pickup" | "delivery";
    radius: number; // in meters
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  distanceToGeofence?: number; // in miles
  isWithinGeofence?: boolean;
}

const GeofenceProximityIndicator: React.FC<GeofenceProximityIndicatorProps> = ({
  currentLocation,
  nextGeofence,
  distanceToGeofence = 0,
  isWithinGeofence = false,
}) => {
  // Default values for demo purposes
  const defaultNextGeofence = {
    name: "Pickup Location",
    type: "pickup" as const,
    radius: 100, // meters
    coordinates: {
      latitude: currentLocation.latitude + 0.01,
      longitude: currentLocation.longitude + 0.01,
    },
  };

  const geofence = nextGeofence || defaultNextGeofence;
  const [proximityPercentage, setProximityPercentage] = useState(0);

  // Calculate proximity percentage based on distance
  useEffect(() => {
    if (isWithinGeofence) {
      setProximityPercentage(100);
    } else if (distanceToGeofence <= 0.1) {
      // Within 0.1 miles
      setProximityPercentage(90);
    } else if (distanceToGeofence <= 0.5) {
      // Within 0.5 miles
      setProximityPercentage(75);
    } else if (distanceToGeofence <= 1) {
      // Within 1 mile
      setProximityPercentage(50);
    } else if (distanceToGeofence <= 5) {
      // Within 5 miles
      setProximityPercentage(25);
    } else {
      setProximityPercentage(10);
    }
  }, [distanceToGeofence, isWithinGeofence]);

  // Get color based on proximity
  const getProximityColor = () => {
    if (isWithinGeofence) return "bg-green-500";
    if (proximityPercentage >= 75) return "bg-green-400";
    if (proximityPercentage >= 50) return "bg-yellow-400";
    if (proximityPercentage >= 25) return "bg-orange-400";
    return "bg-red-400";
  };

  // Get status text based on proximity
  const getStatusText = () => {
    if (isWithinGeofence) return "You have arrived!";
    if (proximityPercentage >= 75) return "Almost there!";
    if (proximityPercentage >= 50) return "Getting closer";
    if (proximityPercentage >= 25) return "On your way";
    return "Far from destination";
  };

  return (
    <Card className="w-full bg-white shadow-md dark:bg-gray-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Geofence Proximity
          </CardTitle>
          <Badge
            variant={isWithinGeofence ? "default" : "outline"}
            className={isWithinGeofence ? "bg-green-500 text-white" : ""}
          >
            {isWithinGeofence ? "Inside Geofence" : "Outside Geofence"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Proximity indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Proximity to {geofence.name}</span>
            <span>{getStatusText()}</span>
          </div>
          <Progress
            value={proximityPercentage}
            className={`h-2 ${getProximityColor()}`}
          />
        </div>

        {/* Distance information */}
        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
          <div className="flex items-center">
            <Navigation className="h-5 w-5 mr-2 text-blue-500" />
            <span className="font-medium">Distance</span>
          </div>
          <span>
            {isWithinGeofence
              ? "You have arrived"
              : `${distanceToGeofence.toFixed(1)} miles away`}
          </span>
        </div>

        {/* Alert if very close */}
        {proximityPercentage >= 75 && !isWithinGeofence && (
          <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-md border border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
            <span className="text-sm">
              You're approaching the {geofence.type} location. Get ready!
            </span>
          </div>
        )}

        {/* Instructions if within geofence */}
        {isWithinGeofence && (
          <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-800">
            <AlertCircle className="h-5 w-5 mr-2 text-green-500" />
            <span className="text-sm">
              {geofence.type === "pickup"
                ? "You've arrived at pickup. Status updated automatically."
                : "You've arrived at delivery. Please complete delivery process."}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeofenceProximityIndicator;
