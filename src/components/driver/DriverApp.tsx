import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Navigation, Truck, Clock } from "lucide-react";
import LoadMatchingView from "./LoadMatchingView";
import DriverMapView from "./DriverMapView";
import CurrentTripView from "./CurrentTripView";
import LocationUpdate from "./LocationUpdate";
import { RouteOptimizationService } from "@/api/services/route-optimization.service";

// Mock driver ID for demo purposes
const MOCK_DRIVER_ID = "driver_123";

const DriverApp: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("map");
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: 41.8781,
    longitude: -87.6298,
  });
  const [currentLoadId, setCurrentLoadId] = useState<string | null>(null);
  const [tripStatus, setTripStatus] = useState<
    "assigned" | "in_transit" | "at_pickup" | "at_delivery" | null
  >(null);
  const [tripDetails, setTripDetails] = useState<any>(null);

  const routeOptimizationService = new RouteOptimizationService();

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Keep default Chicago location
        },
      );
    }

    // Check if there's an active trip in local storage
    const savedTripData = localStorage.getItem("driverActiveTrip");
    if (savedTripData) {
      try {
        const tripData = JSON.parse(savedTripData);
        setCurrentLoadId(tripData.loadId);
        setTripStatus(tripData.status);
        setTripDetails(tripData.details);
        setActiveTab("trip");
      } catch (error) {
        console.error("Error parsing saved trip data:", error);
        localStorage.removeItem("driverActiveTrip");
      }
    }
  }, []);

  const handleLocationUpdate = (location: {
    latitude: number;
    longitude: number;
  }) => {
    setCurrentLocation(location);

    toast({
      title: "Location Updated",
      description: `New location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
    });
  };

  const handleLoadAccepted = async (loadId: string) => {
    setCurrentLoadId(loadId);
    setTripStatus("assigned");
    setActiveTab("trip");

    try {
      // Generate route for the accepted load
      const routeResult =
        await routeOptimizationService.generateDriverToLoadRoute(
          MOCK_DRIVER_ID,
          loadId,
        );

      // Create trip details
      const now = new Date();
      const tripDetails = {
        loadId,
        pickup: {
          name: "Pickup Location",
          address: "123 Main St",
          city: "Chicago",
          state: "IL",
          time: new Date(now.getTime() + 1200 * 1000), // 20 minutes from now
          coordinates: {
            latitude: 41.9,
            longitude: -87.65,
          },
        },
        delivery: {
          name: "Delivery Location",
          address: "456 Oak St",
          city: "Milwaukee",
          state: "WI",
          time: new Date(now.getTime() + 3000 * 1000), // 50 minutes from now
          coordinates: {
            latitude: 42.0,
            longitude: -87.7,
          },
        },
        distance: 92,
        remainingDistance: 92,
        estimatedArrival: new Date(now.getTime() + 1200 * 1000), // 20 minutes from now
      };

      setTripDetails(tripDetails);

      // Save trip data to local storage
      localStorage.setItem(
        "driverActiveTrip",
        JSON.stringify({
          loadId,
          status: "assigned",
          details: tripDetails,
        }),
      );

      toast({
        title: "Trip Started",
        description: `You've been assigned load ${loadId}. Navigate to pickup location.`,
      });
    } catch (error) {
      console.error("Error generating route:", error);

      // Use mock data for demo
      const now = new Date();
      const mockTripDetails = {
        loadId,
        pickup: {
          name: "Pickup Location",
          address: "123 Main St",
          city: "Chicago",
          state: "IL",
          time: new Date(now.getTime() + 1200 * 1000), // 20 minutes from now
          coordinates: {
            latitude: 41.9,
            longitude: -87.65,
          },
        },
        delivery: {
          name: "Delivery Location",
          address: "456 Oak St",
          city: "Milwaukee",
          state: "WI",
          time: new Date(now.getTime() + 3000 * 1000), // 50 minutes from now
          coordinates: {
            latitude: 42.0,
            longitude: -87.7,
          },
        },
        distance: 92,
        remainingDistance: 92,
        estimatedArrival: new Date(now.getTime() + 1200 * 1000), // 20 minutes from now
      };

      setTripDetails(mockTripDetails);

      // Save trip data to local storage
      localStorage.setItem(
        "driverActiveTrip",
        JSON.stringify({
          loadId,
          status: "assigned",
          details: mockTripDetails,
        }),
      );
    }
  };

  const handleUpdateTripStatus = async (
    newStatus: "in_transit" | "at_pickup" | "at_delivery" | "delivered",
  ) => {
    if (!currentLoadId || !tripDetails) return;

    // Update trip status
    if (newStatus === "delivered") {
      // Trip completed
      setCurrentLoadId(null);
      setTripStatus(null);
      setTripDetails(null);
      setActiveTab("loads");

      // Remove from local storage
      localStorage.removeItem("driverActiveTrip");

      toast({
        title: "Trip Completed",
        description: "You've successfully completed the delivery.",
      });
    } else {
      setTripStatus(newStatus);

      // Update trip details based on status
      const updatedDetails = { ...tripDetails };

      if (newStatus === "in_transit" && tripStatus === "assigned") {
        // Started driving to pickup
        updatedDetails.remainingDistance = tripDetails.distance;
      } else if (newStatus === "at_pickup") {
        // Arrived at pickup
        updatedDetails.remainingDistance = tripDetails.distance * 0.5; // Halfway there
      } else if (newStatus === "in_transit" && tripStatus === "at_pickup") {
        // Started driving to delivery
        updatedDetails.remainingDistance = tripDetails.distance * 0.5; // Halfway there
      } else if (newStatus === "at_delivery") {
        // Arrived at delivery
        updatedDetails.remainingDistance = 0;
      }

      setTripDetails(updatedDetails);

      // Save updated trip data to local storage
      localStorage.setItem(
        "driverActiveTrip",
        JSON.stringify({
          loadId: currentLoadId,
          status: newStatus,
          details: updatedDetails,
        }),
      );

      toast({
        title: "Status Updated",
        description: `Trip status updated to ${newStatus.replace("_", " ")}.`,
      });
    }
  };

  const handleNavigate = () => {
    setActiveTab("map");

    toast({
      title: "Navigation Started",
      description: "Turn-by-turn directions are now available on the map.",
    });
  };

  const handleUploadDocument = (type: "bol" | "pod") => {
    toast({
      title: "Document Upload",
      description: `${type === "bol" ? "Bill of Lading" : "Proof of Delivery"} upload would open here.`,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Truck className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Driver App</h1>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              {currentLocation
                ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
                : "Location unavailable"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <div className="px-4 pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="map" className="flex-1">
                <Navigation className="h-4 w-4 mr-2" />
                Map
              </TabsTrigger>
              <TabsTrigger value="loads" className="flex-1">
                <Truck className="h-4 w-4 mr-2" />
                Loads
              </TabsTrigger>
              {currentLoadId && (
                <TabsTrigger value="trip" className="flex-1">
                  <Clock className="h-4 w-4 mr-2" />
                  Trip
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="map" className="h-full m-0 p-0">
              <DriverMapView
                driverId={MOCK_DRIVER_ID}
                loadId={currentLoadId || undefined}
                currentLocation={currentLocation}
                onLocationUpdate={handleLocationUpdate}
              />
            </TabsContent>

            <TabsContent value="loads" className="h-full m-0 overflow-auto">
              {!currentLoadId ? (
                <LoadMatchingView
                  driverId={MOCK_DRIVER_ID}
                  currentLocation={currentLocation}
                  onLoadAccepted={handleLoadAccepted}
                />
              ) : (
                <div className="p-4 flex flex-col items-center justify-center h-full">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold mb-2">
                      You have an active trip
                    </h2>
                    <p className="text-gray-600">
                      You already have an assigned load. Complete or cancel it
                      before accepting a new one.
                    </p>
                  </div>
                  <Button onClick={() => setActiveTab("trip")}>
                    View Current Trip
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="trip" className="h-full m-0 overflow-auto p-4">
              {currentLoadId && tripStatus && tripDetails ? (
                <div className="max-w-md mx-auto">
                  <CurrentTripView
                    loadId={currentLoadId}
                    pickup={tripDetails.pickup}
                    delivery={tripDetails.delivery}
                    status={tripStatus}
                    distance={tripDetails.distance}
                    remainingDistance={tripDetails.remainingDistance}
                    estimatedArrival={tripDetails.estimatedArrival}
                    onNavigate={handleNavigate}
                    onUpdateStatus={handleUpdateTripStatus}
                    onUploadDocument={handleUploadDocument}
                  />

                  <div className="mt-6">
                    <LocationUpdate />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold mb-2">No Active Trip</h2>
                    <p className="text-gray-600">
                      You don't have any active trips. Go to the Loads tab to
                      find and accept a load.
                    </p>
                  </div>
                  <Button onClick={() => setActiveTab("loads")}>
                    Find Loads
                  </Button>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default DriverApp;
