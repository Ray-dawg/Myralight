import React, { useState, useEffect, useCallback } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { checkGeofenceWithConfidence, GeofenceStatus } from "@/lib/geofencing";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "convex/react";
import { api } from "@/lib/convex/_generated/api";
import { AlertTriangle, MapPin, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface GeofenceDetectorProps {
  loadId: string;
  dropoffLat: number;
  dropoffLng: number;
  onArrival?: () => void;
  geofenceRadius?: number;
  requiredTimeInGeofence?: number; // Time in milliseconds to confirm arrival
}

const GeofenceDetector: React.FC<GeofenceDetectorProps> = ({
  loadId,
  dropoffLat,
  dropoffLng,
  onArrival,
  geofenceRadius = 100, // Default 100 meters
  requiredTimeInGeofence = 10000, // Default 10 seconds
}) => {
  const { toast } = useToast();
  const location = useGeolocation({
    enableHighAccuracy: true,
    watchPosition: true,
  });
  const [geofenceStatus, setGeofenceStatus] = useState<GeofenceStatus | null>(
    null,
  );
  const [timeInGeofence, setTimeInGeofence] = useState<number>(0);
  const [arrivalConfirmed, setArrivalConfirmed] = useState<boolean>(false);
  const [showBolUpload, setShowBolUpload] = useState<boolean>(false);

  // Convex mutation to update load status
  const updateLoadLocation = useMutation(api.loads.updateLoadLocation);

  // Check if driver is within geofence
  const checkGeofence = useCallback(() => {
    if (!location.latitude || !location.longitude) return;

    const status = checkGeofenceWithConfidence(
      location.latitude,
      location.longitude,
      dropoffLat,
      dropoffLng,
      location.accuracy,
      geofenceRadius,
    );

    setGeofenceStatus(status);

    // Update location in database
    try {
      updateLoadLocation({
        loadId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || undefined,
        heading: location.heading || undefined,
        speed: location.speed || undefined,
      });
    } catch (error) {
      console.error("Failed to update location:", error);
    }

    return status;
  }, [
    location,
    dropoffLat,
    dropoffLng,
    geofenceRadius,
    loadId,
    updateLoadLocation,
  ]);

  // Track time spent in geofence
  useEffect(() => {
    if (!geofenceStatus) return;

    let timer: NodeJS.Timeout | null = null;

    if (geofenceStatus.isWithin && !arrivalConfirmed) {
      // Start or continue timer when in geofence
      timer = setInterval(() => {
        setTimeInGeofence((prev) => {
          const newTime = prev + 1000;

          // Check if we've been in the geofence long enough
          if (newTime >= requiredTimeInGeofence && !arrivalConfirmed) {
            confirmArrival();
            if (timer) clearInterval(timer);
          }

          return newTime;
        });
      }, 1000);
    } else if (!geofenceStatus.isWithin) {
      // Reset timer when leaving geofence
      setTimeInGeofence(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [geofenceStatus, arrivalConfirmed, requiredTimeInGeofence]);

  // Run geofence check when location updates
  useEffect(() => {
    if (arrivalConfirmed) return;
    checkGeofence();
  }, [location, checkGeofence, arrivalConfirmed]);

  // Confirm arrival and trigger BOL upload
  const confirmArrival = async () => {
    setArrivalConfirmed(true);
    setShowBolUpload(true);

    toast({
      title: "Arrival Confirmed",
      description:
        "You have arrived at the delivery location. Please upload the Bill of Lading.",
    });

    // Notify parent component
    if (onArrival) onArrival();
  };

  // Manual arrival confirmation
  const handleManualConfirmation = () => {
    confirmArrival();
  };

  // Render progress bar for time in geofence
  const renderProgress = () => {
    if (!geofenceStatus?.isWithin || arrivalConfirmed) return null;

    const progressPercent = Math.min(
      (timeInGeofence / requiredTimeInGeofence) * 100,
      100,
    );

    return (
      <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Confirming arrival</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
    );
  };

  // Render BOL upload prompt
  const renderBolUpload = () => {
    if (!showBolUpload) return null;

    return (
      <Card className="mt-4 border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-green-700 mb-2">
            <Check className="h-5 w-5" />
            <h3 className="font-medium">Arrival Confirmed</h3>
          </div>
          <p className="text-sm text-green-700 mb-4">
            Please upload the Bill of Lading to complete this delivery.
          </p>
          <Button className="w-full">Upload BOL Document</Button>
        </CardContent>
      </Card>
    );
  };

  // If location services are not available
  if (location.error) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-amber-700 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-medium">Location Error</h3>
          </div>
          <p className="text-sm text-amber-700 mb-4">
            {location.error.message ||
              "Unable to access your location. Please enable location services."}
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleManualConfirmation}
          >
            Manually Confirm Arrival
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Location Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium mb-1">Delivery Location</h3>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {location.latitude
                    ? `${location.latitude.toFixed(5)}, ${location.longitude?.toFixed(5)}`
                    : "Acquiring location..."}
                </span>
              </div>
              {location.accuracy && (
                <p className="text-xs text-gray-500 mt-1">
                  Accuracy: ±{Math.round(location.accuracy)}m
                </p>
              )}
            </div>

            {geofenceStatus && (
              <Badge
                variant={geofenceStatus.isWithin ? "success" : "outline"}
                className={
                  geofenceStatus.isWithin ? "bg-green-100 text-green-800" : ""
                }
              >
                {geofenceStatus.isWithin
                  ? `Within ${Math.round(geofenceStatus.distance)}m`
                  : `${Math.round(geofenceStatus.distance)}m away`}
              </Badge>
            )}
          </div>

          {renderProgress()}

          {!arrivalConfirmed && (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={handleManualConfirmation}
            >
              Manually Confirm Arrival
            </Button>
          )}
        </CardContent>
      </Card>

      {renderBolUpload()}
    </div>
  );
};

export default GeofenceDetector;
