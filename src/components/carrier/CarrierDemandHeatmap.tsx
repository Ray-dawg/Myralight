import React, { useState, useEffect, useCallback, useRef } from "react";
// Add this CSS to your component or in a global stylesheet
// This adds a subtle flash effect when new data arrives
const flashStyle = document.createElement("style");
flashStyle.textContent = `
  .heatmap-update-flash {
    animation: flash-update 0.5s ease-out;
  }
  
  @keyframes flash-update {
    0% { filter: brightness(1); }
    50% { filter: brightness(1.2); }
    100% { filter: brightness(1); }
  }
`;
document.head.appendChild(flashStyle);

import { useQuery, useMutation } from "convex/react";
import { api } from "../../lib/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  MapPinIcon,
  TruckIcon,
  ArrowRightIcon,
  Search,
  CalendarIcon,
  RefreshCwIcon,
  ZoomInIcon,
  AlertTriangleIcon,
  ChevronUpIcon,
  BarChart3Icon,
  ClockIcon,
  DollarSignIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  TargetIcon,
  TrendingUpIcon,
  CompassIcon,
  WifiIcon,
  WifiOffIcon,
  BellIcon,
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
} from "../../lib/mapbox";

// Set Mapbox token
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

interface HeatmapFilters {
  timeframe: string;
  year: number;
  month?: number;
  day?: number;
  region?: string;
  equipmentType?: string;
  searchQuery?: string;
}

interface FleetPosition {
  id: string;
  truckId: string;
  driverId?: string;
  equipmentType: string;
  latitude: number;
  longitude: number;
  status: "available" | "en-route" | "loading" | "unloading" | "out-of-service";
  nextAvailableTime?: number;
  currentLoad?: string;
  lastUpdated: number;
}

interface FleetRecommendation {
  id: string;
  regionName: string;
  cityName?: string;
  coordinates: [number, number];
  score: number;
  potentialLoads: number;
  avgRate: number;
  urgencyScore: number;
  distanceFromCurrentPosition?: number;
  estimatedTravelTime?: number;
  equipmentMatch: number; // 0-1 score of how well the equipment matches demand
  reasonCodes: string[];
  suggestedAction: "reposition" | "stay" | "accept-load";
}

// Import the notification system
import DemandNotificationSystem from "./DemandNotificationSystem";

