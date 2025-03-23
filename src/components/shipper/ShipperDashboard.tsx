import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WebSocketService } from "@/api/services/websocket.service";
import MapComponent from "@/components/shared/MapComponent";
import RouteMap from "@/components/shared/RouteMap";
import { format } from "date-fns";
import {
  Truck,
  Package,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  BarChart3,
  Layers,
  FileText,
  Phone,
  Mail,
  User,
  Clipboard,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
  BarChart,
  PieChart,
  LineChart,
} from "lucide-react";

// Mock data for demonstration
const mockLoads = [
  {
    id: "L-1234",
    status: "in_transit",
    carrier: {
      id: "C-101",
      name: "ABC Trucking",
      phone: "(555) 123-4567",
    },
    driver: {
      id: "D-101",
      name: "John Smith",
      phone: "(555) 123-4567",
      location: {
        latitude: 41.8781,
        longitude: -87.6298,
        lastUpdated: new Date().toISOString(),
      },
    },
    pickup: {
      location: "Chicago, IL",
      address: "123 Main St, Chicago, IL 60601",
      time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      completed: true,
    },
    delivery: {
      location: "Milwaukee, WI",
      address: "456 Elm St, Milwaukee, WI 53202",
      time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      completed: false,
    },
    distance: "92 miles",
    rate: 850,
    weight: "15,000 lbs",
    type: "Dry Van",
    eta: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    routeGeometry: [
      [-87.6298, 41.8781],
      [-87.9067, 42.1083],
      [-87.9067, 42.5083],
      [-87.9067, 42.9083],
      [-87.9067, 43.0365],
    ],
    commodity: "Electronics",
    reference: "PO-78901",
    created: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "L-1235",
    status: "assigned",
    carrier: {
      id: "C-102",
      name: "XYZ Logistics",
      phone: "(555) 987-6543",
    },
    driver: {
      id: "D-102",
      name: "Sarah Johnson",
      phone: "(555) 987-6543",
      location: {
        latitude: 41.8339,
        longitude: -87.8722,
        lastUpdated: new Date().toISOString(),
      },
    },
    pickup: {
      location: "Chicago, IL",
      address: "789 Oak St, Chicago, IL 60607",
      time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      completed: false,
    },
    delivery: {
      location: "Minneapolis, MN",
      address: "101 Pine St, Minneapolis, MN 55403",
      time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      completed: false,
    },
    distance: "400 miles",
    rate: 1200,
    weight: "22,000 lbs",
    type: "Reefer",
    eta: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    commodity: "Frozen Food",
    reference: "PO-78902",
    created: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "L-1236",
    status: "delivered",
    carrier: {
      id: "C-103",
      name: "Fast Freight Inc",
      phone: "(555) 456-7890",
    },
    driver: {
      id: "D-103",
      name: "Michael Brown",
      phone: "(555) 456-7890",
      location: {
        latitude: 41.6005,
        longitude: -93.6091,
        lastUpdated: new Date().toISOString(),
      },
    },
    pickup: {
      location: "Des Moines, IA",
      address: "202 Maple St, Des Moines, IA 50309",
      time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      completed: true,
    },
    delivery: {
      location: "Kansas City, MO",
      address: "303 Walnut St, Kansas City, MO 64106",
      time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      completed: true,
    },
    distance: "200 miles",
    rate: 750,
    weight: "18,000 lbs",
    type: "Flatbed",
    eta: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    commodity: "Construction Materials",
    reference: "PO-78903",
    created: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "L-1237",
    status: "posted",
    carrier: null,
    driver: null,
    pickup: {
      location: "St. Louis, MO",
      address: "404 Cedar St, St. Louis, MO 63101",
      time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      completed: false,
    },
    delivery: {
      location: "Nashville, TN",
      address: "505 Birch St, Nashville, TN 37203",
      time: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
      completed: false,
    },
    distance: "310 miles",
    rate: 950,
    weight: "12,000 lbs",
    type: "Dry Van",
    eta: null,
    commodity: "Retail Goods",
    reference: "PO-78904",
    created: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

const mockAnalytics = {
  activeLoads: 2,
  deliveredLoads: 1,
  postedLoads: 1,
  totalSpend: {
    today: 850,
    week: 2800,
    month: 12500,
  },
  performance: {
    onTimeDelivery: 92,
    avgTransitTime: 2.3, // days
    avgCostPerMile: 2.75, // dollars
  },
  topLanes: [
    { origin: "Chicago, IL", destination: "Milwaukee, WI", count: 12 },
    { origin: "Chicago, IL", destination: "Minneapolis, MN", count: 8 },
    { origin: "Des Moines, IA", destination: "Kansas City, MO", count: 5 },
  ],
};

interface ShipperDashboardProps {}

const ShipperDashboard: React.FC<ShipperDashboardProps> = () => {
  const [loads, setLoads] = useState(mockLoads);
  const [analytics, setAnalytics] = useState(mockAnalytics);
  const [selectedLoad, setSelectedLoad] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("24h");
  const webSocketService = useRef(WebSocketService.getInstance());

  // Connect to WebSocket on mount
  useEffect(() => {
    webSocketService.current.connect();

    // Subscribe to load updates
    loads.forEach((load) => {
      if (load.status !== "posted") {
        webSocketService.current.subscribeToLoad(load.id);
      }
    });

    // Cleanup on unmount
    return () => {
      webSocketService.current.disconnect();
    };
  }, []);

  // Filter loads based on status and search query
  const filteredLoads = loads.filter((load) => {
    // Apply status filter
    if (statusFilter !== "all" && load.status !== statusFilter) {
      return false;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        load.id.toLowerCase().includes(query) ||
        load.pickup.location.toLowerCase().includes(query) ||
        load.delivery.location.toLowerCase().includes(query) ||
        load.driver?.name?.toLowerCase().includes(query) ||
        false ||
        load.carrier?.name?.toLowerCase().includes(query) ||
        false ||
        load.reference.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Handle load selection
  const handleLoadSelect = (load: any) => {
    setSelectedLoad(load);
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "posted":
        return <Badge variant="outline">Posted</Badge>;
      case "assigned":
        return <Badge variant="outline">Assigned</Badge>;
      case "in_transit":
        return <Badge variant="secondary">In Transit</Badge>;
      case "delivered":
        return <Badge variant="success">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Shipper Dashboard</h1>
          <p className="text-muted-foreground">
            Track your shipments and manage your loads
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Load
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Active Shipments</p>
              <p className="text-2xl font-bold">{analytics.activeLoads}</p>
              <p className="text-xs text-muted-foreground">
                Total: {loads.length}
              </p>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <Truck className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Posted Loads</p>
              <p className="text-2xl font-bold">{analytics.postedLoads}</p>
              <p className="text-xs text-muted-foreground">Awaiting carriers</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <Package className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Spend (Today)</p>
              <p className="text-2xl font-bold">
                ${analytics.totalSpend.today}
              </p>
              <p className="text-xs text-red-500 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8% from yesterday
              </p>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">On-Time Delivery</p>
              <p className="text-2xl font-bold">
                {analytics.performance.onTimeDelivery}%
              </p>
              <p className="text-xs text-green-500 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +2% from last week
              </p>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <Clock className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Loads List */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Shipments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search shipments..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Loads List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {filteredLoads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No shipments match your filters
                  </div>
                ) : (
                  filteredLoads.map((load) => (
                    <Card
                      key={load.id}
                      className={`cursor-pointer hover:border-primary transition-colors ${selectedLoad?.id === load.id ? "border-primary" : ""}`}
                      onClick={() => handleLoadSelect(load)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {load.id}
                              {getStatusBadge(load.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {load.type} • {load.reference}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${load.rate}</p>
                            <p className="text-sm text-muted-foreground">
                              {load.distance}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 space-y-1">
                          <div className="flex items-start text-sm">
                            <MapPin className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                            <div>
                              <span className="text-muted-foreground">
                                From:{" "}
                              </span>
                              {load.pickup.location}
                            </div>
                          </div>
                          <div className="flex items-start text-sm">
                            <MapPin className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                            <div>
                              <span className="text-muted-foreground">
                                To:{" "}
                              </span>
                              {load.delivery.location}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 flex justify-between items-center text-sm">
                          {load.carrier ? (
                            <div className="flex items-center">
                              <Truck className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span>{load.carrier.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span>
                                {format(new Date(load.created), "MMM d")}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span>
                              {load.eta
                                ? format(new Date(load.eta), "MMM d, h:mm a")
                                : "Not assigned"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle & Right Columns - Map & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map View */}
          <Card className="overflow-hidden">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-lg flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Live Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[400px]">
              {selectedLoad && selectedLoad.driver ? (
                <RouteMap
                  origin={{
                    latitude: 41.8781,
                    longitude: -87.6298,
                  }}
                  destination={{
                    latitude: 43.0389,
                    longitude: -87.9065,
                  }}
                  waypoints={[
                    {
                      latitude: selectedLoad.driver.location.latitude,
                      longitude: selectedLoad.driver.location.longitude,
                    },
                  ]}
                  originLabel={selectedLoad.pickup.location}
                  destinationLabel={selectedLoad.delivery.location}
                  height="400px"
                  showControls={false}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-muted/20">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>
                      {selectedLoad
                        ? "This load is not yet assigned to a carrier"
                        : "Select a load to view tracking details"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details Panel */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg flex items-center">
                {selectedLoad ? (
                  <>
                    <Clipboard className="h-5 w-5 mr-2" />
                    Shipment Details
                  </>
                ) : (
                  <>
                    <BarChart className="h-5 w-5 mr-2" />
                    Performance Metrics
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {selectedLoad ? (
                <div className="space-y-4">
                  {/* Load Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{selectedLoad.id}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(selectedLoad.status)}
                        <span className="text-sm text-muted-foreground">
                          {selectedLoad.type}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">${selectedLoad.rate}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedLoad.distance}
                      </p>
                    </div>
                  </div>

                  {/* Reference & Commodity */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Reference</p>
                      <p>{selectedLoad.reference}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Commodity</p>
                      <p>{selectedLoad.commodity}</p>
                    </div>
                  </div>

                  {/* Load Timeline */}
                  <div className="space-y-3 mt-4">
                    <div className="flex items-start">
                      <div className="mr-3 relative">
                        <div
                          className={`h-5 w-5 rounded-full ${selectedLoad.pickup.completed ? "bg-green-500" : "bg-blue-500"} flex items-center justify-center`}
                        >
                          {selectedLoad.pickup.completed && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="h-full w-0.5 bg-gray-200 absolute top-5 left-2.5 bottom-0" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Pickup</p>
                        <p className="text-sm">
                          {selectedLoad.pickup.location}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedLoad.pickup.address}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(
                            new Date(selectedLoad.pickup.time),
                            "EEE, MMM d • h:mm a",
                          )}
                        </p>
                        {selectedLoad.pickup.completed && (
                          <Badge
                            variant="outline"
                            className="mt-1 text-green-700 bg-green-50 border-green-200"
                          >
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="mr-3">
                        <div
                          className={`h-5 w-5 rounded-full ${selectedLoad.delivery.completed ? "bg-green-500" : "bg-red-500"} flex items-center justify-center`}
                        >
                          {selectedLoad.delivery.completed && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Delivery</p>
                        <p className="text-sm">
                          {selectedLoad.delivery.location}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedLoad.delivery.address}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(
                            new Date(selectedLoad.delivery.time),
                            "EEE, MMM d • h:mm a",
                          )}
                        </p>
                        {selectedLoad.delivery.completed ? (
                          <Badge
                            variant="outline"
                            className="mt-1 text-green-700 bg-green-50 border-green-200"
                          >
                            Completed
                          </Badge>
                        ) : (
                          selectedLoad.eta && (
                            <Badge variant="outline" className="mt-1">
                              ETA:{" "}
                              {format(new Date(selectedLoad.eta), "h:mm a")}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Carrier & Driver Info */}
                  {selectedLoad.carrier ? (
                    <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center">
                        <Truck className="h-4 w-4 mr-2" />
                        Carrier Information
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Carrier</p>
                          <p>{selectedLoad.carrier.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Phone</p>
                          <p>{selectedLoad.carrier.phone}</p>
                        </div>
                        {selectedLoad.driver && (
                          <>
                            <div>
                              <p className="text-muted-foreground">Driver</p>
                              <p>{selectedLoad.driver.name}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Driver Phone
                              </p>
                              <p>{selectedLoad.driver.phone}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg text-amber-700 text-sm">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <p>This load is not yet assigned to a carrier</p>
                      </div>
                    </div>
                  )}

                  {/* Load Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Weight</p>
                      <p>{selectedLoad.weight}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Equipment Type</p>
                      <p>{selectedLoad.type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Distance</p>
                      <p>{selectedLoad.distance}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rate</p>
                      <p>${selectedLoad.rate}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Documents
                    </Button>
                    {selectedLoad.carrier ? (
                      <Button size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Contact Carrier
                      </Button>
                    ) : (
                      <Button size="sm">
                        <Truck className="h-4 w-4 mr-2" />
                        Find Carrier
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-muted/20 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        Avg. Cost/Mile
                      </p>
                      <p className="text-xl font-bold">
                        ${analytics.performance.avgCostPerMile}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        Avg. Transit Time
                      </p>
                      <p className="text-xl font-bold">
                        {analytics.performance.avgTransitTime} days
                      </p>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        On-Time Delivery
                      </p>
                      <p className="text-xl font-bold">
                        {analytics.performance.onTimeDelivery}%
                      </p>
                    </div>
                  </div>

                  {/* Top Lanes */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center">
                      <BarChart className="h-4 w-4 mr-2" />
                      Top Shipping Lanes
                    </h4>
                    <div className="space-y-2">
                      {analytics.topLanes.map((lane, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-1/2 flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                            <span>{lane.origin}</span>
                          </div>
                          <div className="w-1/2 flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-red-500" />
                            <span>{lane.destination}</span>
                          </div>
                          <div className="w-16 text-right">
                            <Badge variant="secondary">{lane.count}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Monthly Spend Chart Placeholder */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center">
                      <LineChart className="h-4 w-4 mr-2" />
                      Monthly Spend
                    </h4>
                    <div className="h-40 bg-muted/20 rounded-lg flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p>Chart would render here</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Report
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Load
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShipperDashboard;
