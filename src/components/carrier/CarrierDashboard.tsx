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
import LiveTrackingMap from "@/components/shared/LiveTrackingMap";
import { format } from "date-fns";
import {
  Truck,
  Package,
  Users,
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
} from "lucide-react";

// Mock data for demonstration
const mockLoads = [
  {
    id: "L-1234",
    status: "in_transit",
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
  },
  {
    id: "L-1235",
    status: "assigned",
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
  },
  {
    id: "L-1236",
    status: "delivered",
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
  },
];

const mockDrivers = [
  {
    id: "D-101",
    name: "John Smith",
    phone: "(555) 123-4567",
    email: "john.smith@example.com",
    status: "active",
    location: {
      latitude: 41.8781,
      longitude: -87.6298,
      lastUpdated: new Date().toISOString(),
    },
    vehicle: {
      id: "V-001",
      type: "Dry Van",
      licensePlate: "ABC123",
    },
    currentLoad: "L-1234",
    hoursOfService: {
      drivingHours: 4.5,
      dutyHours: 6.0,
      remainingDrivingHours: 6.5,
    },
  },
  {
    id: "D-102",
    name: "Sarah Johnson",
    phone: "(555) 987-6543",
    email: "sarah.johnson@example.com",
    status: "active",
    location: {
      latitude: 41.8339,
      longitude: -87.8722,
      lastUpdated: new Date().toISOString(),
    },
    vehicle: {
      id: "V-002",
      type: "Reefer",
      licensePlate: "XYZ789",
    },
    currentLoad: "L-1235",
    hoursOfService: {
      drivingHours: 2.0,
      dutyHours: 3.5,
      remainingDrivingHours: 9.0,
    },
  },
  {
    id: "D-103",
    name: "Michael Brown",
    phone: "(555) 456-7890",
    email: "michael.brown@example.com",
    status: "available",
    location: {
      latitude: 41.6005,
      longitude: -93.6091,
      lastUpdated: new Date().toISOString(),
    },
    vehicle: {
      id: "V-003",
      type: "Flatbed",
      licensePlate: "DEF456",
    },
    currentLoad: null,
    hoursOfService: {
      drivingHours: 0,
      dutyHours: 1.5,
      remainingDrivingHours: 11.0,
    },
  },
  {
    id: "D-104",
    name: "Emily Davis",
    phone: "(555) 789-0123",
    email: "emily.davis@example.com",
    status: "off_duty",
    location: {
      latitude: 39.7392,
      longitude: -104.9903,
      lastUpdated: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
    vehicle: {
      id: "V-004",
      type: "Tanker",
      licensePlate: "GHI789",
    },
    currentLoad: null,
    hoursOfService: {
      drivingHours: 0,
      dutyHours: 0,
      remainingDrivingHours: 11.0,
    },
  },
];

const mockAnalytics = {
  activeLoads: 2,
  deliveredLoads: 1,
  totalDrivers: 4,
  activeDrivers: 2,
  availableDrivers: 1,
  offDutyDrivers: 1,
  revenue: {
    today: 850,
    week: 2800,
    month: 12500,
  },
  performance: {
    onTimeDelivery: 92,
    customerSatisfaction: 4.7,
    avgLoadTime: 3.2, // hours
  },
};

interface CarrierDashboardProps {}

const CarrierDashboard: React.FC<CarrierDashboardProps> = () => {
  const [loads, setLoads] = useState(mockLoads);
  const [drivers, setDrivers] = useState(mockDrivers);
  const [analytics, setAnalytics] = useState(mockAnalytics);
  const [selectedLoad, setSelectedLoad] = useState<any | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("24h");
  const webSocketService = useRef(WebSocketService.getInstance());

  // Connect to WebSocket on mount
  useEffect(() => {
    webSocketService.current.connect();

    // Subscribe to load updates
    loads.forEach((load) => {
      webSocketService.current.subscribeToLoad(load.id);
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
        load.driver.name.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Handle load selection
  const handleLoadSelect = (load: any) => {
    setSelectedLoad(load);
    setSelectedDriver(null);
  };

  // Handle driver selection
  const handleDriverSelect = (driver: any) => {
    setSelectedDriver(driver);
    setSelectedLoad(null);
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
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

  // Get driver status badge
  const getDriverStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "available":
        return <Badge variant="secondary">Available</Badge>;
      case "off_duty":
        return <Badge variant="outline">Off Duty</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Carrier Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your fleet and track shipments
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Add Driver
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Active Loads</p>
              <p className="text-2xl font-bold">{analytics.activeLoads}</p>
              <p className="text-xs text-muted-foreground">
                Total: {loads.length}
              </p>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <Package className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Active Drivers</p>
              <p className="text-2xl font-bold">{analytics.activeDrivers}</p>
              <p className="text-xs text-muted-foreground">
                Available: {analytics.availableDrivers}
              </p>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Revenue (Today)</p>
              <p className="text-2xl font-bold">${analytics.revenue.today}</p>
              <p className="text-xs text-green-500 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12% from yesterday
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
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  On-Time Delivery
                </p>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 text-xs"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  AI Enhanced
                </Badge>
              </div>
              <p className="text-2xl font-bold">
                {analytics.performance.onTimeDelivery}%
              </p>
              <p className="text-xs text-green-500 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +3% from last week
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
        {/* Left Column - Loads & Drivers Lists */}
        <div className="lg:col-span-1 space-y-6">
          <Tabs defaultValue="loads">
            <TabsList className="w-full">
              <TabsTrigger value="loads" className="flex-1">
                <Package className="h-4 w-4 mr-2" /> Loads
              </TabsTrigger>
              <TabsTrigger value="drivers" className="flex-1">
                <Truck className="h-4 w-4 mr-2" /> Drivers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="loads" className="space-y-4 mt-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search loads..."
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
                    No loads match your filters
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
                            <div className="font-medium flex items-center">
                              {load.id}
                              {getStatusBadge(load.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {load.type}
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
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span>{load.driver.name}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span>
                              {format(new Date(load.eta), "MMM d, h:mm a")}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="drivers" className="space-y-4 mt-4">
              {/* Driver Filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search drivers..." className="pl-10" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="off_duty">Off Duty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Drivers List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {drivers.map((driver) => (
                  <Card
                    key={driver.id}
                    className={`cursor-pointer hover:border-primary transition-colors ${selectedDriver?.id === driver.id ? "border-primary" : ""}`}
                    onClick={() => handleDriverSelect(driver)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {driver.name}
                            {getDriverStatusBadge(driver.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {driver.vehicle.type} •{" "}
                            {driver.vehicle.licensePlate}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-2 text-muted-foreground" />
                          <span>{driver.phone}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                          <span>{driver.email}</span>
                        </div>
                      </div>

                      <div className="mt-2 flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span>
                            Last updated:{" "}
                            {format(
                              new Date(driver.location.lastUpdated),
                              "h:mm a",
                            )}
                          </span>
                        </div>
                        <div>
                          {driver.currentLoad ? (
                            <Badge variant="outline" className="text-xs">
                              Load: {driver.currentLoad}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs bg-green-50 text-green-700 border-green-200"
                            >
                              Available
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
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
              {selectedLoad ? (
                <LiveTrackingMap
                  loadId={selectedLoad.id}
                  driverId={selectedLoad.driver.id}
                  driverLocation={{
                    latitude: selectedLoad.driver.location.latitude,
                    longitude: selectedLoad.driver.location.longitude,
                    heading: 0,
                    speed: 55,
                    timestamp: selectedLoad.driver.location.lastUpdated,
                  }}
                  pickupLocation={{
                    coordinates: {
                      latitude: 41.8781,
                      longitude: -87.6298,
                    },
                    address: selectedLoad.pickup.address,
                    city: selectedLoad.pickup.location.split(",")[0].trim(),
                    state: selectedLoad.pickup.location.split(",")[1].trim(),
                    zipCode: "60601",
                  }}
                  deliveryLocation={{
                    coordinates: {
                      latitude: 43.0389,
                      longitude: -87.9065,
                    },
                    address: selectedLoad.delivery.address,
                    city: selectedLoad.delivery.location.split(",")[0].trim(),
                    state: selectedLoad.delivery.location.split(",")[1].trim(),
                    zipCode: "53202",
                  }}
                  routeGeometry={selectedLoad.routeGeometry}
                  eta={selectedLoad.eta}
                  status={selectedLoad.status}
                  height="400px"
                  showControls={false}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-muted/20">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>Select a load to view tracking details</p>
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
                    Load Details
                  </>
                ) : selectedDriver ? (
                  <>
                    <User className="h-5 w-5 mr-2" />
                    Driver Details
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5 mr-2" />
                    Details
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
                          <Badge variant="outline" className="mt-1">
                            ETA: {format(new Date(selectedLoad.eta), "h:mm a")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Driver Info */}
                  <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Truck className="h-4 w-4 mr-2" />
                      Driver Information
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Name</p>
                        <p>{selectedLoad.driver.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p>{selectedLoad.driver.phone}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">
                          Current Location
                        </p>
                        <p className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1 text-red-500" />
                          Lat:{" "}
                          {selectedLoad.driver.location.latitude.toFixed(4)},
                          Lng:{" "}
                          {selectedLoad.driver.location.longitude.toFixed(4)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last updated:{" "}
                          {format(
                            new Date(selectedLoad.driver.location.lastUpdated),
                            "MMM d, h:mm a",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

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

                  {/* AI Insights Panel */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-2 flex items-center text-blue-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                      AI Route Insights
                    </h4>
                    <div className="text-sm text-blue-700">
                      <p className="mb-2">
                        Based on historical data and current conditions:
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>
                          ETA confidence is <strong>92%</strong> for on-time
                          delivery
                        </li>
                        <li>
                          Weather conditions along I-94 show{" "}
                          <strong>light rain</strong> that may slow traffic
                        </li>
                        <li>
                          Recommended departure:{" "}
                          <strong>15 minutes earlier</strong> than scheduled
                        </li>
                        <li>
                          Alternative route via Highway 43 could save 8 minutes
                        </li>
                      </ul>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">Confidence:</span>
                          <div className="w-20 h-2 bg-blue-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600"
                              style={{ width: "92%" }}
                            ></div>
                          </div>
                          <span className="text-xs">92%</span>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-xs flex items-center gap-1 text-blue-700 hover:text-blue-900">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                            </svg>
                            Helpful
                          </button>
                          <button className="text-xs flex items-center gap-1 text-blue-700 hover:text-blue-900">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                            </svg>
                            Not Helpful
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Documents
                    </Button>
                    <Button size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact Driver
                    </Button>
                  </div>
                </div>
              ) : selectedDriver ? (
                <div className="space-y-4">
                  {/* Driver Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">
                        {selectedDriver.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getDriverStatusBadge(selectedDriver.status)}
                        <span className="text-sm text-muted-foreground">
                          {selectedDriver.vehicle.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Driver Contact Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p>{selectedDriver.phone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p>{selectedDriver.email}</p>
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Truck className="h-4 w-4 mr-2" />
                      Vehicle Information
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p>{selectedDriver.vehicle.type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">License Plate</p>
                        <p>{selectedDriver.vehicle.licensePlate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Hours of Service */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Hours of Service
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Driving Hours</p>
                        <p>{selectedDriver.hoursOfService.drivingHours} hrs</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duty Hours</p>
                        <p>{selectedDriver.hoursOfService.dutyHours} hrs</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p>
                          {selectedDriver.hoursOfService.remainingDrivingHours}{" "}
                          hrs
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Current Location */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Current Location
                    </h4>
                    <div className="text-sm">
                      <p>
                        Latitude: {selectedDriver.location.latitude.toFixed(4)},
                        Longitude:{" "}
                        {selectedDriver.location.longitude.toFixed(4)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last updated:{" "}
                        {format(
                          new Date(selectedDriver.location.lastUpdated),
                          "MMM d, h:mm a",
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Current Load */}
                  {selectedDriver.currentLoad ? (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        Current Assignment
                      </h4>
                      <div className="text-sm">
                        <p>Load ID: {selectedDriver.currentLoad}</p>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-sm"
                          onClick={() => {
                            const load = loads.find(
                              (l) => l.id === selectedDriver.currentLoad,
                            );
                            if (load) handleLoadSelect(load);
                          }}
                        >
                          View load details
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 rounded-lg text-green-700 text-sm">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <p>Driver is available for new assignments</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Documents
                    </Button>
                    <Button size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact Driver
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Clipboard className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>Select a load or driver to view details</p>
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

export default CarrierDashboard;
