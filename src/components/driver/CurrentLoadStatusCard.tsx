import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Truck, CheckCircle } from "lucide-react";

interface CurrentLoadStatusCardProps {
  loadId?: string;
  status?: "assigned" | "in_transit" | "at_pickup" | "at_delivery" | null;
  pickup?: {
    name: string;
    address: string;
    city: string;
    state: string;
    time: Date;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  delivery?: {
    name: string;
    address: string;
    city: string;
    state: string;
    time: Date;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  distance?: number;
  remainingDistance?: number;
  estimatedArrival?: Date;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

const getStatusColor = (status: string | null | undefined) => {
  switch (status) {
    case "assigned":
      return "bg-blue-500";
    case "in_transit":
      return "bg-amber-500";
    case "at_pickup":
      return "bg-green-500";
    case "at_delivery":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusText = (status: string | null | undefined) => {
  switch (status) {
    case "assigned":
      return "Assigned";
    case "in_transit":
      return "In Transit";
    case "at_pickup":
      return "At Pickup";
    case "at_delivery":
      return "At Delivery";
    default:
      return "No Active Load";
  }
};

const formatAddress = (location: any) => {
  if (!location) return "";
  return `${location.address}, ${location.city}, ${location.state}`;
};

const formatTime = (time: Date | undefined) => {
  if (!time) return "";
  return new Date(time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const calculateProgress = (
  total: number | undefined,
  remaining: number | undefined,
) => {
  if (!total || !remaining || total === 0) return 0;
  const completed = total - remaining;
  return Math.round((completed / total) * 100);
};

const CurrentLoadStatusCard: React.FC<CurrentLoadStatusCardProps> = ({
  loadId,
  status,
  pickup,
  delivery,
  distance,
  remainingDistance,
  estimatedArrival,
  currentLocation,
}) => {
  const progress = calculateProgress(distance, remainingDistance);
  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status);

  // If no active load, show a simplified card
  if (!loadId || !status) {
    return (
      <Card className="w-full bg-white shadow-md dark:bg-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            No Active Load
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400">
            You don't have any active loads. Check the Loads tab to find and
            accept a load.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white shadow-md dark:bg-gray-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            Load #{loadId}
          </CardTitle>
          <Badge className={`${statusColor} text-white`}>{statusText}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Trip Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Location details */}
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-start">
            <MapPin className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Pickup</p>
              <p className="text-gray-600 dark:text-gray-400">{pickup?.name}</p>
              <p className="text-gray-600 dark:text-gray-400">
                {formatAddress(pickup)}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {pickup?.time ? (
                  <span className="flex items-center mt-1">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {formatTime(pickup.time)}
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Delivery</p>
              <p className="text-gray-600 dark:text-gray-400">
                {delivery?.name}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {formatAddress(delivery)}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {delivery?.time ? (
                  <span className="flex items-center mt-1">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {formatTime(delivery.time)}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        {/* ETA */}
        {estimatedArrival && (
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-500" />
              <span className="font-medium">Estimated Arrival</span>
            </div>
            <span>{formatTime(estimatedArrival)}</span>
          </div>
        )}

        {/* Distance remaining */}
        {remainingDistance !== undefined && (
          <div className="text-sm text-gray-600 dark:text-gray-400 text-right">
            {remainingDistance} miles remaining
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentLoadStatusCard;
