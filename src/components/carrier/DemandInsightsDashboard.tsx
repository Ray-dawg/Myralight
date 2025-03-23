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
  MapIcon,
  TrendingUpIcon,
  BarChart3Icon,
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Set your Mapbox token here
mapboxgl.accessToken = "YOUR_MAPBOX_TOKEN"; // Replace with your actual token

interface DemandInsightsFilters {
  timeframe: string;
  year: number;
  month?: number;
  day?: number;
  weekNumber?: number;
  region?: string;
  equipmentType?: string;
}

const DemandInsightsDashboard: React.FC = () => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [filters, setFilters] = useState<DemandInsightsFilters>({
    timeframe: "weekly",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    weekNumber: getWeekNumber(new Date()),
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("map");

  // Equipment type options for carriers
  const equipmentTypes = [
    "Dry Van",
    "Reefer",
    "Flatbed",
    "Tanker",
    "Step Deck",
  ];

  // Get heatmap data from Convex - using a simplified view for carriers
  const heatmapData = useQuery(api.loadDemand.getHeatmapData, {
    ...filters,
    aggregationType: "region", // Carriers see regional data, not raw points
  });

  // Get trend data for opportunity insights
  const trendData = useQuery(api.loadDemand.getDemandTrends, {
    timeframe: "weekly",
    startYear: new Date().getFullYear(),
    startMonth: new Date().getMonth() - 2 > 0 ? new Date().getMonth() - 2 : 1,
    endYear: new Date().getFullYear(),
    endMonth: new Date().getMonth() + 1,
    region: filters.region,
  });

  // Initialize map
  useEffect(() => {
    if (!map) {
      const mapInstance = new mapboxgl.Map({
        container: "carrier-map",
        style: "mapbox://styles/mapbox/light-v11",
        center: [-95.7129, 37.0902], // Center on US
        zoom: 3,
      });

      mapInstance.on("load", () => {
        // Add choropleth source for states
        mapInstance.addSource("states", {
          type: "vector",
          url: "mapbox://mapbox.us-census-state-boundaries",
        });

        // Add state fill layer
        mapInstance.addLayer({
          id: "state-fills",
          type: "fill",
          source: "states",
          "source-layer": "boundaries_state_2015",
          paint: {
            "fill-color": "#627BC1",
            "fill-opacity": 0.1,
          },
        });

        // Add demand data source
        mapInstance.addSource("demand-regions", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        // Add demand circles layer
        mapInstance.addLayer({
          id: "demand-circles",
          type: "circle",
          source: "demand-regions",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "count"],
              0,
              5,
              100,
              30,
            ],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "rate"],
              0,
              "#4ADE80", // Low rates - green
              2,
              "#FACC15", // Medium rates - yellow
              4,
              "#F87171", // High rates - red
            ],
            "circle-opacity": 0.7,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#FFFFFF",
          },
        });

        // Add popup on hover
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
        });

        mapInstance.on("mouseenter", "demand-circles", (e) => {
          mapInstance.getCanvas().style.cursor = "pointer";

          if (e.features && e.features[0]) {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const properties = e.features[0].properties;

            const popupContent = `
              <div class="p-2">
                <h3 class="font-bold">${properties.region}</h3>
                <p>Load Count: ${properties.count}</p>
                <p>Avg Rate: $${properties.rate.toFixed(2)}/mile</p>
              </div>
            `;

            popup
              .setLngLat(coordinates)
              .setHTML(popupContent)
              .addTo(mapInstance);
          }
        });

        mapInstance.on("mouseleave", "demand-circles", () => {
          mapInstance.getCanvas().style.cursor = "";
          popup.remove();
        });
      });

      setMap(mapInstance);
    }

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Update map data when heatmap data changes
  useEffect(() => {
    if (map && heatmapData && map.getSource("demand-regions")) {
      // Convert data to GeoJSON format for regions
      const features = heatmapData.map((region) => {
        // Use state centroids for visualization
        const stateCentroids: Record<string, [number, number]> = {
          CA: [-119.4179, 36.7783],
          TX: [-99.9018, 31.9686],
          FL: [-81.5158, 27.6648],
          NY: [-75.4652, 42.1497],
          IL: [-89.3985, 40.6331],
          // Add more states as needed
        };

        const regionId = region.region || region.regionId || "US";
        const coordinates = stateCentroids[regionId] || [-95.7129, 37.0902]; // Default to US center

        return {
          type: "Feature",
          properties: {
            region: regionId,
            count: region.totalLoads || region.loadCount || 0,
            rate: region.avgRate || 0,
          },
          geometry: {
            type: "Point",
            coordinates: coordinates,
          },
        };
      });

      // Update the source data
      (map.getSource("demand-regions") as mapboxgl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features,
      });
    }
  }, [map, heatmapData]);

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFilters((prev) => ({
        ...prev,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        weekNumber: getWeekNumber(date),
      }));
    }
  };

  // Get week number from date
  function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof DemandInsightsFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Find top opportunity regions
  const getTopOpportunities = () => {
    if (!heatmapData) return [];

    return [...heatmapData]
      .sort((a, b) => (b.avgRate || 0) - (a.avgRate || 0))
      .slice(0, 5)
      .map((region) => ({
        region: region.region || region.regionId || "Unknown",
        loadCount: region.totalLoads || region.loadCount || 0,
        avgRate: region.avgRate || 0,
      }));
  };

  return (
    <div className="container mx-auto p-4 bg-background">
      <h1 className="text-2xl font-bold mb-6">Freight Demand Insights</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* Filters Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Market Filters</CardTitle>
            <CardDescription>Find freight opportunities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Time Period</label>
              <Select
                value={filters.timeframe}
                onValueChange={(value) =>
                  handleFilterChange("timeframe", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium">Region</label>
              <Select
                value={filters.region || ""}
                onValueChange={(value) =>
                  handleFilterChange("region", value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Regions</SelectItem>
                  <SelectItem value="CA">California</SelectItem>
                  <SelectItem value="TX">Texas</SelectItem>
                  <SelectItem value="FL">Florida</SelectItem>
                  <SelectItem value="NY">New York</SelectItem>
                  <SelectItem value="IL">Illinois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Your Equipment</label>
              <Select
                value={filters.equipmentType || ""}
                onValueChange={(value) =>
                  handleFilterChange("equipmentType", value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Equipment</SelectItem>
                  {equipmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Top Opportunities Card */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Top Rate Opportunities</CardTitle>
            <CardDescription>
              Regions with the highest rates for{" "}
              {filters.equipmentType || "all equipment types"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getTopOpportunities().map((opportunity, index) => (
                <Card
                  key={index}
                  className={`overflow-hidden border-l-4 ${index === 0 ? "border-l-red-500" : index === 1 ? "border-l-orange-500" : "border-l-yellow-500"}`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">
                          {opportunity.region}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {opportunity.loadCount} loads available
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-primary">
                          ${opportunity.avgRate.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          avg rate/mile
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="map">
              <MapIcon className="mr-2 h-4 w-4" />
              Market Map
            </TabsTrigger>
            <TabsTrigger value="trends">
              <TrendingUpIcon className="mr-2 h-4 w-4" />
              Rate Trends
            </TabsTrigger>
            <TabsTrigger value="equipment">
              <BarChart3Icon className="mr-2 h-4 w-4" />
              Equipment Demand
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Regional Demand Map</CardTitle>
                <CardDescription>
                  Larger circles indicate more loads, color indicates rate level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div id="carrier-map" className="w-full h-[500px] rounded-md" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rate Trends</CardTitle>
                <CardDescription>
                  Historical rate trends{" "}
                  {filters.region ? `for ${filters.region}` : "nationwide"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trendData ? (
                  <div className="h-[400px] flex items-center justify-center">
                    {/* Implement chart visualization here */}
                    <p className="text-muted-foreground">
                      Rate trend visualization would be implemented here with a
                      charting library
                    </p>
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Loading trend data...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Type Demand</CardTitle>
                <CardDescription>
                  Distribution of equipment types in demand
                </CardDescription>
              </CardHeader>
              <CardContent>
                {heatmapData ? (
                  <div className="h-[400px] flex items-center justify-center">
                    {/* Implement equipment breakdown chart here */}
                    <p className="text-muted-foreground">
                      Equipment demand visualization would be implemented here
                      with a charting library
                    </p>
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Loading equipment data...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DemandInsightsDashboard;
