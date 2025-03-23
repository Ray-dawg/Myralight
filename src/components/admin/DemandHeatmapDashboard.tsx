import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../lib/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";
import {
  CalendarIcon,
  FilterIcon,
  DownloadIcon,
  TruckIcon,
  BoxIcon,
  BarChart3Icon,
  MapPinIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  AlertTriangleIcon,
  Search,
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// Import Mapbox token from lib/mapbox.ts
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
  weekNumber?: number;
  region?: string;
  equipmentType?: string;
  loadType?: string;
  aggregationType: string;
  commodityType?: string;
  hazmatOnly?: boolean;
  demandType?: string;
  minUrgencyScore?: number;
  maxUrgencyScore?: number;
  minMarketDemandScore?: number;
  maxMarketDemandScore?: number;
  searchQuery?: string;
}

interface LaneFilters {
  timeframe: string;
  year: number;
  month?: number;
  day?: number;
  weekNumber?: number;
  originRegion?: string;
  destinationRegion?: string;
  equipmentType?: string;
  loadType?: string;
  commodityType?: string;
  hazmatOnly?: boolean;
  minDistance?: number;
  maxDistance?: number;
  minRate?: number;
  maxRate?: number;
}

interface MarketInsightFilters {
  region: string;
  timeframe: string;
  year: number;
  month?: number;
  day?: number;
  weekNumber?: number;
}

