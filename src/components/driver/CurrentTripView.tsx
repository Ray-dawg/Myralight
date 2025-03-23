import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import {
  MapPin,
  Navigation,
  Clock,
  CheckCircle,
  Truck,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { FadeIn, SlideUp } from "@/components/ui/transitions";
import BolUploadDialog from "./BolUploadDialog";
import GeofenceDetector from "./GeofenceDetector";

interface TripLocation {
  name: string;
  address: string;
  city: string;
  state: string;
  time: Date;
  timeWindowEnd?: Date;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface CurrentTripViewProps {
  loadId: string;
  pickup: TripLocation;
  delivery: TripLocation;
  status: "assigned" | "in_transit" | "at_pickup" | "at_delivery";
  distance: number;
  remainingDistance: number;
  estimatedArrival: Date;
  onNavigate: () => void;
  onUpdateStatus: (
    status: "in_transit" | "at_pickup" | "at_delivery" | "delivered",
  ) => void;
  onUploadDocument: (type: "bol" | "pod") => void;
}

const CurrentTripView: React.FC<CurrentTripViewProps> = ({
  loadId,
  pickup,
  delivery,
  status,
  distance,
  remainingDistance,
  estimatedArrival,
  onNavigate,
  onUpdateStatus,
  onUploadDocument,
}) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showBolDialog, setShowBolDialog] = useState(false);
  const [documentType, setDocumentType] = useState<"bol" | "pod">("pod");

  // Calculate progress percentage
  const progressPercentage = Math.round(
    ((distance - remainingDistance) / distance) * 100,
  );

  // Format ETA
  const now = new Date();
  const minutesToArrival = Math.max(
    0,
    Math.floor((estimatedArrival.getTime() - now.getTime()) / (1000 * 60)),
  );
  const hoursToArrival = Math.floor(minutesToArrival / 60);
  const remainingMinutes = minutesToArrival % 60;

  const eta =
    hoursToArrival > 0
      ? `${hoursToArrival}h ${remainingMinutes}m`
      : `${remainingMinutes}m`;

  // Determine current destination based on status
  const currentDestination =
    status === "assigned" || status === "in_transit" ? pickup : delivery;

  // Handle status update
  const handleStatusUpdate = async (
    newStatus: "in_transit" | "at_pickup" | "at_delivery" | "delivered",
  ) => {
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle arrival detection from geofence
  const handleArrivalDetected = () => {
    if (status === "in_transit") {
      handleStatusUpdate("at_delivery");
      setShowBolDialog(true);
    }
  };

  // Render action button based on current status
  const renderActionButton = () => {
    switch (status) {
      case "assigned":
        return (
          <Button
            onClick={() => handleStatusUpdate("in_transit")}
            disabled={isUpdatingStatus}
            className="w-full"
          >
            {isUpdatingStatus ? "Updating..." : "Start Trip"}
          </Button>
        );
      case "in_transit":
        return (
          <Button
            onClick={() => handleStatusUpdate("at_pickup")}
            disabled={isUpdatingStatus}
            className="w-full"
          >
            {isUpdatingStatus ? "Updating..." : "Arrived at Pickup"}
          </Button>
        );
      case "at_pickup":
        return (
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => {
                setDocumentType("bol");
                onUploadDocument("bol");
              }}
              className="w-full flex items-center justify-center"
            >
              <Camera className="h-4 w-4 mr-2" />
              Upload BOL
            </Button>
            <Button
              onClick={() => handleStatusUpdate("in_transit")}
              disabled={isUpdatingStatus}
              className="w-full"
            >
              {isUpdatingStatus ? "Updating..." : "Depart for Delivery"}
            </Button>
          </div>
        );
      case "at_delivery":
        return (
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => {
                setDocumentType("pod");
                setShowBolDialog(true);
              }}
              className="w-full flex items-center justify-center"
            >
              <Camera className="h-4 w-4 mr-2" />
              Upload Delivery Docs
            </Button>
            <Button
              onClick={() => handleStatusUpdate("delivered")}
              disabled={isUpdatingStatus}
              className="w-full"
            >
              {isUpdatingStatus ? "Updating..." : "Complete Delivery"}
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <SlideUp>
      <Card className="max-w-md mx-auto">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Current Trip</CardTitle>
              <p className="text-sm text-gray-500">{loadId}</p>
            </div>
            <Badge
              variant={
                status === "at_pickup" || status === "at_delivery"
                  ? "secondary"
                  : "default"
              }
            >
              {status === "assigned"
                ? "Not Started"
                : status === "in_transit"
                  ? "In Transit"
                  : status === "at_pickup"
                    ? "At Pickup"
                    : "At Delivery"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Trip Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Current Destination */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start space-x-3">
              <div className="mt-1">
                <div className="h-3 w-3 rounded-full bg-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {status === "assigned" || status === "in_transit"
                    ? "Next Stop: Pickup"
                    : "Next Stop: Delivery"}
                </p>
                <p className="font-medium">
                  {currentDestination.name ||
                    `${currentDestination.city}, ${currentDestination.state}`}
                </p>
                <p className="text-sm text-gray-500">
                  {format(currentDestination.time, "EEE, MMM d • h:mm a")}
                  {currentDestination.timeWindowEnd &&
                    ` - ${format(currentDestination.timeWindowEnd, "h:mm a")}`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentDestination.address}
                </p>

                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Navigation className="h-3 w-3 text-gray-500" />
                    <span className="text-xs">{remainingDistance} mi</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span className="text-xs">ETA: {eta}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Route Overview */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="mt-1">
                <div
                  className={`h-3 w-3 rounded-full ${status === "at_pickup" || status === "in_transit" || status === "at_delivery" ? "bg-green-600" : "bg-blue-600"}`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pickup</p>
                <p className="font-medium">
                  {pickup.city}, {pickup.state}
                </p>
                <p className="text-sm text-gray-500">
                  {format(pickup.time, "EEE, MMM d • h:mm a")}
                  {pickup.timeWindowEnd &&
                    ` - ${format(pickup.timeWindowEnd, "h:mm a")}`}
                </p>
                {status === "at_pickup" && (
                  <Badge
                    variant="outline"
                    className="mt-1 text-green-700 bg-green-50 border-green-200"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" /> Arrived
                  </Badge>
                )}
              </div>
            </div>

            <div className="ml-1.5 h-6 w-0.5 bg-gray-200 mx-auto" />

            <div className="flex items-start space-x-3">
              <div className="mt-1">
                <div
                  className={`h-3 w-3 rounded-full ${status === "at_delivery" ? "bg-green-600" : "bg-red-600"}`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery</p>
                <p className="font-medium">
                  {delivery.city}, {delivery.state}
                </p>
                <p className="text-sm text-gray-500">
                  {format(delivery.time, "EEE, MMM d • h:mm a")}
                </p>
                {status === "at_delivery" && (
                  <Badge
                    variant="outline"
                    className="mt-1 text-green-700 bg-green-50 border-green-200"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" /> Arrived
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Geofence detector for delivery location */}
          {status === "in_transit" && (
            <div className="mt-4">
              <Separator className="my-4" />
              <h4 className="text-sm font-medium mb-2">Arrival Detection</h4>
              <GeofenceDetector
                loadId={loadId}
                dropoffLat={delivery.coordinates.latitude}
                dropoffLng={delivery.coordinates.longitude}
                onArrival={handleArrivalDetected}
                geofenceRadius={100}
                requiredTimeInGeofence={10000}
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 pt-2">
          <Button
            variant="outline"
            onClick={onNavigate}
            className="w-full flex items-center justify-center"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Navigate
          </Button>

          {renderActionButton()}
        </CardFooter>
      </Card>

      {/* BOL Upload Dialog */}
      <BolUploadDialog
        open={showBolDialog}
        onOpenChange={setShowBolDialog}
        loadId={loadId}
        documentType={documentType}
        onSuccess={() => {
          handleStatusUpdate("delivered");
        }}
      />
    </SlideUp>
  );
};

export default CurrentTripView;
