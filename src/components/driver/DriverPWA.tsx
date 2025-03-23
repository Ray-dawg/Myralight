import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Navigation, Truck, Clock, Download } from "lucide-react";
import LoadMatchingView from "./LoadMatchingView";
import DriverMapView from "./DriverMapView";
import CurrentTripView from "./CurrentTripView";
import LocationUpdate from "./LocationUpdate";
import CurrentLoadStatusCard from "./CurrentLoadStatusCard";
import GeofenceProximityIndicator from "./GeofenceProximityIndicator";
import AutomaticStatusChangeNotification from "./AutomaticStatusChangeNotification";
import BOLUploadPrompt from "./BOLUploadPrompt";
import LoadCompletionConfirmation from "./LoadCompletionConfirmation";

// Mock driver ID for demo purposes
const MOCK_DRIVER_ID = "driver_123";

const DriverPWA: React.FC = () => {
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
  const [previousStatus, setPreviousStatus] = useState<
    "assigned" | "in_transit" | "at_pickup" | "at_delivery" | null
  >(null);
  const [tripDetails, setTripDetails] = useState<any>(null);
  const [showBolUpload, setShowBolUpload] = useState<boolean>(false);
  const [bolUploaded, setBolUploaded] = useState<boolean>(false);
  const [showCompletionConfirmation, setShowCompletionConfirmation] =
    useState<boolean>(false);
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean>(false);
  const [distanceToGeofence, setDistanceToGeofence] = useState<number>(10);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Handle PWA install prompt
  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPromptEvent(e);
    });

    // Check online status
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        toast({
          title: "You're back online",
          description: "All features are now available.",
        });
      } else {
        toast({
          title: "You're offline",
          description: "Some features may be limited until you reconnect.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, [toast]);

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

      // Set up continuous location tracking
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCurrentLocation(newLocation);

          // Check for geofence proximity (simplified calculation)
          if (tripDetails && tripStatus) {
            const targetCoords =
              tripStatus === "assigned" || tripStatus === "in_transit"
                ? tripDetails.pickup.coordinates
                : tripDetails.delivery.coordinates;

            if (targetCoords) {
              // Calculate distance (very simplified)
              const distance = calculateDistance(
                newLocation.latitude,
                newLocation.longitude,
                targetCoords.latitude,
                targetCoords.longitude,
              );

              setDistanceToGeofence(distance);

              // Check if within geofence (100 meters)
              const withinGeofence = distance < 0.1; // 0.1 miles

              if (withinGeofence && !isWithinGeofence) {
                // Just entered geofence
                setIsWithinGeofence(true);
                handleGeofenceEntry();
              } else if (!withinGeofence && isWithinGeofence) {
                // Just exited geofence
                setIsWithinGeofence(false);
              } else {
                setIsWithinGeofence(withinGeofence);
              }
            }
          }
        },
        (error) => {
          console.error("Error watching position:", error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 },
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [tripDetails, tripStatus]);

  useEffect(() => {
    // Check if there's an active trip in local storage
    const savedTripData = localStorage.getItem("driverActiveTrip");
    if (savedTripData) {
      try {
        const tripData = JSON.parse(savedTripData);
        setCurrentLoadId(tripData.loadId);
        setTripStatus(tripData.status);
        setPreviousStatus(tripData.status); // Initialize previous status
        setTripDetails(tripData.details);
        setActiveTab("trip");

        // Check if BOL was uploaded for this load
        const bolData = localStorage.getItem(`bol_${tripData.loadId}`);
        setBolUploaded(!!bolData);
      } catch (error) {
        console.error("Error parsing saved trip data:", error);
        localStorage.removeItem("driverActiveTrip");
      }
    }

    // Register service worker for PWA
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log(
              "ServiceWorker registration successful with scope: ",
              registration.scope,
            );
          })
          .catch((error) => {
            console.log("ServiceWorker registration failed: ", error);
          });
      });
    }
  }, []);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    // Simplified distance calculation (Haversine formula)
    const R = 3958.8; // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const handleGeofenceEntry = () => {
    if (!tripStatus || !currentLoadId) return;

    // Auto-update status based on current status and geofence entry
    if (tripStatus === "assigned" || tripStatus === "in_transit") {
      // Arrived at pickup
      setPreviousStatus(tripStatus);
      setTripStatus("at_pickup");

      // Update trip details
      if (tripDetails) {
        const updatedDetails = { ...tripDetails };
        updatedDetails.remainingDistance = tripDetails.distance * 0.5; // Halfway there
        setTripDetails(updatedDetails);

        // Save updated trip data to local storage
        localStorage.setItem(
          "driverActiveTrip",
          JSON.stringify({
            loadId: currentLoadId,
            status: "at_pickup",
            details: updatedDetails,
          }),
        );
      }

      // Show notification
      toast({
        title: "Arrived at Pickup",
        description:
          "You've entered the pickup location geofence. Status updated automatically.",
      });
    } else if (tripStatus === "at_pickup" || tripStatus === "in_transit") {
      // Arrived at delivery
      setPreviousStatus(tripStatus);
      setTripStatus("at_delivery");

      // Update trip details
      if (tripDetails) {
        const updatedDetails = { ...tripDetails };
        updatedDetails.remainingDistance = 0;
        setTripDetails(updatedDetails);

        // Save updated trip data to local storage
        localStorage.setItem(
          "driverActiveTrip",
          JSON.stringify({
            loadId: currentLoadId,
            status: "at_delivery",
            details: updatedDetails,
          }),
        );
      }

      // Show notification and BOL upload prompt
      toast({
        title: "Arrived at Delivery",
        description:
          "You've entered the delivery location geofence. Please upload the Bill of Lading.",
      });

      // Show BOL upload prompt
      setShowBolUpload(true);
    }
  };

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
    setPreviousStatus(null);
    setTripStatus("assigned");
    setActiveTab("trip");
    setBolUploaded(false);

    try {
      // Create trip details (simplified for demo)
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
      console.error("Error starting trip:", error);
    }
  };

  const handleUpdateTripStatus = async (
    newStatus: "in_transit" | "at_pickup" | "at_delivery" | "delivered",
  ) => {
    if (!currentLoadId || !tripDetails) return;

    // Update trip status
    if (newStatus === "delivered") {
      // Show completion confirmation
      setShowCompletionConfirmation(true);
    } else {
      setPreviousStatus(tripStatus);
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
        setShowBolUpload(true);
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

  const handleBolUploadComplete = () => {
    setBolUploaded(true);
    setShowBolUpload(false);
    setShowCompletionConfirmation(true);

    toast({
      title: "BOL Uploaded",
      description: "Bill of Lading has been successfully uploaded.",
    });
  };

  const handleCompletionConfirmed = () => {
    // Trip completed
    setCurrentLoadId(null);
    setTripStatus(null);
    setPreviousStatus(null);
    setTripDetails(null);
    setShowCompletionConfirmation(false);
    setBolUploaded(false);
    setActiveTab("loads");

    // Remove from local storage
    localStorage.removeItem("driverActiveTrip");

    toast({
      title: "Trip Completed",
      description: "You've successfully completed the delivery.",
    });
  };

  const handleNavigate = () => {
    setActiveTab("map");

    toast({
      title: "Navigation Started",
      description: "Turn-by-turn directions are now available on the map.",
    });
  };

  const handleInstallPwa = () => {
    if (installPromptEvent) {
      // Show the install prompt
      installPromptEvent.prompt();

      // Wait for the user to respond to the prompt
      installPromptEvent.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
          toast({
            title: "App Installing",
            description: "Thanks for installing our app!",
          });
        } else {
          console.log("User dismissed the install prompt");
        }
        // Clear the saved prompt since it can't be used again
        setInstallPromptEvent(null);
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white text-center py-1 px-4 text-sm">
          You're offline. Some features may be limited.
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold dark:text-white">Driver App</h1>
          </div>
          <div className="flex items-center space-x-4">
            {installPromptEvent && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={handleInstallPwa}
              >
                <Download className="h-4 w-4 mr-1" />
                Install App
              </Button>
            )}
            <div className="flex items-center space-x-1">
              <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {currentLocation
                  ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
                  : "Location unavailable"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {showBolUpload && currentLoadId ? (
          <div className="h-full p-4 overflow-auto">
            <BOLUploadPrompt
              loadId={currentLoadId}
              isDeliveryComplete={tripStatus === "at_delivery"}
              onUploadComplete={handleBolUploadComplete}
              onSkip={() => setShowBolUpload(false)}
            />
          </div>
        ) : showCompletionConfirmation && currentLoadId && tripDetails ? (
          <div className="h-full p-4 overflow-auto">
            <LoadCompletionConfirmation
              loadId={currentLoadId}
              deliveryLocation={tripDetails.delivery}
              bolUploaded={bolUploaded}
              onConfirm={handleCompletionConfirmed}
              onUploadBol={() => setShowBolUpload(true)}
            />
          </div>
        ) : (
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
                      <h2 className="text-xl font-bold mb-2 dark:text-white">
                        You have an active trip
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
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

              <TabsContent
                value="trip"
                className="h-full m-0 overflow-auto p-4"
              >
                {currentLoadId && tripStatus && tripDetails ? (
                  <div className="max-w-md mx-auto space-y-6">
                    <CurrentLoadStatusCard
                      loadId={currentLoadId}
                      status={tripStatus}
                      pickup={tripDetails.pickup}
                      delivery={tripDetails.delivery}
                      distance={tripDetails.distance}
                      remainingDistance={tripDetails.remainingDistance}
                      estimatedArrival={tripDetails.estimatedArrival}
                      currentLocation={currentLocation}
                    />

                    <GeofenceProximityIndicator
                      currentLocation={currentLocation}
                      nextGeofence={{
                        name:
                          tripStatus === "assigned" ||
                          tripStatus === "in_transit"
                            ? tripDetails.pickup.name
                            : tripDetails.delivery.name,
                        type:
                          tripStatus === "assigned" ||
                          tripStatus === "in_transit"
                            ? "pickup"
                            : "delivery",
                        radius: 100,
                        coordinates:
                          tripStatus === "assigned" ||
                          tripStatus === "in_transit"
                            ? tripDetails.pickup.coordinates
                            : tripDetails.delivery.coordinates,
                      }}
                      distanceToGeofence={distanceToGeofence}
                      isWithinGeofence={isWithinGeofence}
                    />

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
                      onUploadDocument={() => setShowBolUpload(true)}
                    />

                    <div className="mt-6">
                      <LocationUpdate />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-bold mb-2 dark:text-white">
                        No Active Trip
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
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
        )}
      </main>

      {/* Status change notification */}
      {tripStatus && previousStatus && tripStatus !== previousStatus && (
        <AutomaticStatusChangeNotification
          status={tripStatus}
          previousStatus={previousStatus}
          loadId={currentLoadId || undefined}
          locationName={
            isWithinGeofence
              ? tripStatus === "at_pickup"
                ? tripDetails?.pickup?.name
                : tripDetails?.delivery?.name
              : "current location"
          }
          onDismiss={() => setPreviousStatus(tripStatus)}
        />
      )}
    </div>
  );
};

export default DriverPWA;
