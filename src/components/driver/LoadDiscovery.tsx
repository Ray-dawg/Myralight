import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FadeIn, SlideUp } from "@/components/ui/transitions";
import {
  Search,
  Filter,
  MapPin,
  DollarSign,
  Clock,
  Truck,
  AlertTriangle,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Navigation,
} from "lucide-react";
import {
  LoadMatchingService,
  LoadMatch,
} from "@/api/services/load-matching.service";
import { format, formatDistanceToNow } from "date-fns";
import { WebSocketService } from "@/api/services/websocket.service";
import { toast } from "@/components/ui/use-toast";

// Mock driver ID for demo purposes
const MOCK_DRIVER_ID = "driver_123";

interface FormattedLoad {
  id: string;
  pickup: {
    location: string;
    time: string;
  };
  delivery: {
    location: string;
    time: string;
  };
  distance: string;
  rate: number;
  weight: string;
  type: string;
  deadline: string;
  isPending?: boolean;
  isExternal?: boolean;
  score?: number;
}

interface CurrentLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface CurrentTrip {
  loadId: string;
  pickup: {
    location: string;
    time: string;
  };
  delivery: {
    location: string;
    time: string;
  };
  status: "assigned" | "in_transit" | "at_pickup" | "at_delivery";
}

interface NextStop {
  name: string;
  distance: string;
  duration: string;
}

interface WeatherAlert {
  type: string;
  message: string;
  severity: "low" | "medium" | "high";
}