const DemandHeatmapDashboard: React.FC = () => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [heatmapFilters, setHeatmapFilters] = useState<HeatmapFilters>({
    timeframe: "daily",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    aggregationType: "geohash",
    searchQuery: "",
  });
  const [laneFilters, setLaneFilters] = useState<LaneFilters>({
    timeframe: "daily",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [marketInsightFilters, setMarketInsightFilters] =
    useState<MarketInsightFilters>({
      region: "CA",
      timeframe: "daily",
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("heatmap");
  const [activeSubTab, setActiveSubTab] = useState("map");
  const [urgencyRange, setUrgencyRange] = useState<[number, number]>([0, 10]);
  const [marketDemandRange, setMarketDemandRange] = useState<[number, number]>([
    0, 10,
  ]);
  const [distanceRange, setDistanceRange] = useState<[number, number]>([
    0, 2000,
  ]);
  const [rateRange, setRateRange] = useState<[number, number]>([0, 10000]);

  // Equipment and load type options
  const equipmentTypes = [
    "Dry Van",
    "Reefer",
    "Flatbed",
    "Tanker",
    "Step Deck",
  ];
  const loadTypes = ["ftl", "ltl", "partial", "expedited"];
  const commodityTypes = [
    "food",
    "electronics",
    "furniture",
    "automotive",
    "construction",
    "general",
  ];
  const regions = ["CA", "TX", "FL", "NY", "IL", "GA", "PA", "OH", "MI", "NC"];

  // Get heatmap data from Convex
  const heatmapData = useQuery(api.loadDemand.getHeatmapData, heatmapFilters);

  // Get lane data from Convex
  const laneData = useQuery(api.loadDemand.getLaneDemandData, laneFilters);

  // Get top lanes by volume
  const topLanesByVolume = useQuery(api.loadDemand.getTopLanes, {
    timeframe: laneFilters.timeframe,
    year: laneFilters.year,
    month: laneFilters.month,
    day: laneFilters.day,
    weekNumber: laneFilters.weekNumber,
    originRegion: laneFilters.originRegion,
    metric: "volume",
    limit: 10,
    equipmentType: laneFilters.equipmentType,
    loadType: laneFilters.loadType,
    commodityType: laneFilters.commodityType,
  });

  // Get market insights
  const marketInsights = useQuery(
    api.loadDemand.getMarketInsights,
    marketInsightFilters,
  );

  // Get trend data for charts
  const trendData = useQuery(api.loadDemand.getDemandTrends, {
    timeframe: "monthly",
    startYear: new Date().getFullYear() - 1,
    startMonth: new Date().getMonth() + 1,
    endYear: new Date().getFullYear(),
    endMonth: new Date().getMonth() + 1,
    region: heatmapFilters.region,
    equipmentType: heatmapFilters.equipmentType,
    loadType: heatmapFilters.loadType,
    commodityType: heatmapFilters.commodityType,
    demandType: heatmapFilters.demandType,
  });

  // Filter heatmap data based on search query
  const filteredHeatmapData = React.useMemo(() => {
    if (!heatmapData) return null;
    
    if (!heatmapFilters.searchQuery) return heatmapData;
    
    const query = heatmapFilters.searchQuery.toLowerCase().trim();
    console.log(`Filtering data with query: "${query}"`);
    
    const filtered = heatmapData.filter(item => {
      const region = (item.region || item.regionId || "").toLowerCase();
      const cityName = (item.cityName || "").toLowerCase();
      const zipCode = (item.zipCode || "").toLowerCase();
      
      return region.includes(query) || 
             cityName.includes(query) || 
             zipCode.includes(query);
    });
    
    console.log(`Filtered data points: ${filtered.length} of ${heatmapData.length}`);
    return filtered;
  }, [heatmapData, heatmapFilters.searchQuery]);

  // Initialize map with proper cleanup and error handling
  useEffect(() => {
    if (!map && activeTab === "heatmap" && activeSubTab === "map") {
      // Check if the map container exists
      const mapContainer = document.getElementById("map");
      if (!mapContainer) {
        console.error("Map container not found");
        return;
      }

      try {
        const mapInstance = new mapboxgl.Map({
          container: "map",
          style: MAPBOX_STYLE || "mapbox://styles/mapbox/light-v11", // Light style works better for data visualization
          center: DEFAULT_CENTER || [-95.7129, 37.0902], // Center on US
          zoom: DEFAULT_ZOOM || 3,
          attributionControl: true,
          preserveDrawingBuffer: true, // Needed for map image export
        });

        // Add navigation controls
        mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");

        // Add scale control
        mapInstance.addControl(
          new mapboxgl.ScaleControl({
            maxWidth: 100,
            unit: "imperial",
          }),
          "bottom-right",
        );

        mapInstance.on("load", () => {
          // Add heatmap source
          mapInstance.addSource("demand-data", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [],
            },
          });

          // Add heatmap layer with enhanced visualization
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
              // Intensity varies with zoom level for better visualization at different scales
              "heatmap-intensity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                0.6, // Less intense at country level
                9,
                1.2, // More intense at city level
                15,
                2, // Highly intense at street level
              ],
              // Color gradient optimized for colorblind users (blue-yellow-red scheme)
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0,
                "rgba(65,105,225,0)", // Royal blue with transparency
                0.1,
                "rgba(65,105,225,0.5)", // Light blue
                0.3,
                "rgb(135,206,250)", // Sky blue
                0.5,
                "rgb(240,230,140)", // Khaki (yellow)
                0.7,
                "rgb(255,165,0)", // Orange
                0.9,
                "rgb(255,69,0)", // Red-orange
                1,
                "rgb(178,34,34)", // Firebrick red
              ],
              // Radius varies with zoom for appropriate detail level
              "heatmap-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                10, // Wider radius at country level
                8,
                15, // Medium radius at state level
                12,
                25, // Detailed radius at city level
                16,
                30, // Very detailed at street level
              ],
              // Opacity varies with zoom for better layering
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

          // Add enhanced circle layer for individual points with improved visual encoding
          mapInstance.addLayer({
            id: "demand-points",
            type: "circle",
            source: "demand-data",
            paint: {
              // Dynamic radius based on load count with smoother scaling
              "circle-radius": [
                "interpolate",
                ["exponential", 1.5], // Exponential scaling for better visual differentiation
                ["get", "count"],
                1,
                4, // Minimum size
                10,
                8, // Small demand
                50,
                15, // Medium demand
                100,
                22, // High demand
                500,
                30, // Very high demand
              ],
              // Color encoding based on rate with colorblind-friendly palette
              "circle-color": [
                "interpolate",
                ["linear"],
                ["get", "avgRate"],
                500,
                "#2c7bb6", // Dark blue (low rates)
                1500,
                "#81b9df", // Light blue
                3000,
                "#ffffbf", // Yellow (neutral)
                5000,
                "#fdae61", // Orange
                7500,
                "#d7191c", // Red (high rates)
              ],
              // Opacity varies with zoom level for better layering
              "circle-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                8,
                0.5,
                12,
                0.7,
                16,
                0.85,
              ],
              // Enhanced border for better visibility against different backgrounds
              "circle-stroke-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                8,
                0.5,
                12,
                1,
                16,
                1.5,
              ],
              "circle-stroke-color": [
                "case",
                ["<", ["get", "avgRate"], 3000],
                "#ffffff", // White border for darker circles (blue)
                "#000000", // Black border for lighter circles (yellow/orange/red)
              ],
              // Add subtle shadow effect for depth
              "circle-translate": [0, 0],
              "circle-translate-anchor": "map",
              "circle-blur": 0.2,
            },
            layout: {
              visibility: "none",
            },
          });

          // Add enhanced lane layer with improved visual encoding
          mapInstance.addSource("lane-data", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [],
            },
          });

          mapInstance.addLayer({
            id: "lane-lines",
            type: "line",
            source: "lane-data",
            layout: {
              "line-join": "round",
              "line-cap": "round",
              visibility: "none",
            },
            paint: {
              // Enhanced color scheme for lanes with colorblind-friendly palette
              "line-color": [
                "interpolate",
                ["linear"],
                ["get", "volume"],
                1,
                "#2c7bb6", // Dark blue (low volume)
                10,
                "#81b9df", // Light blue
                30,
                "#ffffbf", // Yellow (medium volume)
                60,
                "#fdae61", // Orange
                100,
                "#d7191c", // Red (high volume)
              ],
              // Width encoding based on volume with smoother scaling
              "line-width": [
                "interpolate",
                ["exponential", 1.3], // Exponential scaling for better visual differentiation
                ["get", "volume"],
                1,
                1, // Minimum width
                10,
                2.5, // Low volume
                30,
                4, // Medium volume
                60,
                6, // High volume
                100,
                8, // Very high volume
              ],
              // Dynamic opacity based on zoom level
              "line-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                5,
                0.6,
                8,
                0.7,
                12,
                0.8,
              ],
              // Add dash pattern for low volume lanes to differentiate
              "line-dasharray": [
                "step",
                ["get", "volume"],
                ["literal", [2, 1]], // Dashed line for volume <= 5
                5,
                ["literal", [1, 0]], // Solid line for volume > 5
              ],
              // Add glow effect for emphasis
              "line-blur": [
                "interpolate",
                ["linear"],
                ["get", "volume"],
                1,
                0.5,
                100,
                1.5,
              ],
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
            const marketDemandScore =
              e.features[0].properties.marketDemandScore || 0;

            // Enhanced popup with more detailed information
            // Enhanced popup with more visual cues and better formatting
            const urgencyColor =
              urgencyScore > 7
                ? "#d7191c"
                : urgencyScore > 4
                  ? "#fdae61"
                  : "#2c7bb6";
            const demandColor =
              marketDemandScore > 7
                ? "#d7191c"
                : marketDemandScore > 4
                  ? "#fdae61"
                  : "#2c7bb6";

            const html = `
              <div class="heatmap-popup" style="font-family: system-ui, -apple-system, sans-serif; padding: 12px; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 280px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px;">${region}</h3>
                <div class="popup-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                  <div style="display: flex; align-items: center;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: #2c7bb6; margin-right: 6px;"></span>
                    <strong>Loads:</strong> ${count}
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: #81b9df; margin-right: 6px;"></span>
                    <strong>Avg Rate:</strong> ${avgRate.toFixed(2)}
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${urgencyColor}; margin-right: 6px;"></span>
                    <strong>Urgency:</strong> <span style="color: ${urgencyColor}; font-weight: bold;">${urgencyScore.toFixed(1)}/10</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${demandColor}; margin-right: 6px;"></span>
                    <strong>Demand:</strong> <span style="color: ${demandColor}; font-weight: bold;">${marketDemandScore.toFixed(1)}/10</span>
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

          mapInstance.on("mouseenter", "lane-lines", (e) => {
            mapInstance.getCanvas().style.cursor = "pointer";

            const origin = e.features[0].properties.origin || "";
            const destination = e.features[0].properties.destination || "";
            const volume = e.features[0].properties.volume;
            const avgRate = e.features[0].properties.avgRate;
            const avgDistance = e.features[0].properties.avgDistance;

            // Enhanced lane popup with visual indicators and better formatting
            const volumeColor =
              volume > 50 ? "#d7191c" : volume > 20 ? "#fdae61" : "#2c7bb6";
            const rateColor =
              avgRate > 5000
                ? "#d7191c"
                : avgRate > 2500
                  ? "#fdae61"
                  : "#2c7bb6";

            const html = `
              <div style="font-family: system-ui, -apple-system, sans-serif; padding: 12px; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 280px;">
                <div style="margin: 0 0 8px 0; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px; display: flex; align-items: center;">
                  <span style="color: #2c7bb6; margin-right: 4px;">${origin}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 4px;">
                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                  </svg>
                  <span style="color: #d7191c;">${destination}</span>
                </div>
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; align-items: center;">
                  <div style="display: flex; align-items: center; margin-bottom: 6px;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${volumeColor}; margin-right: 6px;"></span>
                    <strong>Loads:</strong>
                  </div>
                  <div style="font-weight: ${volume > 30 ? "bold" : "normal"}; color: ${volumeColor};">${volume}</div>
                  
                  <div style="display: flex; align-items: center; margin-bottom: 6px;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${rateColor}; margin-right: 6px;"></span>
                    <strong>Avg Rate:</strong>
                  </div>
                  <div>${avgRate.toFixed(2)}</div>
                  
                  <div style="display: flex; align-items: center; margin-bottom: 6px;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: #81b9df; margin-right: 6px;"></span>
                    <strong>Distance:</strong>
                  </div>
                  <div>${avgDistance.toFixed(0)} miles</div>
                  
                  <div style="display: flex; align-items: center;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: #81b9df; margin-right: 6px;"></span>
                    <strong>Rate/Mile:</strong>
                  </div>
                  <div>${(avgRate / avgDistance).toFixed(2)}/mi</div>
                </div>
              </div>
            `;

            popup.setLngLat(e.lngLat).setHTML(html).addTo(mapInstance);
          });

          mapInstance.on("mouseleave", "lane-lines", () => {
            mapInstance.getCanvas().style.cursor = "";
            popup.remove();
          });
        });

        // Add event listener for map movement to update filters based on visible area
        mapInstance.on("moveend", () => {
          const bounds = mapInstance.getBounds();
          // Optional: Update filters based on visible map area
          // This could be implemented to only load data for visible regions
        });

        // Set the map instance to state
        setMap(mapInstance);
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    }

    // Cleanup function to properly remove the map when component unmounts
    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, [activeTab, activeSubTab, map]);

  // Update map data when heatmap data changes with optimized rendering and debouncing
  useEffect(() => {
    if (!map || !filteredHeatmapData || activeTab !== "heatmap") return;

    // Check if the source exists, if not, wait for map to be fully loaded
    if (!map.getSource("demand-data")) {
      const checkSource = () => {
        if (map.getSource("demand-data")) {
          updateHeatmapData();
        } else if (map.loaded()) {
          // If map is loaded but source doesn't exist, it might have been removed
          console.warn("Map is loaded but demand-data source doesn't exist");
        } else {
          // Try again in a short while
          setTimeout(checkSource, 100);
        }
      };
      checkSource();
      return;
    }

    updateHeatmapData();

    function updateHeatmapData() {
      console.log(`Rendering ${filteredHeatmapData.length} data points on heatmap`);

      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        try {
          // Convert data to GeoJSON format with enhanced properties for visualization
          const features = filteredHeatmapData.map((point) => {
            // Enhanced weight calculation with improved normalization
            const rawWeight = point.totalLoads || point.loadCount || 1;

            // Use a more sophisticated normalization approach that better handles outliers
            // Combine logarithmic scaling with urgency and market demand factors
            const logWeight = Math.log(rawWeight + 1) / Math.log(100);
            const urgencyFactor = (point.avgUrgencyScore || 0) / 10;
            const demandFactor = (point.avgMarketDemandScore || 0) / 10;

            // Weighted combination gives more visual prominence to high urgency/demand areas
            const normalizedWeight = Math.min(
              1,
              logWeight * 0.6 + urgencyFactor * 0.2 + demandFactor * 0.2,
            );

            return {
              type: "Feature",
              properties: {
                weight: normalizedWeight, // Normalized for better heatmap visualization
                rawCount: rawWeight, // Original count for popups and filtering
                count: point.totalLoads || point.loadCount || 1,
                avgRate: point.avgRate || 0,
                region: point.region || point.regionId || "",
                urgencyScore: point.avgUrgencyScore || 0,
                marketDemandScore: point.avgMarketDemandScore || 0,
                seasonalFactor: point.avgSeasonalFactor || 0,
                // Add additional metadata for enhanced visualization
                equipmentBreakdown: point.equipmentBreakdown || {},
                loadTypeBreakdown: point.loadTypeBreakdown || {},
                commodityTypeBreakdown: point.commodityTypeBreakdown || {},
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

          // Toggle layer visibility based on active subtab
          if (activeSubTab === "map") {
            map.setLayoutProperty("demand-heat", "visibility", "visible");
            map.setLayoutProperty("demand-points", "visibility", "none");
            map.setLayoutProperty("lane-lines", "visibility", "none");
          } else if (activeSubTab === "points") {
            map.setLayoutProperty("demand-heat", "visibility", "none");
            map.setLayoutProperty("demand-points", "visibility", "visible");
            map.setLayoutProperty("lane-lines", "visibility", "none");
          }

          // Fit bounds to data if there are points and user hasn't manually panned
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
      });
    }
  }, [map, filteredHeatmapData, activeTab, activeSubTab]);

  // State centers lookup table for lane visualization
  const stateCenters: Record<string, [number, number]> = {
    CA: [-119.4179, 36.7783],
    TX: [-99.9018, 31.9686],
    FL: [-81.5158, 27.6648],
    NY: [-75.4652, 42.1497],
    IL: [-89.3985, 40.6331],
    PA: [-77.1945, 41.2033],
    OH: [-82.7755, 40.4173],
    GA: [-83.6431, 32.1656],
    NC: [-79.0193, 35.7596],
    MI: [-85.6024, 44.3148],
    WA: [-120.7401, 47.7511],
    OR: [-120.5542, 44.0721],
    AZ: [-111.6602, 34.2744],
    CO: [-105.7821, 39.5501],
    NV: [-117.1219, 38.4199],
    UT: [-111.0937, 39.3055],
    NM: [-106.1126, 34.4071],
    ID: [-114.613, 44.0682],
    MT: [-109.6333, 46.8797],
    WY: [-107.2903, 43.076],
    ND: [-100.4701, 47.4501],
    SD: [-100.2263, 44.4443],
    NE: [-99.9018, 41.4925],
    KS: [-98.4842, 39.0119],
    OK: [-97.5164, 35.5376],
    MN: [-94.6859, 46.4419],
    IA: [-93.5, 42.0046],
    MO: [-92.458, 38.4623],
    AR: [-92.4426, 34.7999],
    LA: [-92.4451, 31.1801],
    WI: [-89.6385, 44.2563],
    IN: [-86.2604, 39.8647],
    KY: [-84.27, 37.8393],
    TN: [-86.7844, 35.7478],
    MS: [-89.6678, 32.7673],
    AL: [-86.8073, 32.799],
    ME: [-69.2428, 45.2538],
    NH: [-71.5811, 43.6805],
    VT: [-72.5778, 44.0407],
    MA: [-71.5811, 42.2373],
    RI: [-71.5562, 41.5801],
    CT: [-72.7273, 41.6219],
    NJ: [-74.4057, 40.0583],
    DE: [-75.5277, 39.1453],
    MD: [-76.6413, 39.0458],
    VA: [-78.6569, 37.4316],
    WV: [-80.9696, 38.4912],
    SC: [-80.8964, 33.8191],
    DC: [-77.0369, 38.9072],
  };

  // Update lane data on map with improved error handling and animation
  useEffect(() => {
    if (!map || !laneData || activeTab !== "lanes" || activeSubTab !== "map")
      return;

    // Check if the source exists, if not, wait for map to be fully loaded
    if (!map.getSource("lane-data")) {
      const checkSource = () => {
        if (map.getSource("lane-data")) {
          updateLaneData();
        } else if (map.loaded()) {
          console.warn("Map is loaded but lane-data source doesn't exist");
        } else {
          setTimeout(checkSource, 100);
        }
      };
      checkSource();
      return;
    }

    updateLaneData();

    function updateLaneData() {
      try {
        // Use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
          // Convert lane data to GeoJSON format for lines with curved paths
          const features = laneData
            .map((lane) => {
              const originCoords =
                stateCenters[lane.originRegion] || DEFAULT_CENTER;
              const destCoords =
                stateCenters[lane.destinationRegion] || DEFAULT_CENTER;

              // Skip if origin and destination are the same
              if (lane.originRegion === lane.destinationRegion) {
                return null;
              }

              // Calculate a curved path between points for better visualization
              // This creates an arc effect for the lane lines
              const points = generateCurvedLine(originCoords, destCoords);

              return {
                type: "Feature",
                properties: {
                  origin: lane.originRegion,
                  destination: lane.destinationRegion,
                  volume: lane.totalLoads || 0,
                  avgRate: lane.avgRate || 0,
                  avgDistance: lane.avgDistance || 0,
                  avgRatePerMile: lane.avgRatePerMile || 0,
                  // Add a unique ID for potential animations or interactions
                  id: `${lane.originRegion}-${lane.destinationRegion}`,
                },
                geometry: {
                  type: "LineString",
                  coordinates: points,
                },
              };
            })
            .filter(Boolean); // Remove null entries

          // Update the source data
          const source = map.getSource("lane-data") as mapboxgl.GeoJSONSource;
          if (source) {
            source.setData({
              type: "FeatureCollection",
              features: features as GeoJSON.Feature[],
            });
          }

          // Set lane layer visibility
          map.setLayoutProperty("demand-heat", "visibility", "none");
          map.setLayoutProperty("demand-points", "visibility", "none");
          map.setLayoutProperty("lane-lines", "visibility", "visible");

          // Fit bounds to data if there are lanes
          if (features.length > 0 && !map.isMoving()) {
            const bounds = new mapboxgl.LngLatBounds();
            features.forEach((feature) => {
              if (feature) {
                (feature.geometry as GeoJSON.LineString).coordinates.forEach(
                  (coord) => {
                    bounds.extend(coord as [number, number]);
                  },
                );
              }
            });
            map.fitBounds(bounds, { padding: 50 });
          }
        });
      } catch (error) {
        console.error("Error updating lane data:", error);
      }
    }

    // Helper function to generate a curved line between two points
    function generateCurvedLine(
      start: [number, number],
      end: [number, number],
    ): [number, number][] {
      const points: [number, number][] = [];
      const steps = 20; // Number of points in the curve

      // Calculate the midpoint
      const mid: [number, number] = [
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2,
      ];

      // Calculate the distance between points
      const distance = Math.sqrt(
        Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2),
      );

      // Calculate the curve height based on distance
      const curveHeight = distance * 0.15;

      // Calculate the perpendicular direction to create the curve
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const perpX = -dy / Math.sqrt(dx * dx + dy * dy);
      const perpY = dx / Math.sqrt(dx * dx + dy * dy);

      // Add the curve control point
      const controlPoint: [number, number] = [
        mid[0] + perpX * curveHeight,
        mid[1] + perpY * curveHeight,
      ];

      // Generate points along the quadratic Bezier curve
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const point = quadraticBezier(start, controlPoint, end, t);
        points.push(point);
      }

      return points;
    }

    // Quadratic Bezier curve formula
    function quadraticBezier(
      p0: [number, number],
      p1: [number, number],
      p2: [number, number],
      t: number,
    ): [number, number] {
      const x =
        Math.pow(1 - t, 2) * p0[0] +
        2 * (1 - t) * t * p1[0] +
        Math.pow(t, 2) * p2[0];
      const y =
        Math.pow(1 - t, 2) * p0[1] +
        2 * (1 - t) * t * p1[1] +
        Math.pow(t, 2) * p2[1];
      return [x, y];
    }
  }, [map, laneData, activeTab, activeSubTab]);

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const newDateFilters = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        weekNumber: getWeekNumber(date),
      };

      setHeatmapFilters((prev) => ({
        ...prev,
        ...newDateFilters,
      }));

      setLaneFilters((prev) => ({
        ...prev,
        ...newDateFilters,
      }));

      setMarketInsightFilters((prev) => ({
        ...prev,
        ...newDateFilters,
      }));
    }
  };

  // Get week number from date
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Handle heatmap filter changes
  const handleHeatmapFilterChange = (key: keyof HeatmapFilters, value: any) => {
    setHeatmapFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleHeatmapFilterChange("searchQuery", value);
    console.log("Search query updated:", value);
  };

  // Handle lane filter changes
  const handleLaneFilterChange = (key: keyof LaneFilters, value: any) => {
    setLaneFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle market insight filter changes
  const handleMarketInsightFilterChange = (
    key: keyof MarketInsightFilters,
    value: any,
  ) => {
    setMarketInsightFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Export data as CSV with improved formatting and error handling
  const exportData = () => {
    if (!filteredHeatmapData || filteredHeatmapData.length === 0) {
      console.warn("No heatmap data available to export");
      return;
    }

    try {
      // Create CSV content with proper escaping for CSV values
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent +=
        "Latitude,Longitude,Region,Timeframe,Year,Month,Day,LoadCount,AvgRate,UrgencyScore,MarketDemandScore,SeasonalFactor\n";

      filteredHeatmapData.forEach((item) => {
        // Properly escape CSV values to handle commas and quotes
        const escapeCsvValue = (value: any) => {
          if (value === null || value === undefined) return "";
          const stringValue = String(value);
          // If the value contains commas, quotes, or newlines, wrap it in quotes and escape any quotes
          if (
            stringValue.includes(",") ||
            stringValue.includes('"') ||
            stringValue.includes("\n")
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        };

        const row = [
          escapeCsvValue(item.latitude || ""),
          escapeCsvValue(item.longitude || ""),
          escapeCsvValue(item.region || item.regionId || ""),
          escapeCsvValue(item.timeframe),
          escapeCsvValue(item.year),
          escapeCsvValue(item.month || ""),
          escapeCsvValue(item.day || ""),
          escapeCsvValue(item.totalLoads || item.loadCount || 0),
          escapeCsvValue(item.avgRate ? item.avgRate.toFixed(2) : 0),
          escapeCsvValue(
            item.avgUrgencyScore ? item.avgUrgencyScore.toFixed(2) : 0,
          ),
          escapeCsvValue(
            item.avgMarketDemandScore
              ? item.avgMarketDemandScore.toFixed(2)
              : 0,
          ),
          escapeCsvValue(
            item.avgSeasonalFactor ? item.avgSeasonalFactor.toFixed(2) : 0,
          ),
        ].join(",");
        csvContent += row + "\n";
      });

      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `demand-data-${format(selectedDate, "yyyy-MM-dd")}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  // Export map as image
  const exportMapAsImage = () => {
    if (!map) return;

    try {
      // Get the map canvas
      const canvas = map.getCanvas();

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL("image/png");

      // Create download link
      const link = document.createElement("a");
      link.setAttribute("href", dataUrl);
      link.setAttribute(
        "download",
        `demand-map-${format(selectedDate, "yyyy-MM-dd")}.png`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting map as image:", error);
    }
  };

  // Export lane data as CSV
  const exportLaneData = () => {
    if (!laneData) return;

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent +=
      "OriginRegion,DestinationRegion,Timeframe,Year,Month,Day,LoadCount,AvgRate,AvgDistance,AvgRatePerMile\n";

    laneData.forEach((item) => {
      const row = [
        item.originRegion || "",
        item.destinationRegion || "",
        item.timeframe,
        item.year,
        item.month || "",
        item.day || "",
        item.totalLoads || 0,
        item.avgRate || 0,
        item.avgDistance || 0,
        item.avgRatePerMile || 0,
      ].join(",");
      csvContent += row + "\n";
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `lane-data-${format(selectedDate, "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="heatmap">
              <MapPinIcon className="h-4 w-4 mr-2" />
              Demand Heatmap
            </TabsTrigger>
            <TabsTrigger value="lanes">
              <TruckIcon className="h-4 w-4 mr-2" />
              Lane Analysis
            </TabsTrigger>
            <TabsTrigger value="insights">
              <BarChart3Icon className="h-4 w-4 mr-2" />
              Market Insights
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <div className="relative mr-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by region, city..."
                className="w-[200px] pl-8"
                value={heatmapFilters.searchQuery || ""}
                onChange={handleSearchChange}
                aria-label="Search demand data"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Search</h4>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by region, city..."
                        className="pl-8"
                        value={heatmapFilters.searchQuery || ""}
                        onChange={handleSearchChange}
                        aria-label="Filter by region, city or zip code"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Time Period</h4>
                    <Select
                      value={heatmapFilters.timeframe}
                      onValueChange={(value) =>
                        handleHeatmapFilterChange("timeframe", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Region</h4>
                    <Select
                      value={heatmapFilters.region || ""}
                      onValueChange={(value) =>
                        handleHeatmapFilterChange("region", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Regions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Regions</SelectItem>
                        {regions.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Equipment Type</h4>
                    <Select
                      value={heatmapFilters.equipmentType || ""}
                      onValueChange={(value) =>
                        handleHeatmapFilterChange("equipmentType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Equipment Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Equipment Types</SelectItem>
                        {equipmentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Load Type</h4>
                    <Select
                      value={heatmapFilters.loadType || ""}
                      onValueChange={(value) =>
                        handleHeatmapFilterChange("loadType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Load Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Load Types</SelectItem>
                        {loadTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Commodity Type</h4>
                    <Select
                      value={heatmapFilters.commodityType || ""}
                      onValueChange={(value) =>
                        handleHeatmapFilterChange("commodityType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Commodities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Commodities</SelectItem>
                        {commodityTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hazmat"
                      checked={heatmapFilters.hazmatOnly}
                      onCheckedChange={(checked) =>
                        handleHeatmapFilterChange(
                          "hazmatOnly",
                          checked === true,
                        )
                      }
                    />
                    <Label htmlFor="hazmat">Hazmat Only</Label>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Demand Type</h4>
                    <Select
                      value={heatmapFilters.demandType || ""}
                      onValueChange={(value) =>
                        handleHeatmapFilterChange("demandType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Demand Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Demand Types</SelectItem>
                        <SelectItem value="pickup">Pickup</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Urgency Score</h4>
                      <span className="text-sm text-muted-foreground">
                        {urgencyRange[0]} - {urgencyRange[1]}
                      </span>
                    </div>
                    <Slider
                      defaultValue={urgencyRange}
                      min={0}
                      max={10}
                      step={1}
                      onValueChange={(value) => {
                        setUrgencyRange(value as [number, number]);
                        handleHeatmapFilterChange("minUrgencyScore", value[0]);
                        handleHeatmapFilterChange("maxUrgencyScore", value[1]);
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Market Demand Score</h4>
                      <span className="text-sm text-muted-foreground">
                        {marketDemandRange[0]} - {marketDemandRange[1]}
                      </span>
                    </div>
                    <Slider
                      defaultValue={marketDemandRange}
                      min={0}
                      max={10}
                      step={1}
                      onValueChange={(value) => {
                        setMarketDemandRange(value as [number, number]);
                        handleHeatmapFilterChange(
                          "minMarketDemandScore",
                          value[0],
                        );
                        handleHeatmapFilterChange(
                          "maxMarketDemandScore",
                          value[1],
                        );
                      }}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {activeTab === "heatmap" && (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={exportData}>
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                {activeSubTab === "map" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportMapAsImage}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Export Map
                  </Button>
                )}
              </div>
            )}

            {activeTab === "lanes" && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportLaneData}
                className="ml-2"
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="heatmap" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Load Demand Heatmap</CardTitle>
                  <CardDescription>
                    Geographic distribution of load demand
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={activeSubTab}
                    onValueChange={setActiveSubTab}
                    className="w-full"
                  >
                    <TabsList className="mb-4">
                      <TabsTrigger value="map">Heatmap</TabsTrigger>
                      <TabsTrigger value="points">Points</TabsTrigger>
                      <TabsTrigger value="chart">Chart</TabsTrigger>
                    </TabsList>

                    <TabsContent value="map" className="space-y-4">
                      <div
                        id="map"
                        className="h-[500px] w-full rounded-md border relative overflow-hidden"
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

                    <TabsContent value="points" className="space-y-4">
                      <div
                        id="map"
                        className="h-[500px] w-full rounded-md border"
                      />
                    </TabsContent>

                    <TabsContent value="chart" className="space-y-4">
                      <div className="h-[500px] w-full rounded-md border p-4">
                        {filteredHeatmapData ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={filteredHeatmapData.slice(0, 20).map((item) => ({
                                region:
                                  item.region || item.regionId || "Unknown",
                                loads: item.totalLoads || item.loadCount || 0,
                                avgRate: item.avgRate || 0,
                              }))}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 60,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="region"
                                angle={-45}
                                textAnchor="end"
                                height={70}
                              />
                              <YAxis yAxisId="left" orientation="left" />
                              <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={[0, "auto"]}
                              />
                              <Tooltip />
                              <Legend />
                              <Bar
                                yAxisId="left"
                                dataKey="loads"
                                fill="#8884d8"
                                name="Load Count"
                              />
                              <Bar
                                yAxisId="right"
                                dataKey="avgRate"
                                fill="#82ca9d"
                                name="Avg Rate ($)"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p>Loading chart data...</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Demand Metrics</CardTitle>
                  <CardDescription>Key demand indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredHeatmapData ? (
                      <>
                        <div>
                          <h4 className="text-sm font-medium mb-1">
                            Total Loads
                          </h4>
                          <div className="text-2xl font-bold">
                            {filteredHeatmapData.reduce(
                              (sum, item) =>
                                sum + (item.totalLoads || item.loadCount || 0),
                              0,
                            )}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="text-sm font-medium mb-1">Avg Rate</h4>
                          <div className="text-2xl font-bold">
                            $
                            {filteredHeatmapData.length > 0
                              ? (
                                  filteredHeatmapData.reduce(
                                    (sum, item) => sum + (item.avgRate || 0),
                                    0,
                                  ) / filteredHeatmapData.length
                                ).toFixed(2)
                              : "0.00"}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="text-sm font-medium mb-1">
                            Top Regions
                          </h4>
                          <div className="space-y-2">
                            {filteredHeatmapData
                              .sort(
                                (a, b) =>
                                  (b.totalLoads || b.loadCount || 0) -
                                  (a.totalLoads || a.loadCount || 0),
                              )
                              .slice(0, 5)
                              .map((item, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center"
                                >
                                  <span>
                                    {item.region || item.regionId || "Unknown"}
                                  </span>
                                  <Badge variant="secondary">
                                    {item.totalLoads || item.loadCount || 0}{" "}
                                    loads
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-40">
                        <p>Loading metrics...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="lanes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Lane Analysis</CardTitle>
                  <CardDescription>
                    Origin-destination lane demand patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={activeSubTab}
                    onValueChange={setActiveSubTab}
                    className="w-full"
                  >
                    <TabsList className="mb-4">
                      <TabsTrigger value="map">Map</TabsTrigger>
                      <TabsTrigger value="table">Table</TabsTrigger>
                      <TabsTrigger value="chart">Chart</TabsTrigger>
                    </TabsList>

                    <TabsContent value="map" className="space-y-4">
                      <div className="flex space-x-4 mb-4">
                        <div className="w-1/2">
                          <Label htmlFor="origin-region">Origin Region</Label>
                          <Select
                            value={laneFilters.originRegion || ""}
                            onValueChange={(value) =>
                              handleLaneFilterChange("originRegion", value)
                            }
                          >
                            <SelectTrigger id="origin-region">
                              <SelectValue placeholder="All Origins" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Origins</SelectItem>
                              {regions.map((region) => (
                                <SelectItem key={region} value={region}>
                                  {region}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-1/2">
                          <Label htmlFor="destination-region">
                            Destination Region
                          </Label>
                          <Select
                            value={laneFilters.destinationRegion || ""}
                            onValueChange={(value) =>
                              handleLaneFilterChange("destinationRegion", value)
                            }
                          >
                            <SelectTrigger id="destination-region">
                              <SelectValue placeholder="All Destinations" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Destinations</SelectItem>
                              {regions.map((region) => (
                                <SelectItem key={region} value={region}>
                                  {region}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex space-x-4 mb-4">
                        <div className="w-1/2">
                          <div className="flex justify-between">
                            <Label>Distance Range (miles)</Label>
                            <span className="text-sm text-muted-foreground">
                              {distanceRange[0]} - {distanceRange[1]}
                            </span>
                          </div>
                          <Slider
                            defaultValue={distanceRange}
                            min={0}
                            max={2000}
                            step={50}
                            className="mt-2"
                            onValueChange={(value) => {
                              setDistanceRange(value as [number, number]);
                              handleLaneFilterChange("minDistance", value[0]);
                              handleLaneFilterChange("maxDistance", value[1]);
                            }}
                          />
                        </div>

                        <div className="w-1/2">
                          <div className="flex justify-between">
                            <Label>Rate Range ($)</Label>
                            <span className="text-sm text-muted-foreground">
                              {rateRange[0]} - {rateRange[1]}
                            </span>
                          </div>
                          <Slider
                            defaultValue={rateRange}
                            min={0}
                            max={10000}
                            step={500}
                            className="mt-2"
                            onValueChange={(value) => {
                              setRateRange(value as [number, number]);
                              handleLaneFilterChange("minRate", value[0]);
                              handleLaneFilterChange("maxRate", value[1]);
                            }}
                          />
                        </div>
                      </div>

                      <div
                        id="map"
                        className="h-[500px] w-full rounded-md border"
                      />
                    </TabsContent>

                    <TabsContent value="table" className="space-y-4">
                      <div className="rounded-md border">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="py-2 px-4 text-left font-medium">
                                  Origin
                                </th>
                                <th className="py-2 px-4 text-left font-medium">
                                  Destination
                                </th>
                                <th className="py-2 px-4 text-left font-medium">
                                  Loads
                                </th>
                                <th className="py-2 px-4 text-left font-medium">
                                  Avg Rate
                                </th>
                                <th className="py-2 px-4 text-left font-medium">
                                  Avg Distance
                                </th>
                                <th className="py-2 px-4 text-left font-medium">
                                  Rate/Mile
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {laneData ? (
                                laneData.length > 0 ? (
                                  laneData
                                    .sort(
                                      (a, b) =>
                                        (b.totalLoads || 0) -
                                        (a.totalLoads || 0),
                                    )
                                    .map((lane, index) => (
                                      <tr
                                        key={index}
                                        className="border-b hover:bg-muted/50"
                                      >
                                        <td className="py-2 px-4">
                                          {lane.originRegion}
                                        </td>
                                        <td className="py-2 px-4">
                                          {lane.destinationRegion}
                                        </td>
                                        <td className="py-2 px-4">
                                          {lane.totalLoads || 0}
                                        </td>
                                        <td className="py-2 px-4">
                                          ${(lane.avgRate || 0).toFixed(2)}
                                        </td>
                                        <td className="py-2 px-4">
                                          {(lane.avgDistance || 0).toFixed(0)}{" "}
                                          mi
                                        </td>
                                        <td className="py-2 px-4">
                                          $
                                          {(lane.avgRatePerMile || 0).toFixed(
                                            2,
                                          )}
                                          /mi
                                        </td>
                                      </tr>
                                    ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={6}
                                      className="py-4 px-4 text-center text-muted-foreground"
                                    >
                                      No lane data available for the selected
                                      filters
                                    </td>
                                  </tr>
                                )
                              ) : (
                                <tr>
                                  <td
                                    colSpan={6}
                                    className="py-4 px-4 text-center"
                                  >
                                    Loading lane data...
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="chart" className="space-y-4">
                      <div className="h-[500px] w-full rounded-md border p-4">
                        {topLanesByVolume ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={topLanesByVolume.map((lane) => ({
                                lane: `${lane.originRegion} → ${lane.destinationRegion}`,
                                loads: lane.totalLoads || 0,
                                avgRate: lane.avgRate || 0,
                                avgDistance: lane.avgDistance || 0,
                              }))}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 60,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="lane"
                                angle={-45}
                                textAnchor="end"
                                height={70}
                              />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar
                                dataKey="loads"
                                fill="#8884d8"
                                name="Load Count"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p>Loading chart data...</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Top Lanes</CardTitle>
                  <CardDescription>Highest volume lanes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topLanesByVolume ? (
                      topLanesByVolume.length > 0 ? (
                        topLanesByVolume.slice(0, 5).map((lane, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <span className="font-medium">
                                  {lane.originRegion}
                                </span>
                                <ArrowRightIcon className="h-4 w-4 mx-1" />
                                <span className="font-medium">
                                  {lane.destinationRegion}
                                </span>
                              </div>
                              <Badge variant="secondary">
                                {lane.totalLoads} loads
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ${lane.avgRate?.toFixed(2)} avg • $
                              {lane.avgRatePerMile?.toFixed(2)}/mi •
                              {lane.avgDistance?.toFixed(0)} miles
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No lane data available
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-center h-40">
                        <p>Loading top lanes...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Market Insights</CardTitle>
                      <CardDescription>
                        Detailed market analysis and trends
                      </CardDescription>
                    </div>
                    <Select
                      value={marketInsightFilters.region}
                      onValueChange={(value) =>
                        handleMarketInsightFilterChange("region", value)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {marketInsights ? (
                    marketInsights.error ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {marketInsights.error}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium mb-2">
                              Load Volume
                            </h3>
                            <div className="text-3xl font-bold">
                              {marketInsights.totalLoads}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Total loads in {marketInsightFilters.region}
                            </p>
                          </div>

                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium mb-2">
                              Market Type
                            </h3>
                            <div className="text-3xl font-bold capitalize">
                              {marketInsights.marketType}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {marketInsights.inboundVsOutbound.inboundLoads} in
                              / {marketInsights.inboundVsOutbound.outboundLoads}{" "}
                              out
                            </p>
                          </div>

                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium mb-2">
                              Average Rate
                            </h3>
                            <div className="text-3xl font-bold">
                              ${marketInsights.avgRate?.toFixed(2)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Market demand score:{" "}
                              {marketInsights.avgMarketDemandScore?.toFixed(1)}
                              /10
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-medium mb-3">
                              Top Destinations
                            </h3>
                            <div className="space-y-3">
                              {marketInsights.topDestinations.map(
                                (destination, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between items-center border-b pb-2"
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {destination.region}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {destination.city || "Various cities"} •{" "}
                                        {destination.avgDistance?.toFixed(0)}{" "}
                                        miles
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div>{destination.loadCount} loads</div>
                                      <div className="text-sm text-muted-foreground">
                                        ${destination.avgRate?.toFixed(2)} avg
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-medium mb-3">
                              Top Origins
                            </h3>
                            <div className="space-y-3">
                              {marketInsights.topOrigins.map(
                                (origin, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between items-center border-b pb-2"
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {origin.region}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {origin.city || "Various cities"} •{" "}
                                        {origin.avgDistance?.toFixed(0)} miles
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div>{origin.loadCount} loads</div>
                                      <div className="text-sm text-muted-foreground">
                                        ${origin.avgRate?.toFixed(2)} avg
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium mb-3">
                            Demand Trends
                          </h3>
                          <div className="h-[300px] w-full">
                            {trendData ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={trendData.map((item) => ({
                                    date: `${item.year}-${item.month}`,
                                    loads: item.totalLoads || 0,
                                    rate: item.avgRate || 0,
                                  }))}
                                  margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                  }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" />
                                  <YAxis yAxisId="left" orientation="left" />
                                  <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    domain={[0, "auto"]}
                                  />
                                  <Tooltip />
                                  <Legend />
                                  <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="loads"
                                    stroke="#8884d8"
                                    name="Load Volume"
                                  />
                                  <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="rate"
                                    stroke="#82ca9d"
                                    name="Avg Rate ($)"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <p>Loading trend data...</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center h-[500px]">
                      <div className="flex flex-col items-center">