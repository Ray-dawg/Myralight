import React, { useState, useEffect, useRef } from "react";
import MapComponent from "@/components/shared/MapComponent";
import RouteMap from "@/components/shared/RouteMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Navigation,
  MapPin,
  AlertTriangle,
  Sparkles,
  CornerDownRight,
  Clock,
  Fuel,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { RouteOptimizationService } from "@/api/services/route-optimization.service";
import { WebSocketService } from "@/api/services/websocket.service";

interface DriverMapViewProps {
  driverId: string;
  loadId?: string;
  currentLocation?: { latitude: number; longitude: number };
  onLocationUpdate?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
}

const DriverMapView: React.FC<DriverMapViewProps> = ({
  driverId,
  loadId,
  currentLocation,
  onLocationUpdate,
}) => {
  const { toast } = useToast();
  const [route, setRoute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnByTurnInstructions, setTurnByTurnInstructions] = useState<any[]>(
    [],
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [weatherAlerts, setWeatherAlerts] = useState<any[]>([]);
  const [intelligentRouteAvailable, setIntelligentRouteAvailable] =
    useState<boolean>(false);
  const [intelligentRoute, setIntelligentRoute] = useState<any>(null);
  const [showIntelligentRoute, setShowIntelligentRoute] =
    useState<boolean>(false);
  const [intelligentRouteExpanded, setIntelligentRouteExpanded] =
    useState<boolean>(false);
  const [routeFeedbackGiven, setRouteFeedbackGiven] = useState<boolean>(false);

  const routeOptimizationService = useRef(new RouteOptimizationService());
  const webSocketService = useRef(WebSocketService.getInstance());

  // Default locations if none provided
  const defaultDriverLocation = { latitude: 41.8781, longitude: -87.6298 }; // Chicago
  const defaultPickupLocation = { latitude: 41.9, longitude: -87.65 }; // Near Chicago
  const defaultDeliveryLocation = { latitude: 42.0, longitude: -87.7 }; // Further from Chicago

  // Use current location or default
  const driverLocation = currentLocation || defaultDriverLocation;

  useEffect(() => {
    // Set up WebSocket for real-time location updates and alerts
    setupWebSocketListeners();

    // If we have a loadId, generate the route
    if (loadId) {
      generateRoute();
    }

    // Simulate location updates for demo purposes
    const locationUpdateInterval = setInterval(() => {
      simulateLocationUpdate();
    }, 10000); // Every 10 seconds

    // Simulate intelligent route generation after a delay
    if (loadId) {
      const intelligentRouteTimeout = setTimeout(() => {
        generateIntelligentRoute();
      }, 5000); // 5 seconds after component mounts

      return () => {
        clearInterval(locationUpdateInterval);
        clearTimeout(intelligentRouteTimeout);
        webSocketService.current.disconnect();
      };
    }

    return () => {
      clearInterval(locationUpdateInterval);
      webSocketService.current.disconnect();
    };
  }, [loadId, driverLocation]);

  const setupWebSocketListeners = () => {
    try {
      webSocketService.current.connect();

      // Listen for weather alerts
      webSocketService.current.onNotification(driverId, (notification) => {
        if (notification.type === "weather_alert") {
          setWeatherAlerts((prev) => [...prev, notification]);

          toast({
            title: "Weather Alert",
            description: notification.message,
            variant: "destructive",
          });
        }
      });

      // Listen for route updates
      webSocketService.current.onRouteUpdate(driverId, (routeUpdate) => {
        if (routeUpdate.loadId === loadId) {
          setRoute(routeUpdate);

          // Extract turn-by-turn instructions
          const instructions = [];
          if (routeUpdate.driverToPickup && routeUpdate.driverToPickup.legs) {
            routeUpdate.driverToPickup.legs.forEach((leg) => {
              leg.steps.forEach((step) => {
                instructions.push({
                  instruction: step.instruction,
                  distance: step.distance,
                  duration: step.duration,
                  location: step.location,
                });
              });
            });
          }

          if (
            routeUpdate.pickupToDelivery &&
            routeUpdate.pickupToDelivery.legs
          ) {
            routeUpdate.pickupToDelivery.legs.forEach((leg) => {
              leg.steps.forEach((step) => {
                instructions.push({
                  instruction: step.instruction,
                  distance: step.distance,
                  duration: step.duration,
                  location: step.location,
                });
              });
            });
          }

          setTurnByTurnInstructions(instructions);
        }
      });
    } catch (error) {
      console.error("Error setting up WebSocket listeners:", error);
    }
  };

  const generateRoute = async () => {
    if (!loadId) return;

    setIsLoading(true);
    setError(null);

    try {
      const routeResult =
        await routeOptimizationService.current.generateDriverToLoadRoute(
          driverId,
          loadId,
          {
            considerTraffic: true,
            includeAlternatives: true,
            vehicleType: "truck",
          },
        );

      setRoute(routeResult);

      // Extract turn-by-turn instructions
      const instructions = [];
      if (routeResult.driverToPickup && routeResult.driverToPickup.legs) {
        routeResult.driverToPickup.legs.forEach((leg) => {
          leg.steps.forEach((step) => {
            instructions.push({
              instruction: step.instruction,
              distance: step.distance,
              duration: step.duration,
              location: step.location,
            });
          });
        });
      }

      if (routeResult.pickupToDelivery && routeResult.pickupToDelivery.legs) {
        routeResult.pickupToDelivery.legs.forEach((leg) => {
          leg.steps.forEach((step) => {
            instructions.push({
              instruction: step.instruction,
              distance: step.distance,
              duration: step.duration,
              location: step.location,
            });
          });
        });
      }

      setTurnByTurnInstructions(instructions);
    } catch (err) {
      console.error("Error generating route:", err);
      setError(err instanceof Error ? err.message : "Failed to generate route");

      // Use mock data for demo
      const mockRoute = {
        driverId,
        loadId,
        driverToPickup: {
          distance: 8500,
          duration: 1200,
          geometry: {
            type: "LineString",
            coordinates: [
              [-87.6298, 41.8781], // Driver location
              [-87.65, 41.9], // Pickup location
            ],
          },
          legs: [
            {
              distance: 8500,
              duration: 1200,
              steps: [
                {
                  distance: 2000,
                  duration: 300,
                  instruction: "Head north on Michigan Ave",
                  location: [-87.625, 41.89],
                },
                {
                  distance: 3500,
                  duration: 500,
                  instruction: "Turn right onto Chicago Ave",
                  location: [-87.64, 41.895],
                },
                {
                  distance: 3000,
                  duration: 400,
                  instruction: "Continue onto North Ave",
                  location: [-87.65, 41.9],
                },
              ],
            },
          ],
        },
        pickupToDelivery: {
          distance: 12000,
          duration: 1800,
          geometry: {
            type: "LineString",
            coordinates: [
              [-87.65, 41.9], // Pickup location
              [-87.7, 42.0], // Delivery location
            ],
          },
          legs: [
            {
              distance: 12000,
              duration: 1800,
              steps: [
                {
                  distance: 4000,
                  duration: 600,
                  instruction: "Head northwest on North Ave",
                  location: [-87.67, 41.93],
                },
                {
                  distance: 5000,
                  duration: 700,
                  instruction: "Turn right onto Western Ave",
                  location: [-87.69, 41.96],
                },
                {
                  distance: 3000,
                  duration: 500,
                  instruction: "Continue onto Howard St",
                  location: [-87.7, 42.0],
                },
              ],
            },
          ],
        },
        totalDistance: 20500,
        totalDuration: 3000,
        pickupEta: new Date(Date.now() + 1200 * 1000),
        deliveryEta: new Date(Date.now() + 3000 * 1000),
        generatedAt: new Date(),
      };

      setRoute(mockRoute);

      // Extract turn-by-turn instructions from mock data
      const instructions = [];
      mockRoute.driverToPickup.legs.forEach((leg) => {
        leg.steps.forEach((step) => {
          instructions.push({
            instruction: step.instruction,
            distance: step.distance,
            duration: step.duration,
            location: step.location,
          });
        });
      });

      mockRoute.pickupToDelivery.legs.forEach((leg) => {
        leg.steps.forEach((step) => {
          instructions.push({
            instruction: step.instruction,
            distance: step.distance,
            duration: step.duration,
            location: step.location,
          });
        });
      });

      setTurnByTurnInstructions(instructions);
    } finally {
      setIsLoading(false);
    }
  };

  const generateIntelligentRoute = async () => {
    if (!loadId || !route) return;

    // In a real implementation, this would call the LLM service to generate an intelligent route
    // For this demo, we'll simulate a response after a short delay

    try {
      // Mock intelligent route data
      const mockIntelligentRoute = {
        optimizationSummary:
          "An alternative route using local roads can save approximately 18 minutes compared to the standard route due to construction and historical traffic patterns.",
        standardRoute:
          "I-90/94 to I-55, then local roads to destination (22 miles, estimated 45 minutes in current conditions)",
        optimizedRoute: [
          "From current location, continue south on Michigan Ave for 1.5 miles",
          "Turn right onto Roosevelt Rd and continue for 2 miles",
          "Turn left onto Ashland Ave (look for the hospital at this intersection)",
          "Follow Ashland Ave for 3 miles until it intersects with Cermak Rd",
          "Turn right onto Cermak Rd and continue for 2 miles",
          "Turn left onto Western Ave (just after the railroad crossing)",
          "Continue on Western Ave for 4 miles to reach your destination",
        ],
        benefits: [
          "Avoids major construction zone on I-55 between exits 290-294",
          "Bypasses historically congested areas during current time of day",
          "Uses roads frequently traveled by local delivery drivers with good results",
          "Includes roads with better traffic light timing during this time of day",
        ],
        reasoning:
          "Historical delivery data shows this route consistently outperforms the standard route between 2-5 PM on weekdays. Four previous deliveries using this route averaged 18 minutes faster than GPS-recommended routes. Additionally, two regular drivers for this route have provided positive feedback on this alternative.",
        timeSavings: 18,
        distanceImpact: 1.5,
        confidenceLevel: "Medium",
        confidenceExplanation:
          "Based on 4 recent deliveries and consistent driver feedback, plus current construction reports",
        visualGuidance: [
          "The turn onto Ashland Ave is immediately after a large hospital complex",
          "Railroad crossing on Cermak Rd has a flashing red light",
          "Western Ave has a distinctive green overpass about halfway along the route",
        ],
        potentialChallenges: [
          "School zone on Ashland Ave may have reduced speed limits between 2:30-4:00 PM",
          "The left turn onto Western Ave can be difficult during peak times - consider using the center turn lane",
        ],
        geometry: {
          type: "LineString",
          coordinates: [
            [-87.6298, 41.8781], // Start (current location)
            [-87.6298, 41.8681], // South on Michigan Ave
            [-87.6398, 41.8681], // Right onto Roosevelt
            [-87.6598, 41.8681], // Continue on Roosevelt
            [-87.6598, 41.8581], // Left onto Ashland
            [-87.6598, 41.8481], // Continue on Ashland
            [-87.6598, 41.8381], // Continue on Ashland
            [-87.6698, 41.8381], // Right onto Cermak
            [-87.6798, 41.8381], // Continue on Cermak
            [-87.6898, 41.8381], // Continue on Cermak
            [-87.6898, 41.8481], // Left onto Western
            [-87.6898, 41.8581], // Continue on Western
            [-87.6898, 41.8681], // Continue on Western
            [-87.6898, 41.8781], // Continue on Western
            [-87.7, 42.0], // Final destination
          ],
        },
      };

      setIntelligentRoute(mockIntelligentRoute);
      setIntelligentRouteAvailable(true);

      // Show a toast notification that an intelligent route is available
      toast({
        title: "AI-Enhanced Route Available",
        description:
          "A potentially faster route has been found based on historical data and current conditions.",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowIntelligentRoute(true)}
          >
            View
          </Button>
        ),
      });
    } catch (error) {
      console.error("Error generating intelligent route:", error);
    }
  };

  const handleRouteSwitch = () => {
    setShowIntelligentRoute(!showIntelligentRoute);
  };

  const handleRouteFeedback = (positive: boolean) => {
    // In a real implementation, this would send feedback to the server
    toast({
      title: positive
        ? "Positive Feedback Recorded"
        : "Negative Feedback Recorded",
      description: positive
        ? "Thank you! This helps improve future route suggestions."
        : "Thank you for your feedback. We'll improve our suggestions.",
    });

    setRouteFeedbackGiven(true);
  };

  const simulateLocationUpdate = () => {
    // For demo purposes, simulate the driver moving along the route
    if (
      turnByTurnInstructions.length > 0 &&
      currentStep < turnByTurnInstructions.length
    ) {
      const step = turnByTurnInstructions[currentStep];
      const newLocation = {
        latitude: step.location[1],
        longitude: step.location[0],
      };

      if (onLocationUpdate) {
        onLocationUpdate(newLocation);
      }

      setCurrentStep(currentStep + 1);

      // Simulate a weather alert occasionally
      if (Math.random() < 0.2) {
        // 20% chance
        const mockAlert = {
          type: "weather_alert",
          message: "Heavy rain expected ahead on your route",
          severity: "medium",
          location: newLocation,
        };

        setWeatherAlerts((prev) => [...prev, mockAlert]);

        toast({
          title: "Weather Alert",
          description: mockAlert.message,
          variant: "destructive",
        });
      }
    }
  };

  // Prepare map data
  const mapMarkers = [];
  const mapRoutes = [];

  // Add driver marker
  mapMarkers.push({
    id: "driver",
    latitude: driverLocation.latitude,
    longitude: driverLocation.longitude,
    color: "#3FB1CE",
    popupContent: "Current Location",
  });

  // Add route markers and path if route is available
  if (route) {
    // Add pickup marker
    if (route.driverToPickup && route.driverToPickup.geometry) {
      const pickupCoords =
        route.driverToPickup.geometry.coordinates[
          route.driverToPickup.geometry.coordinates.length - 1
        ];
      mapMarkers.push({
        id: "pickup",
        latitude: pickupCoords[1],
        longitude: pickupCoords[0],
        color: "#4CAF50",
        popupContent: "Pickup Location",
      });

      // Add driver to pickup route if not showing intelligent route
      if (!showIntelligentRoute || !intelligentRoute) {
        mapRoutes.push({
          id: "driver-to-pickup",
          coordinates: route.driverToPickup.geometry.coordinates.map(
            (coord) => [coord[0], coord[1]],
          ),
          color: "#3887be",
          width: 5,
        });
      }
    }

    // Add delivery marker
    if (route.pickupToDelivery && route.pickupToDelivery.geometry) {
      const deliveryCoords =
        route.pickupToDelivery.geometry.coordinates[
          route.pickupToDelivery.geometry.coordinates.length - 1
        ];
      mapMarkers.push({
        id: "delivery",
        latitude: deliveryCoords[1],
        longitude: deliveryCoords[0],
        color: "#F44336",
        popupContent: "Delivery Location",
      });

      // Add pickup to delivery route if not showing intelligent route
      if (!showIntelligentRoute || !intelligentRoute) {
        mapRoutes.push({
          id: "pickup-to-delivery",
          coordinates: route.pickupToDelivery.geometry.coordinates.map(
            (coord) => [coord[0], coord[1]],
          ),
          color: "#FF9800",
          width: 5,
        });
      }
    }

    // Add intelligent route if available and selected
    if (showIntelligentRoute && intelligentRoute && intelligentRoute.geometry) {
      mapRoutes.push({
        id: "intelligent-route",
        coordinates: intelligentRoute.geometry.coordinates.map((coord) => [
          coord[0],
          coord[1],
        ]),
        color: "#8A2BE2", // Purple color for AI route
        width: 5,
        dashArray: [2, 2], // Dashed line for visual distinction
      });
    }
  } else {
    // If no route, add default markers
    mapMarkers.push({
      id: "pickup",
      latitude: defaultPickupLocation.latitude,
      longitude: defaultPickupLocation.longitude,
      color: "#4CAF50",
      popupContent: "Pickup Location",
    });

    mapMarkers.push({
      id: "delivery",
      latitude: defaultDeliveryLocation.latitude,
      longitude: defaultDeliveryLocation.longitude,
      color: "#F44336",
      popupContent: "Delivery Location",
    });
  }

  // Add weather alert markers
  weatherAlerts.forEach((alert, index) => {
    if (alert.location) {
      mapMarkers.push({
        id: `weather-alert-${index}`,
        latitude: alert.location.latitude,
        longitude: alert.location.longitude,
        color: "#FFC107",
        popupContent: alert.message,
      });
    }
  });

  return (
    <div className="relative h-full w-full">
      {/* Map Component */}
      <MapComponent
        markers={mapMarkers}
        routes={mapRoutes}
        style={{ width: "100%", height: "100%" }}
      />

      {/* Intelligent Route Toggle */}
      {intelligentRouteAvailable && (
        <div className="absolute top-4 left-4 z-10">
          <Card
            className={`${showIntelligentRoute ? "bg-purple-50 border-purple-200" : "bg-white border-gray-200"}`}
          >
            <CardContent className="p-3">
              <div className="flex items-start space-x-2">
                <Sparkles
                  className={`h-5 w-5 ${showIntelligentRoute ? "text-purple-500" : "text-gray-500"} flex-shrink-0 mt-0.5`}
                />
                <div>
                  <div className="flex items-center">
                    <h3
                      className={`font-medium ${showIntelligentRoute ? "text-purple-800" : "text-gray-800"}`}
                    >
                      AI-Enhanced Route
                    </h3>
                    <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-200">
                      Save {intelligentRoute?.timeSavings || 0} min
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {showIntelligentRoute
                      ? "Using AI-optimized route based on historical data"
                      : "Standard route currently active"}
                  </p>
                  <div className="flex mt-2 space-x-2">
                    <Button
                      variant={showIntelligentRoute ? "default" : "outline"}
                      size="sm"
                      className={
                        showIntelligentRoute
                          ? "bg-purple-600 hover:bg-purple-700"
                          : ""
                      }
                      onClick={handleRouteSwitch}
                    >
                      {showIntelligentRoute ? "Using AI Route" : "Use AI Route"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setIntelligentRouteExpanded(!intelligentRouteExpanded)
                      }
                    >
                      {intelligentRouteExpanded
                        ? "Hide Details"
                        : "View Details"}
                    </Button>
                  </div>

                  {/* Expanded route details */}
                  {intelligentRouteExpanded && intelligentRoute && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium mb-1">
                        Why this route is better:
                      </h4>
                      <ul className="text-xs text-gray-600 space-y-1 mb-2">
                        {intelligentRoute.benefits.map(
                          (benefit: string, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <CornerDownRight className="h-3 w-3 mr-1 mt-0.5 text-purple-500" />
                              {benefit}
                            </li>
                          ),
                        )}
                      </ul>

                      <div className="flex space-x-4 text-xs text-gray-600 mb-2">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-purple-500" />
                          <span>Save {intelligentRoute.timeSavings} min</span>
                        </div>
                        <div className="flex items-center">
                          <Fuel className="h-3 w-3 mr-1 text-purple-500" />
                          <span>
                            {intelligentRoute.distanceImpact > 0 ? "+" : ""}
                            {intelligentRoute.distanceImpact} mi
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center mb-2">
                        <span className="text-xs font-medium mr-2">
                          Confidence:
                        </span>
                        <Badge
                          variant="outline"
                          className={`
                          ${intelligentRoute.confidenceLevel === "High" ? "bg-green-50 text-green-700 border-green-200" : ""}
                          ${intelligentRoute.confidenceLevel === "Medium" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : ""}
                          ${intelligentRoute.confidenceLevel === "Low" ? "bg-red-50 text-red-700 border-red-200" : ""}
                        `}
                        >
                          {intelligentRoute.confidenceLevel}
                        </Badge>
                      </div>

                      {!routeFeedbackGiven && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">
                            Was this route helpful?
                          </p>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleRouteFeedback(true)}
                            >
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Yes
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleRouteFeedback(false)}
                            >
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              No
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Turn-by-Turn Instructions */}
      {showInstructions && (
        <div className="absolute bottom-4 left-4 right-4 z-10 max-h-60 overflow-y-auto rounded-lg bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Turn-by-Turn Instructions</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstructions(false)}
            >
              Close
            </Button>
          </div>
          <div className="space-y-2">
            {turnByTurnInstructions.map((instruction, index) => (
              <div
                key={index}
                className={`flex items-start p-2 rounded ${index === currentStep ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
              >
                <div className="flex-shrink-0 mr-2">
                  {index < currentStep ? (
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      ✓
                    </div>
                  ) : index === currentStep ? (
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {index + 1}
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      {index + 1}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium">{instruction.instruction}</p>
                  <p className="text-sm text-gray-500">
                    {(instruction.distance / 1000).toFixed(1)} km •{" "}
                    {Math.round(instruction.duration / 60)} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          <Navigation className="h-4 w-4 mr-2" />
          {showInstructions ? "Hide" : "Show"} Directions
        </Button>
        {weatherAlerts.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() =>
              toast({
                title: "Weather Alerts",
                description: weatherAlerts[weatherAlerts.length - 1].message,
                variant: "destructive",
              })
            }
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {weatherAlerts.length} Weather Alert
            {weatherAlerts.length > 1 ? "s" : ""}
          </Button>
        )}
      </div>
    </div>
  );
};

export default DriverMapView;
