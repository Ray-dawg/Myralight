import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex/_generated/api";
import GeofenceDetector from "./GeofenceDetector";
import BolUploadDialog from "./BolUploadDialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  FileText,
  CheckCircle,
  Camera,
  Truck,
  Navigation,
} from "lucide-react";
import { format } from "date-fns";

interface DeliveryArrivalHandlerProps {
  loadId: string;
  onDeliveryComplete?: () => void;
}

const DeliveryArrivalHandler: React.FC<DeliveryArrivalHandlerProps> = ({
  loadId,
  onDeliveryComplete,
}) => {
  const [showBolDialog, setShowBolDialog] = useState(false);
  const [arrivalDetected, setArrivalDetected] = useState(false);
  const [documentType, setDocumentType] = useState<"bol" | "pod">("pod");

  // Get load details from Convex
  const load = useQuery(api.loads.getLoad, { id: loadId });

  // Check if load is already delivered
  const isDelivered = load?.status === "delivered";

  // Handle arrival detection
  const handleArrival = () => {
    setArrivalDetected(true);
    // Don't automatically show dialog, let user click the button
  };

  // Handle document upload button click
  const handleUploadClick = (type: "bol" | "pod") => {
    setDocumentType(type);
    setShowBolDialog(true);
  };

  // Handle successful BOL upload
  const handleBolUploadSuccess = () => {
    if (onDeliveryComplete) {
      onDeliveryComplete();
    }
  };

  // If load data is not available yet
  if (!load) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
          <p className="text-gray-500">Loading delivery information...</p>
        </CardContent>
      </Card>
    );
  }

  // If load is already delivered
  if (isDelivered) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-green-700 mb-2">
            <CheckCircle className="h-5 w-5" />
            <h3 className="font-medium">Delivery Completed</h3>
          </div>
          <p className="text-sm text-green-700 mb-2">
            This load has been successfully delivered and the documentation has
            been uploaded.
          </p>
          {load.documentUrl && (
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={() => window.open(load.documentUrl, "_blank")}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Document
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Extract delivery location coordinates
  const dropoffLat = load.deliveryLocation?.latitude || 0;
  const dropoffLng = load.deliveryLocation?.longitude || 0;

  // Format delivery window time
  const formatDeliveryWindow = () => {
    if (!load.deliveryLocation?.windowStart) return null;

    const startDate = new Date(load.deliveryLocation.windowStart);
    const endDate = load.deliveryLocation.windowEnd
      ? new Date(load.deliveryLocation.windowEnd)
      : null;

    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
        <Clock className="h-4 w-4 flex-shrink-0" />
        <span>
          {format(startDate, "EEE, MMM d • h:mm a")}
          {endDate && ` - ${format(endDate, "h:mm a")}`}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Delivery Information</span>
            <Badge
              variant={arrivalDetected ? "success" : "outline"}
              className={arrivalDetected ? "bg-green-100 text-green-800" : ""}
            >
              {arrivalDetected ? "Arrived" : load.status.replace("_", " ")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">Delivery Location</p>
                <p className="text-gray-700">
                  {load.deliveryLocation?.address}
                </p>
                {formatDeliveryWindow()}
              </div>
            </div>
          </div>
        </CardContent>

        {arrivalDetected && (
          <CardFooter className="flex flex-col space-y-3 pt-0 px-4 pb-4">
            <div className="w-full p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center space-x-2 text-green-700 mb-1">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <p className="font-medium">Arrival Confirmed</p>
              </div>
              <p className="text-sm text-green-600 ml-6">
                Please upload the required delivery documentation to complete
                this delivery.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleUploadClick("bol")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Upload BOL
              </Button>
              <Button
                className="w-full"
                onClick={() => handleUploadClick("pod")}
              >
                <Camera className="h-4 w-4 mr-2" />
                Upload POD
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Geofence detector */}
      <GeofenceDetector
        loadId={loadId}
        dropoffLat={dropoffLat}
        dropoffLng={dropoffLng}
        onArrival={handleArrival}
        geofenceRadius={100} // 100 meters
        requiredTimeInGeofence={10000} // 10 seconds
      />

      {/* BOL upload dialog */}
      <BolUploadDialog
        open={showBolDialog}
        onOpenChange={setShowBolDialog}
        loadId={loadId}
        documentType={documentType}
        onSuccess={handleBolUploadSuccess}
      />
    </div>
  );
};

export default DeliveryArrivalHandler;