const CarrierDemandHeatmap: React.FC = () => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [activeTab, setActiveTab] = useState("map");
  const [expandedPanel, setExpandedPanel] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const updateCountRef = useRef(0);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<FleetRecommendation | null>(null);
  const [heatmapFilters, setHeatmapFilters] = useState<HeatmapFilters>({
    timeframe: "daily",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    equipmentType: "Dry Van", // Default equipment type
    searchQuery: "",
  });

  // Equipment types
  const equipmentTypes = [
    "Dry Van",
    "Reefer",
    "Flatbed",
    "Tanker",
    "Step Deck",
  ];

  // Time periods
  const timePeriods = [
    { label: "Today", value: "daily" },
    { label: "This Week", value: "weekly" },
    { label: "This Month", value: "monthly" },
  ];

  // Get heatmap data from Convex
  const heatmapData = useQuery(api.loadDemand.getHeatmapData, heatmapFilters);

  // Subscribe to real-time heatmap updates
  const heatmapUpdates = useQuery(api.loadDemand.subscribeToHeatmapUpdates, {
    regions: heatmapFilters.region ? [heatmapFilters.region] : undefined,
    timeframe: heatmapFilters.timeframe,
    equipmentType: heatmapFilters.equipmentType,
  });

  // Filter heatmap data based on search query
  const filteredHeatmapData = React.useMemo(() => {
    if (!heatmapData) return null;

    if (!heatmapFilters.searchQuery) return heatmapData;

    const query = heatmapFilters.searchQuery.toLowerCase().trim();

    return heatmapData.filter((item) => {
      const region = (item.region || item.regionId || "").toLowerCase();
      const cityName = (item.cityName || "").toLowerCase();
      const zipCode = (item.zipCode || "").toLowerCase();

      return (
        region.includes(query) ||
        cityName.includes(query) ||
        zipCode.includes(query)
      );
    });
  }, [heatmapData, heatmapFilters.searchQuery]);

  // Get top demand regions
  const topDemandRegions = React.useMemo(() => {
    if (!filteredHeatmapData) return [];

    return filteredHeatmapData
      .sort(
        (a, b) =>
          (b.totalLoads || b.loadCount || 0) -
          (a.totalLoads || a.loadCount || 0),
      )
      .slice(0, 5)
      .map((item) => ({
        region: item.region || item.regionId || "Unknown",
        cityName: item.cityName || "",
        loadCount: item.totalLoads || item.loadCount || 0,
        avgRate: item.avgRate || 0,
        urgencyScore: item.avgUrgencyScore || 0,
        coordinates: [item.longitude || 0, item.latitude || 0] as [
          number,
          number,
        ],
      }));
  }, [filteredHeatmapData]);

  // Mock fleet positions - in a real app, this would come from a fleet management system
  const fleetPositions = React.useMemo(() => {
    return [
      {
        id: "fp-1",
        truckId: "truck-101",
        driverId: "driver-201",
        equipmentType: "Dry Van",
        latitude: 39.7392,
        longitude: -104.9903, // Denver
        status: "available",
        lastUpdated: Date.now() - 1000 * 60 * 15, // 15 minutes ago
      },
      {
        id: "fp-2",
        truckId: "truck-102",
        driverId: "driver-202",
        equipmentType: "Reefer",
        latitude: 33.4484,
        longitude: -112.074, // Phoenix
        status: "available",
        lastUpdated: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      },
      {
        id: "fp-3",
        truckId: "truck-103",
        driverId: "driver-203",
        equipmentType: "Flatbed",
        latitude: 32.7767,
        longitude: -96.797, // Dallas
        status: "en-route",
        currentLoad: "load-301",
        lastUpdated: Date.now() - 1000 * 60 * 5, // 5 minutes ago
      },
      {
        id: "fp-4",
        truckId: "truck-104",
        driverId: "driver-204",
        equipmentType: "Dry Van",
        latitude: 41.8781,
        longitude: -87.6298, // Chicago
        status: "available",
        lastUpdated: Date.now() - 1000 * 60 * 10, // 10 minutes ago
      },
      {
        id: "fp-5",
        truckId: "truck-105",
        driverId: "driver-205",
        equipmentType: "Tanker",
        latitude: 29.7604,
        longitude: -95.3698, // Houston
        status: "available",
        lastUpdated: Date.now() - 1000 * 60 * 20, // 20 minutes ago
      },
    ] as FleetPosition[];
  }, []);

  // Generate fleet positioning recommendations based on demand data and fleet positions
  const fleetRecommendations = React.useMemo(() => {
    if (!filteredHeatmapData || filteredHeatmapData.length === 0) return [];

    // Get available trucks
    const availableTrucks = fleetPositions.filter(
      (truck) => truck.status === "available",
    );
    if (availableTrucks.length === 0) return [];

    // Find high demand regions
    const highDemandRegions = filteredHeatmapData
      .filter((point) => {
        // Filter for regions with significant demand
        const loadCount = point.totalLoads || point.loadCount || 0;
        const urgencyScore = point.avgUrgencyScore || 0;
        return loadCount > 5 && urgencyScore > 5; // Threshold for consideration
      })
      .map((point) => ({
        regionName: point.region || point.regionId || "Unknown",
        cityName: point.cityName || "",
        coordinates: [point.longitude || 0, point.latitude || 0] as [
          number,
          number,
        ],
        loadCount: point.totalLoads || point.loadCount || 0,
        avgRate: point.avgRate || 0,
        urgencyScore: point.avgUrgencyScore || 0,
        equipmentTypes: point.equipmentBreakdown || {},
        marketDemandScore: point.avgMarketDemandScore || 0,
      }));

    // Calculate recommendations for each available truck
    const recommendations: FleetRecommendation[] = [];

    availableTrucks.forEach((truck) => {
      highDemandRegions.forEach((region) => {
        // Calculate distance from truck to region
        const distance = calculateDistance(
          truck.latitude,
          truck.longitude,
          region.coordinates[1],
          region.coordinates[0],
        );

        // Calculate estimated travel time (hours) based on average speed of 55mph
        const estimatedTravelTime = distance / 55;

        // Calculate equipment match score
        const equipmentMatch = calculateEquipmentMatchScore(
          truck.equipmentType,
          region.equipmentTypes,
        );

        // Calculate overall score based on multiple factors
        // Higher score = better recommendation
        let score = 0;
        score += (region.loadCount / 10) * 0.3; // Load count factor (30% weight)
        score += (region.avgRate / 1000) * 0.25; // Rate factor (25% weight)
        score += (region.urgencyScore / 10) * 0.2; // Urgency factor (20% weight)
        score += equipmentMatch * 0.15; // Equipment match factor (15% weight)
        score -= (Math.min(distance, 500) / 500) * 0.1; // Distance penalty (10% weight, capped at 500 miles)

        // Generate reason codes
        const reasonCodes: string[] = [];
        if (region.loadCount > 20) reasonCodes.push("HIGH_VOLUME");
        if (region.avgRate > 3000) reasonCodes.push("HIGH_RATE");
        if (region.urgencyScore > 7) reasonCodes.push("URGENT_DEMAND");
        if (equipmentMatch > 0.8) reasonCodes.push("EQUIPMENT_MATCH");
        if (distance < 200) reasonCodes.push("PROXIMITY");
        if (region.marketDemandScore > 7) reasonCodes.push("STRONG_MARKET");

        // Determine suggested action
        let suggestedAction: "reposition" | "stay" | "accept-load" =
          "reposition";
        if (distance < 50) {
          suggestedAction = "stay";
        } else if (region.loadCount > 15 && region.urgencyScore > 8) {
          suggestedAction = "accept-load";
        }

        recommendations.push({
          id: `rec-${truck.id}-${region.regionName.replace(/\s+/g, "-").toLowerCase()}`,
          regionName: region.regionName,
          cityName: region.cityName,
          coordinates: region.coordinates,
          score,
          potentialLoads: region.loadCount,
          avgRate: region.avgRate,
          urgencyScore: region.urgencyScore,
          distanceFromCurrentPosition: distance,
          estimatedTravelTime,
          equipmentMatch,
          reasonCodes,
          suggestedAction,
        });
      });
    });

    // Sort by score (descending) and take top 10
    return recommendations.sort((a, b) => b.score - a.score).slice(0, 10);
  }, [filteredHeatmapData, fleetPositions]);

  // Helper function to calculate distance between two points using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 0.621371; // Convert to miles
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  // Helper function to calculate equipment match score
  const calculateEquipmentMatchScore = (
    truckEquipment: string,
    regionEquipmentTypes: Record<string, number>,
  ): number => {
    if (!regionEquipmentTypes || Object.keys(regionEquipmentTypes).length === 0)
      return 0.5; // Default if no data

    // Check if the truck's equipment type is in high demand
    const totalDemand = Object.values(regionEquipmentTypes).reduce(
      (sum, count) => sum + count,
      0,
    );
    const equipmentDemand = regionEquipmentTypes[truckEquipment] || 0;

    if (totalDemand === 0) return 0.5; // Default if no demand data

    return Math.min(1, equipmentDemand / (totalDemand * 0.5)); // Scale so that having 50% of demand = score of 1
  };

  // Initialize map
  useEffect(() => {
    if (!map && activeTab === "map") {
      const mapContainer = document.getElementById("carrier-map");
      if (!mapContainer) return;

      try {
        const mapInstance = new mapboxgl.Map({
          container: "carrier-map",
          style: MAPBOX_STYLE,
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          attributionControl: true,
        });

        // Add navigation controls
        mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");

        mapInstance.on("load", () => {
          // Add heatmap source
          mapInstance.addSource("demand-data", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [],
            },
          });

          // Add heatmap layer
          mapInstance.addLayer({
            id: "demand-heat",
            type: "heatmap",
            source: "demand-data",
            paint: {
              // Weight based on data point intensity
              "heatmap-weight": [
                "interpolate",
                ["linear"],
                ["get", "weight"],
                0,
                0,
                0.5,
                0.5,
                1,
                1,
              ],
              // Intensity varies with zoom level
              "heatmap-intensity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                0.6,
                9,
                1.2,
                15,
                2,
              ],
              // Color gradient optimized for colorblind users (blue-yellow-red scheme)
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0,
                "rgba(65,105,225,0)",
                0.1,
                "rgba(65,105,225,0.5)",
                0.3,
                "rgb(135,206,250)",
                0.5,
                "rgb(240,230,140)",
                0.7,
                "rgb(255,165,0)",
                0.9,
                "rgb(255,69,0)",
                1,
                "rgb(178,34,34)",
              ],
              // Radius varies with zoom
              "heatmap-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                10,
                8,
                15,
                12,
                25,
                16,
                30,
              ],
              // Opacity varies with zoom
              "heatmap-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                5,
                0.7,
                10,
                0.8,
                15,
                0.9,
              ],
            },
          });

          // Add circle layer for points
          mapInstance.addLayer({
            id: "demand-points",
            type: "circle",
            source: "demand-data",
            paint: {
              // Dynamic radius based on load count
              "circle-radius": [
                "interpolate",
                ["exponential", 1.5],
                ["get", "count"],
                1,
                4,
                10,
                8,
                50,
                15,
                100,
                22,
                500,
                30,
              ],
              // Color encoding based on rate
              "circle-color": [
                "interpolate",
                ["linear"],
                ["get", "avgRate"],
                500,
                "#2c7bb6",
                1500,
                "#81b9df",
                3000,
                "#ffffbf",
                5000,
                "#fdae61",
                7500,
                "#d7191c",
              ],
              "circle-opacity": 0.8,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#ffffff",
            },
          });

          // Add popup on hover
          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
          });

          mapInstance.on("mouseenter", "demand-points", (e) => {
            mapInstance.getCanvas().style.cursor = "pointer";

            const coordinates = e.features[0].geometry.coordinates.slice();
            const count = e.features[0].properties.count;
            const avgRate = e.features[0].properties.avgRate;
            const region = e.features[0].properties.region || "";
            const urgencyScore = e.features[0].properties.urgencyScore || 0;

            const urgencyColor =
              urgencyScore > 7
                ? "#d7191c"
                : urgencyScore > 4
                  ? "#fdae61"
                  : "#2c7bb6";

            const html = `
              <div style="font-family: system-ui, -apple-system, sans-serif; padding: 12px; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 280px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px;">${region}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                  <div style="display: flex; align-items: center;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: #2c7bb6; margin-right: 6px;"></span>
                    <strong>Loads:</strong> ${count}
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: #81b9df; margin-right: 6px;"></span>
                    <strong>Avg Rate:</strong> $${avgRate.toFixed(2)}
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${urgencyColor}; margin-right: 6px;"></span>
                    <strong>Urgency:</strong> <span style="color: ${urgencyColor}; font-weight: bold;">${urgencyScore.toFixed(1)}/10</span>
                  </div>
                </div>
              </div>
            `;

            popup.setLngLat(coordinates).setHTML(html).addTo(mapInstance);
          });

          mapInstance.on("mouseleave", "demand-points", () => {
            mapInstance.getCanvas().style.cursor = "";
            popup.remove();
          });

          // Add click event to select region
          mapInstance.on("click", "demand-points", (e) => {
            const region = e.features[0].properties.region || "";
            setSelectedRegion(region);
          });
        });

        setMap(mapInstance);
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    }

    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, [activeTab, map]);

  // Update map data when heatmap data changes or real-time updates are received
  useEffect(() => {
    if (!map || !filteredHeatmapData || activeTab !== "map") return;

    if (!map.getSource("demand-data")) {
      const checkSource = () => {
        if (map.getSource("demand-data")) {
          updateHeatmapData();
        } else if (map.loaded()) {
          console.warn("Map is loaded but demand-data source doesn't exist");
        } else {
          setTimeout(checkSource, 100);
        }
      };
      checkSource();
      return;
    }

    updateHeatmapData();

    // Process real-time updates if enabled
    if (isRealTimeEnabled && heatmapUpdates && heatmapUpdates.length > 0) {
      const lastUpdateTimestamp =
        localStorage.getItem("lastHeatmapUpdate") || "0";
      const latestUpdate = heatmapUpdates[0];

      if (latestUpdate.timestamp > parseInt(lastUpdateTimestamp)) {
        // Store the latest update timestamp
        localStorage.setItem(
          "lastHeatmapUpdate",
          latestUpdate.timestamp.toString(),
        );

        // Update the last update time for display
        setLastUpdateTime(new Date());

        // Increment the update counter
        updateCountRef.current += 1;

        // Add a visual indicator for the update
        if (map && map.getSource("demand-data")) {
          // Add a brief flash effect to the map to indicate new data
          const mapCanvas = map.getCanvas();
          mapCanvas.classList.add("heatmap-update-flash");
          setTimeout(() => {
            mapCanvas.classList.remove("heatmap-update-flash");
          }, 500);
        }
      }
    }

    function updateHeatmapData() {
      try {
        // Convert data to GeoJSON format
        const features = filteredHeatmapData.map((point) => {
          const rawWeight = point.totalLoads || point.loadCount || 1;
          const logWeight = Math.log(rawWeight + 1) / Math.log(100);
          const urgencyFactor = (point.avgUrgencyScore || 0) / 10;
          const normalizedWeight = Math.min(
            1,
            logWeight * 0.7 + urgencyFactor * 0.3,
          );

          return {
            type: "Feature",
            properties: {
              weight: normalizedWeight,
              count: point.totalLoads || point.loadCount || 1,
              avgRate: point.avgRate || 0,
              region: point.region || point.regionId || "",
              urgencyScore: point.avgUrgencyScore || 0,
            },
            geometry: {
              type: "Point",
              coordinates: [point.longitude || 0, point.latitude || 0],
            },
          };
        });

        // Update the source data
        const source = map.getSource("demand-data") as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData({
            type: "FeatureCollection",
            features,
          });
        }

        // Fit bounds to data if there are points
        if (features.length > 0 && !map.isMoving()) {
          const bounds = new mapboxgl.LngLatBounds();
          features.forEach((feature) => {
            bounds.extend(feature.geometry.coordinates as [number, number]);
          });
          map.fitBounds(bounds, { padding: 50, maxZoom: 10 });
        }
      } catch (error) {
        console.error("Error updating heatmap data:", error);
      }
    }
  }, [map, filteredHeatmapData, activeTab, heatmapUpdates]);

  // Add fleet positions and recommendations to map
  useEffect(() => {
    if (!map || activeTab !== "map") return;

    // Wait for map to be ready
    if (!map.loaded()) {
      const checkLoaded = () => {
        if (map.loaded()) {
          addFleetMarkersToMap();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    addFleetMarkersToMap();

    function addFleetMarkersToMap() {
      try {
        // Remove existing markers if any
        const existingMarkers = document.querySelectorAll(
          ".fleet-marker, .recommendation-marker",
        );
        existingMarkers.forEach((marker) => marker.remove());

        // Add fleet position markers
        fleetPositions.forEach((position) => {
          if (position.status === "available") {
            const markerElement = document.createElement("div");
            markerElement.className = "fleet-marker";
            markerElement.innerHTML = `
              <div style="background-color: #3b82f6; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
              </div>
            `;

            const marker = new mapboxgl.Marker(markerElement)
              .setLngLat([position.longitude, position.latitude])
              .setPopup(
                new mapboxgl.Popup({ offset: 25 }).setHTML(`
                    <div style="font-family: system-ui, -apple-system, sans-serif; padding: 12px; max-width: 240px;">
                      <h3 style="margin: 0 0 8px 0; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Truck ${position.truckId}</h3>
                      <div style="font-size: 14px;">
                        <p style="margin: 4px 0;"><strong>Status:</strong> Available</p>
                        <p style="margin: 4px 0;"><strong>Equipment:</strong> ${position.equipmentType}</p>
                        <p style="margin: 4px 0;"><strong>Last Updated:</strong> ${new Date(position.lastUpdated).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  `),
              )
              .addTo(map);
          }
        });

        // Add recommendation markers if recommendations are shown
        if (showRecommendations && fleetRecommendations.length > 0) {
          fleetRecommendations.slice(0, 3).forEach((recommendation, index) => {
            const markerElement = document.createElement("div");
            markerElement.className = "recommendation-marker";
            markerElement.innerHTML = `
              <div style="background-color: #10b981; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                <span style="font-weight: bold; font-size: 16px;">${index + 1}</span>
              </div>
            `;

            const marker = new mapboxgl.Marker(markerElement)
              .setLngLat(recommendation.coordinates)
              .setPopup(
                new mapboxgl.Popup({ offset: 25 }).setHTML(`
                    <div style="font-family: system-ui, -apple-system, sans-serif; padding: 12px; max-width: 240px;">
                      <h3 style="margin: 0 0 8px 0; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px;">${recommendation.regionName}</h3>
                      <div style="font-size: 14px;">
                        <p style="margin: 4px 0;"><strong>Potential Loads:</strong> ${recommendation.potentialLoads}</p>
                        <p style="margin: 4px 0;"><strong>Avg Rate:</strong> $${recommendation.avgRate.toFixed(2)}</p>
                        <p style="margin: 4px 0;"><strong>Distance:</strong> ${recommendation.distanceFromCurrentPosition} miles</p>
                        <p style="margin: 4px 0;"><strong>Travel Time:</strong> ~${Math.round(recommendation.estimatedTravelTime || 0)} hours</p>
                      </div>
                    </div>
                  `),
              )
              .addTo(map);

            // Add click handler to select this recommendation
            markerElement.addEventListener("click", () => {
              setSelectedRecommendation(recommendation);
            });
          });
        }
      } catch (error) {
        console.error("Error adding fleet markers to map:", error);
      }
    }
  }, [
    map,
    activeTab,
    fleetPositions,
    fleetRecommendations,
    showRecommendations,
  ]);

  // Handle filter changes
  const handleFilterChange = (key: keyof HeatmapFilters, value: any) => {
    setHeatmapFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange("searchQuery", e.target.value);
  };

  // Focus on a specific region
  const focusOnRegion = (coordinates: [number, number]) => {
    if (!map) return;

    map.flyTo({
      center: coordinates,
      zoom: 8,
      essential: true,
    });
  };

  // Focus on a specific recommendation
  const focusOnRecommendation = (recommendation: FleetRecommendation) => {
    if (!map) return;

    setSelectedRecommendation(recommendation);

    map.flyTo({
      center: recommendation.coordinates,
      zoom: 9,
      essential: true,
    });
  };

  // Reset map view
  const resetMapView = () => {
    if (!map) return;

    map.flyTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      essential: true,
    });

    setSelectedRegion(null);
  };

  // Calculate total loads and average rate
  const totalLoads = React.useMemo(() => {
    if (!filteredHeatmapData) return 0;
    return filteredHeatmapData.reduce(
      (sum, item) => sum + (item.totalLoads || item.loadCount || 0),
      0,
    );
  }, [filteredHeatmapData]);

  const averageRate = React.useMemo(() => {
    if (!filteredHeatmapData || filteredHeatmapData.length === 0) return 0;
    const total = filteredHeatmapData.reduce(
      (sum, item) => sum + (item.avgRate || 0),
      0,
    );
    return total / filteredHeatmapData.length;
  }, [filteredHeatmapData]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <MapPinIcon className="h-5 w-5 mr-2 text-primary" />
          <h1 className="text-xl font-bold">Load Demand Map</h1>
        </div>

        <div className="flex items-center space-x-2">
          {/* Add the notification system */}
          <DemandNotificationSystem />
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by region, city..."
              className="w-[200px] pl-8"
              value={heatmapFilters.searchQuery || ""}
              onChange={handleSearchChange}
              aria-label="Search demand data"
            />
          </div>

          <Select
            value={heatmapFilters.timeframe}
            onValueChange={(value) => handleFilterChange("timeframe", value)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              {timePeriods.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={heatmapFilters.equipmentType || ""}
            onValueChange={(value) =>
              handleFilterChange("equipmentType", value)
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Equipment" />
            </SelectTrigger>
            <SelectContent>
              {equipmentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={resetMapView}>
            <RefreshCwIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            className={isRealTimeEnabled ? "bg-green-50" : ""}
            title={
              isRealTimeEnabled
                ? "Real-time updates enabled"
                : "Real-time updates disabled"
            }
          >
            {isRealTimeEnabled ? (
              <WifiIcon className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOffIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>

          {lastUpdateTime && (
            <Badge variant="outline" className="flex items-center gap-1">
              <BellIcon className="h-3 w-3" />
              <span className="text-xs">
                Updated {lastUpdateTime.toLocaleTimeString()}
              </span>
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="absolute top-4 left-4 z-10"
          >
            <TabsList className="bg-background/90 backdrop-blur-sm">
              <TabsTrigger value="map">Heatmap</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
          </Tabs>

          <TabsContent value="map" className="h-full m-0 p-0">
            <div
              id="carrier-map"
              className="h-full w-full"
              aria-label="Demand heatmap visualization"
            >
              {!filteredHeatmapData && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                    <p>Loading map data...</p>
                  </div>
                </div>
              )}
              {filteredHeatmapData && filteredHeatmapData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="flex flex-col items-center">
                    <AlertTriangleIcon className="h-8 w-8 text-yellow-500 mb-2" />
                    <p>No data available for the selected filters</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="list" className="h-full m-0 p-4 overflow-auto">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topDemandRegions.map((region, index) => (
                  <Card
                    key={index}
                    className={
                      selectedRegion === region.region ? "border-primary" : ""
                    }
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{region.region}</CardTitle>
                      <CardDescription>
                        {region.cityName || "Various cities"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Load Count
                          </p>
                          <p className="text-xl font-bold">
                            {region.loadCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Avg Rate
                          </p>
                          <p className="text-xl font-bold">
                            ${region.avgRate.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => focusOnRegion(region.coordinates)}
                      >
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        View on Map
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {topDemandRegions.length === 0 && (
                <div className="text-center py-8">
                  <AlertTriangleIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p>No regions found with the current filters</p>
                </div>
              )}
            </div>
          </TabsContent>
        </div>

        <div
          className={`border-l bg-card transition-all duration-300 ${expandedPanel ? "w-80" : "w-12"}`}
        >
          <div className="p-4 border-b flex items-center justify-between">
            {expandedPanel ? (
              <h2 className="font-semibold">Top Demand Areas</h2>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpandedPanel(!expandedPanel)}
              className="ml-auto"
            >
              <ChevronUpIcon
                className={`h-4 w-4 transition-transform ${expandedPanel ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          {expandedPanel && (
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Market Summary</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {timePeriods.find(
                        (p) => p.value === heatmapFilters.timeframe,
                      )?.label || "Today"}
                    </Badge>
                    {isRealTimeEnabled && (
                      <Badge
                        variant="outline"
                        className="flex items-center bg-green-50"
                      >
                        <WifiIcon className="h-3 w-3 mr-1 text-green-600" />
                        <span className="text-xs text-green-600">Live</span>
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Loads</p>
                    <p className="text-2xl font-bold">{totalLoads}</p>
                    {updateCountRef.current > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        +{updateCountRef.current} new
                      </p>
                    )}
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Avg Rate</p>
                    <p className="text-2xl font-bold">
                      ${averageRate.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Top Demand Regions</h3>
                  {lastUpdateTime && (
                    <p className="text-xs text-muted-foreground">
                      Updated {lastUpdateTime.toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <div className="space-y-3 relative">
                  {isRealTimeEnabled && (
                    <div className="absolute -right-2 -top-2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  )}
                  {topDemandRegions.map((region, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted/50 ${selectedRegion === region.region ? "bg-muted" : ""}`}
                      onClick={() => focusOnRegion(region.coordinates)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <MapPinIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{region.region}</p>
                          <p className="text-xs text-muted-foreground">
                            {region.loadCount} loads
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          region.urgencyScore > 7
                            ? "destructive"
                            : region.urgencyScore > 4
                              ? "default"
                              : "secondary"
                        }
                      >
                        {region.urgencyScore.toFixed(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {!showRecommendations ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Actions</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      className="w-full"
                      onClick={() => setShowRecommendations(true)}
                    >
                      <TruckIcon className="h-4 w-4 mr-2" />
                      Show Fleet Recommendations
                    </Button>
                    <Button variant="outline" className="w-full">
                      <ArrowRightIcon className="h-4 w-4 mr-2" />
                      View Load Board
                    </Button>
                    <Button
                      variant={isRealTimeEnabled ? "outline" : "default"}
                      className="w-full"
                      onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                    >
                      {isRealTimeEnabled ? (
                        <>
                          <WifiOffIcon className="h-4 w-4 mr-2" />
                          Disable Real-time Updates
                        </>
                      ) : (
                        <>
                          <WifiIcon className="h-4 w-4 mr-2" />
                          Enable Real-time Updates
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">
                      Fleet Recommendations
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRecommendations(false)}
                      className="h-8 px-2"
                    >
                      Hide
                    </Button>
                  </div>

                  {fleetRecommendations.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {fleetRecommendations
                        .slice(0, 5)
                        .map((recommendation, index) => (
                          <Card
                            key={recommendation.id}
                            className={`overflow-hidden ${selectedRecommendation?.id === recommendation.id ? "border-primary" : ""}`}
                          >
                            <div className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-2">
                                    <span className="font-bold text-emerald-600">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm">
                                      {recommendation.regionName}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      {recommendation.cityName ||
                                        "Various cities"}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant={
                                    recommendation.score > 0.7
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  Score:{" "}
                                  {(recommendation.score * 10).toFixed(1)}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                <div className="flex items-center">
                                  <TruckIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                                  <span>
                                    {recommendation.potentialLoads} loads
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <DollarSignIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                                  <span>
                                    ${recommendation.avgRate.toFixed(0)}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <MapPinIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                                  <span>
                                    {recommendation.distanceFromCurrentPosition}{" "}
                                    mi
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <ClockIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                                  <span>
                                    ~
                                    {Math.round(
                                      recommendation.estimatedTravelTime || 0,
                                    )}
                                    h
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1 mb-2">
                                {recommendation.reasonCodes
                                  .slice(0, 3)
                                  .map((code) => (
                                    <Badge
                                      key={code}
                                      variant="outline"
                                      className="text-xs py-0 h-5"
                                    >
                                      {code.replace("_", " ")}
                                    </Badge>
                                  ))}
                              </div>

                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="w-full h-8 text-xs"
                                  onClick={() =>
                                    focusOnRecommendation(recommendation)
                                  }
                                >
                                  <TargetIcon className="h-3 w-3 mr-1" />
                                  View on Map
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-muted/50 rounded-lg">
                      <AlertCircleIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No recommendations available
                      </p>
                      {isRealTimeEnabled && (
                        <p className="text-xs text-green-600 mt-2">
                          <WifiIcon className="h-3 w-3 inline mr-1" />
                          Waiting for real-time updates...
                        </p>
                      )}
                    </div>
                  )}

                  {selectedRecommendation && (
                    <Card className="mt-3">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          <CompassIcon className="h-4 w-4 mr-2 text-primary" />
                          Recommendation Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Region:
                            </span>
                            <span className="font-medium">
                              {selectedRecommendation.regionName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">City:</span>
                            <span className="font-medium">
                              {selectedRecommendation.cityName ||
                                "Various cities"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Distance:
                            </span>
                            <span className="font-medium">
                              {
                                selectedRecommendation.distanceFromCurrentPosition
                              }{" "}
                              miles
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Travel Time:
                            </span>
                            <span className="font-medium">
                              ~
                              {Math.round(
                                selectedRecommendation.estimatedTravelTime || 0,
                              )}{" "}
                              hours
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Potential Loads:
                            </span>
                            <span className="font-medium">
                              {selectedRecommendation.potentialLoads}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Average Rate:
                            </span>
                            <span className="font-medium">
                              ${selectedRecommendation.avgRate.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Urgency Score:
                            </span>
                            <span className="font-medium">
                              {selectedRecommendation.urgencyScore.toFixed(1)}
                              /10
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Equipment Match:
                            </span>
                            <span className="font-medium">
                              {Math.round(
                                selectedRecommendation.equipmentMatch * 100,
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col gap-2">
                        <Button className="w-full">
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Accept Recommendation
                        </Button>
                        {isRealTimeEnabled && (
                          <p className="text-xs text-center text-green-600">
                            <WifiIcon className="h-3 w-3 inline mr-1" />
                            Recommendations update in real-time
                          </p>
                        )}
                      </CardFooter>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarrierDemandHeatmap;
