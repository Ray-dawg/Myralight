import React from "react";
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
import { format } from "date-fns";
import { LoadMatch } from "@/api/services/load-matching.service";
import {
  MapPin,
  Navigation,
  Clock,
  DollarSign,
  Package,
  Truck,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { SlideUp } from "@/components/ui/transitions";

interface LoadDetailsViewProps {
  load: LoadMatch;
  onAccept: () => void;
  onReject: () => void;
  onNavigate: () => void;
  isAccepting: boolean;
}

const LoadDetailsView: React.FC<LoadDetailsViewProps> = ({
  load,
  onAccept,
  onReject,
  onNavigate,
  isAccepting,
}) => {
  // Format dates
  const pickupTime = new Date(load.pickupWindowStart);
  const pickupEndTime = new Date(load.pickupWindowEnd);
  const estimatedDeliveryTime = new Date(
    load.pickupWindowEnd + 24 * 60 * 60 * 1000,
  ); // Estimate delivery 24h after pickup end

  // Calculate ETA
  const now = new Date();
  const minutesToPickup = Math.max(
    0,
    Math.floor((pickupTime.getTime() - now.getTime()) / (1000 * 60)),
  );
  const hoursToPickup = Math.floor(minutesToPickup / 60);
  const remainingMinutes = minutesToPickup % 60;

  const eta =
    hoursToPickup > 0
      ? `${hoursToPickup}h ${remainingMinutes}m`
      : `${remainingMinutes}m`;

  // Determine if load is urgent (less than 2 hours to pickup)
  const isUrgent = minutesToPickup < 120;

  return (
    <SlideUp>
      <Card className="max-w-md mx-auto">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{load.id}</CardTitle>
              <p className="text-sm text-gray-500">{load.equipmentType}</p>
            </div>
            <Badge variant={isUrgent ? "destructive" : "secondary"}>
              {isUrgent ? "Urgent" : "Standard"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Route Overview */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="mt-1">
                <div className="h-3 w-3 rounded-full bg-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pickup</p>
                <p className="font-medium">
                  {load.pickupLocation.city}, {load.pickupLocation.state}
                </p>
                <p className="text-sm text-gray-500">
                  {format(pickupTime, "EEE, MMM d • h:mm a")} -{" "}
                  {format(pickupEndTime, "h:mm a")}
                </p>
                {load.pickupLocation.address && (
                  <p className="text-xs text-gray-500 mt-1">
                    {load.pickupLocation.address}
                  </p>
                )}
              </div>
            </div>

            <div className="ml-1.5 h-6 w-0.5 bg-gray-200 mx-auto" />

            <div className="flex items-start space-x-3">
              <div className="mt-1">
                <div className="h-3 w-3 rounded-full bg-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery</p>
                <p className="font-medium">
                  {load.deliveryLocation.city}, {load.deliveryLocation.state}
                </p>
                <p className="text-sm text-gray-500">
                  {format(estimatedDeliveryTime, "EEE, MMM d • h:mm a")}
                </p>
                {load.deliveryLocation.address && (
                  <p className="text-xs text-gray-500 mt-1">
                    {load.deliveryLocation.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Load Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Navigation className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Distance</p>
                <p className="font-medium">{load.distance} miles</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">ETA to Pickup</p>
                <p className="font-medium">{eta}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Rate</p>
                <p className="font-medium">${load.rate || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Weight</p>
                <p className="font-medium">
                  {load.weight.toLocaleString()} lbs
                </p>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {load.hazmat && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">
                  Hazardous Materials
                </p>
                <p className="text-sm text-amber-700">
                  This load contains hazardous materials. Special handling
                  required.
                </p>
              </div>
            </div>
          )}

          {/* External Load Notice */}
          {load.isExternal && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start space-x-2">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">External Load</p>
                <p className="text-sm text-blue-700">
                  This load is from{" "}
                  {load.externalProvider || "an external provider"}. Additional
                  terms may apply.
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between space-x-2 pt-2">
          <Button variant="outline" onClick={onReject} disabled={isAccepting}>
            <XCircle className="h-4 w-4 mr-2" />
            Decline
          </Button>

          <Button onClick={onAccept} disabled={isAccepting} className="flex-1">
            {isAccepting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Load
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </SlideUp>
  );
};

export default LoadDetailsView;