export default function LoadDiscovery() {
  // Services
  const loadMatchingService = useRef<LoadMatchingService>(
    new LoadMatchingService(),
  );
  const webSocketService = useRef<WebSocketService>(
    WebSocketService.getInstance(),
  );

  // State
  const [loads, setLoads] = useState<FormattedLoad[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] =
    useState<CurrentLocation | null>(null);
  const [currentTrip, setCurrentTrip] = useState<CurrentTrip | null>(null);
  const [nextStop, setNextStop] = useState<NextStop | null>(null);
  const [weatherAlert, setWeatherAlert] = useState<WeatherAlert | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState({
    maxDistance: 500,
    minRate: 0,
    equipmentType: "",
  });
  const [pendingLoadId, setPendingLoadId] = useState<string | null>(null);
  const [pendingExpiration, setPendingExpiration] = useState<number | null>(
    null,
  );
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  // Timer ref for cleanup
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
    setupWebSocketListeners();

    // Mock data for UI demonstration
    setNextStop({
      name: "Love's Travel Stop",
      distance: "45 miles",
      duration: "45 min",
    });

    setWeatherAlert({
      type: "Weather Alert",
      message: "Heavy rain expected on I-94",
      severity: "medium",
    });

    // Cleanup
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      webSocketService.current.disconnect();
    };
  }, []);

  // Setup WebSocket listeners
  const setupWebSocketListeners = () => {
    try {
      webSocketService.current.connect();

      webSocketService.current.onNotification(
        MOCK_DRIVER_ID,
        (notification) => {
          if (notification.type === "load_pending_expired") {
            toast({
              title: "Load reservation expired",
              description: notification.message,
              variant: "destructive",
            });

            // Reset pending state
            if (pendingLoadId === notification.loadId) {
              setPendingLoadId(null);
              setPendingExpiration(null);
              setCountdown(null);
              if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
                countdownTimerRef.current = null;
              }
            }

            // Refresh loads
            fetchNearbyLoads();
          } else if (notification.type === "load_assigned") {
            toast({
              title: "Load assigned",
              description: `You've been assigned load ${notification.loadId}`,
            });

            // Update current trip
            fetchCurrentTrip();
          } else if (notification.type === "weather_alert") {
            setWeatherAlert({
              type: "Weather Alert",
              message: notification.message,
              severity: notification.severity || "medium",
            });
          }
        },
      );
    } catch (error) {
      console.error("Error setting up WebSocket listeners:", error);
      // Continue without WebSocket functionality
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude, address: "Chicago, IL" }); // Address would come from reverse geocoding
          fetchNearbyLoads(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError(
            "Unable to get your location. Please enable location services.",
          );

          // Use mock location for demo
          const mockLat = 41.8781;
          const mockLng = -87.6298;
          setCurrentLocation({
            latitude: mockLat,
            longitude: mockLng,
            address: "Chicago, IL",
          });
          fetchNearbyLoads(mockLat, mockLng);
        },
      );
    } else {
      setError("Geolocation is not supported by this browser.");

      // Use mock location for demo
      const mockLat = 41.8781;
      const mockLng = -87.6298;
      setCurrentLocation({
        latitude: mockLat,
        longitude: mockLng,
        address: "Chicago, IL",
      });
      fetchNearbyLoads(mockLat, mockLng);
    }
  };

  // Fetch nearby loads
  const fetchNearbyLoads = async (lat?: number, lng?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const latitude = lat || currentLocation?.latitude;
      const longitude = lng || currentLocation?.longitude;

      if (!latitude || !longitude) {
        throw new Error("Location not available");
      }

      const options = {
        maxDistance: filters.maxDistance,
        equipmentTypeRequired: !!filters.equipmentType,
        loadRankingFactors: {
          distance: 0.5,
          urgency: 0.3,
          rate: 0.2,
        },
      };

      const nearbyLoads = await loadMatchingService.current.findNearbyLoads(
        MOCK_DRIVER_ID,
        latitude,
        longitude,
        options,
      );

      // Format loads for UI
      const formattedLoads = nearbyLoads.map(formatLoadForUI);

      // Apply search filter if any
      const filteredLoads = searchQuery
        ? formattedLoads.filter(
            (load) =>
              load.pickup.location
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              load.delivery.location
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              load.id.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : formattedLoads;

      setLoads(filteredLoads);

      // Check if there's a pending load and start countdown
      const pendingLoad = nearbyLoads.find(
        (load) => load.isPending && load.pendingDriverId === MOCK_DRIVER_ID,
      );

      if (pendingLoad && pendingLoad.pendingExpiration) {
        setPendingLoadId(pendingLoad.id);
        setPendingExpiration(pendingLoad.pendingExpiration);
        startCountdown(pendingLoad.pendingExpiration);
      }
    } catch (err) {
      console.error("Error fetching nearby loads:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch nearby loads",
      );

      // Use mock data for demo
      const mockLoads = [
        {
          id: "L-1234",
          pickup: {
            location: "Chicago, IL",
            time: "Today, 2:00 PM",
          },
          delivery: {
            location: "Milwaukee, WI",
            time: "Today, 5:00 PM",
          },
          distance: "92 miles",
          rate: 850,
          weight: "15,000 lbs",
          type: "Dry Van",
          deadline: "5h remaining",
        },
        {
          id: "L-1235",
          pickup: {
            location: "Milwaukee, WI",
            time: "Tomorrow, 9:00 AM",
          },
          delivery: {
            location: "Minneapolis, MN",
            time: "Tomorrow, 4:00 PM",
          },
          distance: "337 miles",
          rate: 1200,
          weight: "22,000 lbs",
          type: "Reefer",
          deadline: "12h remaining",
        },
        {
          id: "L-1236",
          pickup: {
            location: "Des Moines, IA",
            time: "Tomorrow, 1:00 PM",
          },
          delivery: {
            location: "Kansas City, MO",
            time: "Tomorrow, 5:00 PM",
          },
          distance: "200 miles",
          rate: 750,
          weight: "18,000 lbs",
          type: "Flatbed",
          deadline: "24h remaining",
        },
      ];

      setLoads(mockLoads);
    } finally {
      setIsLoading(false);
    }
  };

  // Format load from API to UI format
  const formatLoadForUI = (load: LoadMatch): FormattedLoad => {
    const pickupTime = new Date(load.pickupWindowStart);
    const deliveryTime = new Date(load.pickupWindowEnd + 24 * 60 * 60 * 1000); // Estimate delivery 24h after pickup end

    // Calculate deadline
    const now = new Date();
    const hoursUntilPickup = Math.max(
      0,
      (pickupTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    );
    let deadline = "";

    if (hoursUntilPickup < 1) {
      deadline = "Urgent";
    } else if (hoursUntilPickup < 24) {
      deadline = `${Math.floor(hoursUntilPickup)}h remaining`;
    } else {
      deadline = `${Math.floor(hoursUntilPickup / 24)}d remaining`;
    }

    return {
      id: load.id,
      pickup: {
        location: `${load.pickupLocation.city}, ${load.pickupLocation.state}`,
        time: format(pickupTime, "MMM d, h:mm a"),
      },
      delivery: {
        location: `${load.deliveryLocation.city}, ${load.deliveryLocation.state}`,
        time: format(deliveryTime, "MMM d, h:mm a"),
      },
      distance: `${load.distance} miles`,
      rate: load.rate || 0,
      weight: `${load.weight.toLocaleString()} lbs`,
      type: load.equipmentType,
      deadline,
      isPending: load.isPending,
      isExternal: load.isExternal,
      score: load.score,
    };
  };

  // Start countdown timer for pending load
  const startCountdown = (expirationTime: number) => {
    // Clear any existing timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, expirationTime - now);

      if (remaining <= 0) {
        // Timer expired
        clearInterval(countdownTimerRef.current!);
        countdownTimerRef.current = null;
        setCountdown(null);
        setPendingLoadId(null);
        setPendingExpiration(null);

        // Refresh loads
        fetchNearbyLoads();

        toast({
          title: "Reservation expired",
          description:
            "Your load reservation has expired. Please select another load.",
          variant: "destructive",
        });
      } else {
        // Update countdown
        setCountdown(Math.ceil(remaining / 1000));
      }
    };

    // Initial update
    updateCountdown();

    // Set interval for updates
    countdownTimerRef.current = setInterval(updateCountdown, 1000);
  };

  // Request a load
  const handleRequestLoad = async (loadId: string) => {
    // If there's already a pending load, release it first
    if (pendingLoadId && pendingLoadId !== loadId) {
      try {
        await loadMatchingService.current.releasePendingLoad(
          pendingLoadId,
          MOCK_DRIVER_ID,
        );
      } catch (err) {
        console.error("Error releasing pending load:", err);
      }
    }

    try {
      // Get load details
      const loadDetails = await loadMatchingService.current.getLoadMatchDetails(
        loadId,
        MOCK_DRIVER_ID,
      );

      // If load is already pending for this driver, just show the countdown
      if (loadDetails.isPending) {
        setPendingLoadId(loadId);
        setPendingExpiration(loadDetails.pendingExpiresAt);
        startCountdown(loadDetails.pendingExpiresAt);
        return;
      }

      // Otherwise, request the load
      setIsLoading(true);

      // This would normally be an API call to request the load
      // For demo, we'll simulate a successful request
      setTimeout(() => {
        setPendingLoadId(loadId);
        const expirationTime = Date.now() + 30000; // 30 seconds from now
        setPendingExpiration(expirationTime);
        startCountdown(expirationTime);

        toast({
          title: "Load requested",
          description: `You have 30 seconds to confirm load ${loadId}`,
        });

        setIsLoading(false);
      }, 1000);
    } catch (err) {
      console.error("Error requesting load:", err);
      toast({
        title: "Error",
        description: "Failed to request load. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Confirm and accept a load
  const handleAcceptLoad = async (loadId: string) => {
    if (!pendingLoadId || pendingLoadId !== loadId) {
      toast({
        title: "Error",
        description: "This load is not currently reserved for you.",
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);

    try {
      // Assign load to driver
      await loadMatchingService.current.assignLoadToDriver(
        loadId,
        MOCK_DRIVER_ID,
      );

      // Clear pending state
      setPendingLoadId(null);
      setPendingExpiration(null);
      setCountdown(null);
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      // Update current trip
      fetchCurrentTrip();

      toast({
        title: "Success",
        description: `Load ${loadId} has been assigned to you.`,
      });
    } catch (err) {
      console.error("Error accepting load:", err);
      toast({
        title: "Error",
        description: "Failed to accept load. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Cancel a pending load request
  const handleCancelRequest = async (loadId: string) => {
    if (!pendingLoadId || pendingLoadId !== loadId) {
      return;
    }

    try {
      await loadMatchingService.current.releasePendingLoad(
        loadId,
        MOCK_DRIVER_ID,
      );

      // Clear pending state
      setPendingLoadId(null);
      setPendingExpiration(null);
      setCountdown(null);
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      toast({
        title: "Request cancelled",
        description: "You've cancelled your load request.",
      });

      // Refresh loads
      fetchNearbyLoads();
    } catch (err) {
      console.error("Error cancelling request:", err);
      toast({
        title: "Error",
        description: "Failed to cancel request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch current trip details
  const fetchCurrentTrip = async () => {
    // This would normally be an API call to get the current trip
    // For demo, we'll use mock data
    setCurrentTrip({
      loadId: "L-1234",
      pickup: {
        location: "Chicago, IL",
        time: "Today, 2:00 PM",
      },
      delivery: {
        location: "Milwaukee, WI",
        time: "Today, 5:00 PM",
      },
      status: "assigned",
    });
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Render countdown timer
  const renderCountdown = () => {
    if (!countdown) return null;

    return (
      <div className="text-sm font-medium">
        Confirming in: <span className="text-amber-600">{countdown}s</span>
      </div>
    );
  };

  return (
    <div className="h-screen relative overflow-hidden bg-gray-50">
      {/* Map Container */}
      <div className="absolute inset-0 bg-gray-100">
        <div className="h-full w-full flex items-center justify-center text-gray-400">
          <MapPin className="h-12 w-12" />
          <span className="ml-2">Map would render here</span>
        </div>
      </div>

      {/* Trip Info Cards */}
      <div className="absolute top-28 left-4 md:left-28 w-96 space-y-4 z-10">
        {/* Current Trip */}
        <FadeIn>
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Location</p>
                    <p className="font-medium">
                      {currentLocation?.address || "Loading..."}
                    </p>
                  </div>
                </div>
                {currentTrip && (
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Destination</p>
                      <p className="font-medium">
                        {currentTrip.delivery.location}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Next Stop */}
        {nextStop && (
          <SlideUp>
            <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{nextStop.name}</p>
                    <p className="text-sm text-gray-500">
                      {nextStop.distance} • {nextStop.duration}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SlideUp>
        )}

        {/* Weather Alert */}
        {weatherAlert && (
          <SlideUp>
            <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">{weatherAlert.type}</p>
                    <p className="text-sm">{weatherAlert.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SlideUp>
        )}

        {/* Loads Panel */}
        <div className="space-y-4">
          {/* Search & Filters */}
          <Card className="p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search loads..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <DollarSign className="h-4 w-4" />
                  Rate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <Clock className="h-4 w-4" />
                  Time
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <Truck className="h-4 w-4" />
                  Type
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap"
                  onClick={() => fetchNearbyLoads()}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>
            </div>
          </Card>

          {/* Error State */}
          {error && (
            <Card className="p-4 border-red-200 bg-red-50">
              <div className="flex items-center space-x-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && !loads.length && (
            <Card className="p-6 flex justify-center items-center">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-gray-500">
                  Finding loads near you...
                </p>
              </div>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !error && !loads.length && (
            <Card className="p-6">
              <div className="flex flex-col items-center space-y-4 py-6">
                <Truck className="h-12 w-12 text-gray-300" />
                <div className="text-center">
                  <h3 className="font-medium text-gray-900">No loads found</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    No available loads match your criteria
                  </p>
                </div>
                <Button onClick={() => fetchNearbyLoads()}>
                  Refresh Loads
                </Button>
              </div>
            </Card>
          )}

          {/* Load Cards */}
          {loads.map((load) => (
            <SlideUp key={load.id}>
              <Card
                className={`p-6 ${pendingLoadId === load.id ? "border-amber-300 bg-amber-50" : ""}`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{load.id}</h3>
                        {load.isExternal && (
                          <Badge variant="outline" className="text-xs">
                            External
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{load.type}</p>
                    </div>
                    <Badge
                      variant={
                        pendingLoadId === load.id ? "outline" : "secondary"
                      }
                      className={
                        pendingLoadId === load.id
                          ? "border-amber-500 text-amber-700 bg-amber-100"
                          : ""
                      }
                    >
                      {pendingLoadId === load.id ? "Reserved" : load.deadline}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        <div className="h-2 w-2 rounded-full bg-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pickup</p>
                        <p className="font-medium">{load.pickup.location}</p>
                        <p className="text-sm text-gray-500">
                          {load.pickup.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        <div className="h-2 w-2 rounded-full bg-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Delivery</p>
                        <p className="font-medium">{load.delivery.location}</p>
                        <p className="text-sm text-gray-500">
                          {load.delivery.time}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500">
                        {load.distance}
                      </div>
                      <div className="font-medium text-lg">${load.rate}</div>
                      {pendingLoadId === load.id && renderCountdown()}
                    </div>

                    {pendingLoadId === load.id ? (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelRequest(load.id)}
                          disabled={isAssigning}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleAcceptLoad(load.id)}
                          disabled={isAssigning}
                          className="relative"
                        >
                          {isAssigning ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Accepting
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleRequestLoad(load.id)}
                        disabled={isLoading || !!pendingLoadId}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Navigation className="h-4 w-4 mr-2" />
                        )}
                        Request Load
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </SlideUp>
          ))}
        </div>
      </div>
    </div>
  );
}
