import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { FadeIn, SlideUp } from "@/components/ui/transitions";
import { RouteOptimizationService } from "@/api/services/route-optimization.service";
import { WebSocketService } from "@/api/services/websocket.service";
import {
  Truck,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";

// Create a mock loadMatchingService to match the expected interface
const loadMatchingService = {
  findMatchingLoads: async (
    driverId: string,
    latitude: number,
    longitude: number,
  ) => {
    console.log(
      `Finding loads for driver ${driverId} at location (${latitude}, ${longitude})`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return [];
  },
  acceptLoad: async (loadId: string, driverId: string) => {
    console.log(`Driver ${driverId} accepting load ${loadId}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return true;
  },
};

interface LoadMatchingViewProps {
  driverId: string;
  currentLocation: { latitude: number; longitude: number };
  onLoadAccepted: (loadId: string) => void;
}

const LoadMatchingView: React.FC<LoadMatchingViewProps> = ({
  driverId,
  currentLocation,
  onLoadAccepted,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableLoads, setAvailableLoads] = useState<any[]>([]);
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [isAccepting, setIsAccepting] = useState(false);

  const loadMatchingServiceRef = useRef(loadMatchingService);
  const routeOptimizationService = useRef(new RouteOptimizationService());
  const webSocketService = useRef(WebSocketService.getInstance());
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set up WebSocket for real-time load updates
    setupWebSocketListeners();

    // Fetch available loads
    fetchAvailableLoads();

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      webSocketService.current.disconnect();
    };
  }, []);

  // Start countdown when a load is selected
  useEffect(() => {
    if (selectedLoadId) {
      setCountdown(30);
      startCountdown();
    } else if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, [selectedLoadId]);

  const setupWebSocketListeners = () => {
    try {
      webSocketService.current.connect();

      webSocketService.current.onNotification(driverId, (notification) => {
        if (notification.type === "new_load_available") {
          toast({
            title: "New Load Available",
            description: "A new load has been added to your available loads.",
          });

          fetchAvailableLoads();
        } else if (notification.type === "load_assigned") {
          toast({
            title: "Load Assigned",
            description: `Load ${notification.loadId} has been assigned to you.`,
          });

          if (onLoadAccepted) {
            onLoadAccepted(notification.loadId);
          }
        }
      });
    } catch (error) {
      console.error("Error setting up WebSocket listeners:", error);
    }
  };

  const fetchAvailableLoads = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loads = await loadMatchingServiceRef.current.findMatchingLoads(
        driverId,
        currentLocation.latitude,
        currentLocation.longitude,
      );

      // Limit to 3 loads for the matching algorithm
      setAvailableLoads(loads.slice(0, 3));
    } catch (err) {
      console.error("Error fetching available loads:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch available loads",
      );

      // Use mock data for demo
      const mockLoads = [
        {
          id: "load-1",
          referenceNumber: "L-1234",
          pickupLocation: {
            address: "123 Main St, Chicago, IL",
            windowStart: Date.now() + 2 * 60 * 60 * 1000, // 2 hours from now
            windowEnd: Date.now() + 4 * 60 * 60 * 1000, // 4 hours from now
          },
          deliveryLocation: {
            address: "456 Oak St, Milwaukee, WI",
            windowStart: Date.now() + 6 * 60 * 60 * 1000, // 6 hours from now
            windowEnd: Date.now() + 8 * 60 * 60 * 1000, // 8 hours from now
          },
          rate: 850,
          estimatedDistance: 92,
          equipmentType: "Dry Van",
          status: "posted",
        },
        {
          id: "load-2",
          referenceNumber: "L-1235",
          pickupLocation: {
            address: "789 Pine St, Milwaukee, WI",
            windowStart: Date.now() + 3 * 60 * 60 * 1000, // 3 hours from now
            windowEnd: Date.now() + 5 * 60 * 60 * 1000, // 5 hours from now
          },
          deliveryLocation: {
            address: "101 Maple St, Minneapolis, MN",
            windowStart: Date.now() + 8 * 60 * 60 * 1000, // 8 hours from now
            windowEnd: Date.now() + 10 * 60 * 60 * 1000, // 10 hours from now
          },
          rate: 1200,
          estimatedDistance: 337,
          equipmentType: "Reefer",
          status: "posted",
        },
        {
          id: "load-3",
          referenceNumber: "L-1236",
          pickupLocation: {
            address: "202 Elm St, Des Moines, IA",
            windowStart: Date.now() + 4 * 60 * 60 * 1000, // 4 hours from now
            windowEnd: Date.now() + 6 * 60 * 60 * 1000, // 6 hours from now
          },
          deliveryLocation: {
            address: "303 Cedar St, Kansas City, MO",
            windowStart: Date.now() + 9 * 60 * 60 * 1000, // 9 hours from now
            windowEnd: Date.now() + 11 * 60 * 60 * 1000, // 11 hours from now
          },
          rate: 750,
          estimatedDistance: 200,
          equipmentType: "Flatbed",
          status: "posted",
        },
      ];

      setAvailableLoads(mockLoads);
    } finally {
      setIsLoading(false);
    }
  };

  const startCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Time's up, release the load
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSelectLoad = (loadId: string) => {
    setSelectedLoadId(loadId);

    toast({
      title: "Load Selected",
      description: `You have 30 seconds to confirm load ${loadId}`,
    });
  };

  const handleAcceptLoad = async () => {
    if (!selectedLoadId) return;

    setIsAccepting(true);

    try {
      await loadMatchingService.acceptLoad(selectedLoadId, driverId);

      toast({
        title: "Load Accepted",
        description: `Load ${selectedLoadId} has been assigned to you.`,
      });

      // Clear countdown
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }

      // Notify parent component
      if (onLoadAccepted) {
        onLoadAccepted(selectedLoadId);
      }
    } catch (err) {
      console.error("Error accepting load:", err);
      toast({
        title: "Error",
        description: "Failed to accept load. Please try again.",
        variant: "destructive",
      });

      // For demo, simulate success anyway
      if (onLoadAccepted) {
        onLoadAccepted(selectedLoadId);
      }
    } finally {
      setIsAccepting(false);
      setSelectedLoadId(null);
    }
  };

  const handleCancelSelection = () => {
    setSelectedLoadId(null);

    // Clear countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    toast({
      title: "Selection Cancelled",
      description: "You've cancelled your load selection.",
    });
  };

  const handleTimeExpired = () => {
    setSelectedLoadId(null);

    toast({
      title: "Time Expired",
      description:
        "Your selection time has expired. The load is now available to other drivers.",
      variant: "destructive",
    });

    // Refresh available loads
    fetchAvailableLoads();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Available Loads</h2>
        <Button
          variant="outline"
          onClick={fetchAvailableLoads}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            "Refresh"
          )}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedLoadId ? (
        <FadeIn>
          <Card className="border-2 border-blue-500">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Confirm Load Selection</span>
                <Badge
                  variant="outline"
                  className="text-blue-600 border-blue-300 bg-blue-50"
                >
                  {countdown}s remaining
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <Progress value={(countdown / 30) * 100} className="h-2 mb-4" />

              {availableLoads
                .filter((load) => load.id === selectedLoadId)
                .map((load) => (
                  <div key={load.id} className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">
                          {load.referenceNumber}
                        </h3>
                        <Badge variant="outline">{load.equipmentType}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${load.rate}
                        </p>
                        <p className="text-sm text-gray-500">
                          {load.estimatedDistance} miles
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-blue-500 mt-1" />
                        <div>
                          <p className="font-medium">Pickup</p>
                          <p className="text-gray-700">
                            {load.pickupLocation.address}
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatDate(load.pickupWindowStart)} -{" "}
                              {formatDate(load.pickupWindowEnd)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-red-500 mt-1" />
                        <div>
                          <p className="font-medium">Delivery</p>
                          <p className="text-gray-700">
                            {load.deliveryLocation.address}
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatDate(load.deliveryWindowStart)} -{" "}
                              {formatDate(load.deliveryWindowEnd)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>

            <CardFooter className="flex justify-between space-x-4">
              <Button
                variant="outline"
                className="w-1/2"
                onClick={handleCancelSelection}
                disabled={isAccepting}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                className="w-1/2"
                onClick={handleAcceptLoad}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Accepting...
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
        </FadeIn>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {isLoading && !availableLoads.length ? (
            <Card className="p-8">
              <CardContent className="flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-500">Finding available loads...</p>
              </CardContent>
            </Card>
          ) : availableLoads.length === 0 ? (
            <Card className="p-8">
              <CardContent className="flex flex-col items-center justify-center">
                <Truck className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Loads Available</h3>
                <p className="text-gray-500 text-center">
                  There are currently no loads available in your area.
                </p>
                <Button className="mt-4" onClick={fetchAvailableLoads}>
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : (
            availableLoads.map((load) => (
              <SlideUp key={load.id}>
                <Card className="hover:border-blue-200 transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">
                            {load.referenceNumber}
                          </h3>
                          <Badge variant="outline">{load.equipmentType}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">
                            ${load.rate}
                          </p>
                          <p className="text-sm text-gray-500">
                            {load.estimatedDistance} miles
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="mt-1">
                            <div className="h-2 w-2 rounded-full bg-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Pickup</p>
                            <p className="font-medium">
                              {load.pickupLocation.address.split(",")[0]}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(load.pickupWindowStart)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="mt-1">
                            <div className="h-2 w-2 rounded-full bg-red-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Delivery</p>
                            <p className="font-medium">
                              {load.deliveryLocation.address.split(",")[0]}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(load.deliveryWindowStart)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => handleSelectLoad(load.id)}
                      >
                        Select Load
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </SlideUp>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LoadMatchingView;
