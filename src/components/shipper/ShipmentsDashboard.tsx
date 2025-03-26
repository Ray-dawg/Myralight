import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Plus,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  RefreshCw,
} from "lucide-react";
import { FilterDialog } from "@/components/ui/filter-dialog";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  formatShipmentsForExport,
  exportToCSV,
  exportToExcel,
} from "./ExportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import MapComponent from "@/components/shared/MapComponent";

interface ShipmentMetrics {
  etaConfidence: number;
  costPerMile: number;
  co2Emissions: number;
  carrierScore: number;
}

interface Shipment {
  id: string;
  origin: string;
  destination: string;
  status: "pending" | "in_transit" | "delivered" | "cancelled";
  carrier?: string;
  driver?: string;
  pickupDate: string;
  deliveryDate: string;
  weight: string;
  type: string;
  rate: number;
  metrics?: ShipmentMetrics;
  estimatedArrival?: string;
  delayProbability?: number;
  weatherImpact?: "none" | "low" | "medium" | "high";
  bolStatus?: "pending" | "uploaded" | "verified" | "rejected";
  bolId?: string;
  bolUploadDate?: string;
}

export default function ShipmentsDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bolView, setBolView] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from Supabase
      // For now, we'll use the mock data but simulate a backend call
      const mockShipments = [
        {
          id: "SHP-2024-001",
          origin: "Chicago, IL",
          destination: "Milwaukee, WI",
          status: "in_transit",
          carrier: "FastFreight Inc.",
          driver: "John Smith",
          pickupDate: "2024-02-20",
          deliveryDate: "2024-02-20",
          weight: "15,000 lbs",
          type: "Dry Van",
          rate: 850,
          metrics: {
            etaConfidence: 92,
            costPerMile: 2.8,
            co2Emissions: 450,
            carrierScore: 4.8,
          },
          estimatedArrival: "2024-02-20 15:30",
          delayProbability: 12,
          weatherImpact: "low",
          bolStatus: "uploaded",
          bolId: "BOL-2024-001",
          bolUploadDate: "2024-02-20 10:15",
        },
        {
          id: "SHP-2024-002",
          origin: "Chicago, IL",
          destination: "Milwaukee, WI",
          status: "in_transit",
          carrier: "FastFreight Inc.",
          driver: "John Smith",
          pickupDate: "2024-02-20",
          deliveryDate: "2024-02-20",
          weight: "15,000 lbs",
          type: "Dry Van",
          rate: 850,
          bolStatus: "pending",
        },
        {
          id: "SHP-2024-003",
          origin: "Milwaukee, WI",
          destination: "Minneapolis, MN",
          status: "pending",
          pickupDate: "2024-02-22",
          deliveryDate: "2024-02-22",
          weight: "22,000 lbs",
          type: "Reefer",
          rate: 1200,
        },
        {
          id: "SHP-2024-004",
          origin: "Minneapolis, MN",
          destination: "Des Moines, IA",
          status: "delivered",
          carrier: "MidWest Logistics",
          driver: "Mike Johnson",
          pickupDate: "2024-02-18",
          deliveryDate: "2024-02-18",
          weight: "18,000 lbs",
          type: "Flatbed",
          rate: 950,
          bolStatus: "verified",
          bolId: "BOL-2024-004",
          bolUploadDate: "2024-02-18 16:45",
        },
      ];

      try {
        // Simulate fetching BOL documents and updating shipment data
        const { data: bolDocs, error } = await supabase
          .from("documents")
          .select("*")
          .eq("category", "bol");

        if (error) throw error;
      } catch (supabaseError) {
        console.error("Supabase error:", supabaseError);
        // Continue with mock data even if Supabase fails
      }

      // In a real implementation, we would match BOL docs to shipments
      // For now, we'll just use our mock data
      setShipments(mockShipments);
    } catch (error) {
      console.error("Error fetching shipments:", error);
      setShipments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: Shipment["status"]) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      in_transit: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    const labels = {
      pending: "Pending",
      in_transit: "In Transit",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };

    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const getBolStatusBadge = (bolStatus?: Shipment["bolStatus"]) => {
    if (!bolStatus) return null;

    const styles = {
      pending: "bg-gray-100 text-gray-800",
      uploaded: "bg-blue-100 text-blue-800",
      verified: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    const labels = {
      pending: "BOL Pending",
      uploaded: "BOL Uploaded",
      verified: "BOL Verified",
      rejected: "BOL Rejected",
    };

    const icons = {
      pending: <Clock className="h-3 w-3 mr-1" />,
      uploaded: <FileText className="h-3 w-3 mr-1" />,
      verified: <CheckCircle className="h-3 w-3 mr-1" />,
      rejected: <AlertCircle className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge className={`${styles[bolStatus]} flex items-center`}>
        {icons[bolStatus]}
        {labels[bolStatus]}
      </Badge>
    );
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const handleExport = (format: "csv" | "excel") => {
    const formattedData = formatShipmentsForExport(shipments);
    if (format === "csv") {
      exportToCSV(formattedData, "shipments");
    } else {
      exportToExcel(formattedData, "shipments");
    }
  };

  const handleApplyFilters = (filters: Record<string, any>) => {
    console.log("Applied filters:", filters);
    // In a real app, you would filter the shipments based on these filters
  };

  const filterOptions = [
    {
      label: "Status",
      value: "status",
      type: "select" as const,
      options: [
        { label: "All", value: "all" },
        { label: "Pending", value: "pending" },
        { label: "In Transit", value: "in_transit" },
        { label: "Delivered", value: "delivered" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
    {
      label: "Carrier",
      value: "carrier",
      type: "select" as const,
      options: [
        { label: "All Carriers", value: "all" },
        { label: "FastFreight Inc.", value: "fastfreight" },
        { label: "MidWest Logistics", value: "midwest" },
        { label: "Premier Transport", value: "premier" },
      ],
    },
    {
      label: "Shipment Type",
      value: "type",
      type: "select" as const,
      options: [
        { label: "All Types", value: "all" },
        { label: "Dry Van", value: "dry_van" },
        { label: "Reefer", value: "reefer" },
        { label: "Flatbed", value: "flatbed" },
      ],
    },
    {
      label: "Origin",
      value: "origin",
      type: "input" as const,
    },
    {
      label: "Destination",
      value: "destination",
      type: "input" as const,
    },
  ];

  // Filter shipments based on active tab
  const filteredShipments = shipments.filter((shipment) => {
    if (activeTab === "all") return true;
    return shipment.status === activeTab;
  });

  // Further filter by search query if present
  const searchedShipments = searchQuery
    ? filteredShipments.filter(
        (shipment) =>
          shipment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shipment.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shipment.destination
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (shipment.carrier &&
            shipment.carrier.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : filteredShipments;

  return (
    <div className="h-screen relative overflow-hidden">
      {/* Map Container */}
      <div className="absolute inset-0">
        <MapComponent
          markers={searchedShipments.map((shipment) => ({
            id: shipment.id,
            latitude: shipment.origin.includes("Chicago")
              ? 41.8781
              : shipment.origin.includes("Milwaukee")
                ? 43.0389
                : shipment.origin.includes("Minneapolis")
                  ? 44.9778
                  : shipment.origin.includes("Des Moines")
                    ? 41.6005
                    : 41.8781,
            longitude: shipment.origin.includes("Chicago")
              ? -87.6298
              : shipment.origin.includes("Milwaukee")
                ? -87.9065
                : shipment.origin.includes("Minneapolis")
                  ? -93.265
                  : shipment.origin.includes("Des Moines")
                    ? -93.6091
                    : -87.6298,
            color:
              shipment.status === "pending"
                ? "#EAB308"
                : shipment.status === "in_transit"
                  ? "#3B82F6"
                  : shipment.status === "delivered"
                    ? "#22C55E"
                    : "#EF4444",
            popupContent: `<div class="p-2"><strong>${shipment.id}</strong><br/>From: ${shipment.origin}<br/>To: ${shipment.destination}</div>`,
          }))}
          zoom={4}
          style={{ width: "100%", height: "100%" }}
          userType="shipper"
        />
      </div>

      {/* View Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white rounded-md shadow-md p-1 flex">
          <Button
            variant={!bolView ? "default" : "ghost"}
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setBolView(false)}
          >
            <MapPin className="h-4 w-4" />
            Shipments
          </Button>
          <Button
            variant={bolView ? "default" : "ghost"}
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setBolView(true)}
          >
            <FileText className="h-4 w-4" />
            BOL Documents
          </Button>
        </div>
      </div>

      {/* Shipments Panel */}
      <div
        className={`absolute top-28 left-4 md:left-28 w-96 max-h-[calc(100vh-8rem)] overflow-y-auto space-y-4 ${bolView ? "hidden" : ""}`}
      >
        {/* Actions */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Shipments</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchShipments}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search shipments..."
                className="pl-10"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className="flex gap-2">
              <FilterDialog
                title="Filter Shipments"
                filters={filterOptions}
                onApplyFilters={handleApplyFilters}
              />

              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                className="w-auto"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport("csv")}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("excel")}>
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                className="flex items-center gap-2 ml-auto"
                onClick={() => navigate("/shipper/load-creation")}
              >
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-1">
              <Button
                variant={activeTab === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("all")}
              >
                All
              </Button>
              <Button
                variant={activeTab === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("pending")}
              >
                Pending
              </Button>
              <Button
                variant={activeTab === "in_transit" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("in_transit")}
              >
                In Transit
              </Button>
              <Button
                variant={activeTab === "delivered" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("delivered")}
              >
                Delivered
              </Button>
            </div>
          </div>
        </Card>

        {/* Shipment Cards */}
        {isLoading ? (
          <Card className="p-6 flex justify-center items-center">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </Card>
        ) : searchedShipments.length > 0 ? (
          searchedShipments.map((shipment) => (
            <Card key={shipment.id} className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{shipment.id}</h3>
                    <p className="text-sm text-gray-500">{shipment.type}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {getStatusBadge(shipment.status)}
                    {getBolStatusBadge(shipment.bolStatus)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Origin</p>
                      <p className="font-medium">{shipment.origin}</p>
                      <p className="text-sm text-gray-500">
                        {shipment.pickupDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Destination</p>
                      <p className="font-medium">{shipment.destination}</p>
                      <p className="text-sm text-gray-500">
                        {shipment.deliveryDate}
                      </p>
                    </div>
                  </div>
                </div>

                {shipment.carrier && (
                  <div className="text-sm text-gray-500">
                    Carrier:{" "}
                    <span className="font-medium">{shipment.carrier}</span>
                    {shipment.driver && (
                      <>
                        {" "}
                        • Driver:{" "}
                        <span className="font-medium">{shipment.driver}</span>
                      </>
                    )}
                  </div>
                )}

                {shipment.metrics && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Cost/Mile:</span>
                      <span className="ml-2">
                        ${shipment.metrics.costPerMile}/mi
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Carrier Score:</span>
                      <span className="ml-2">
                        {shipment.metrics.carrierScore}/5
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">CO₂:</span>
                      <span className="ml-2">
                        {shipment.metrics.co2Emissions}kg
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">ETA Confidence:</span>
                      <span className="ml-2">
                        {shipment.metrics.etaConfidence}%
                      </span>
                    </div>
                  </div>
                )}
                {shipment.estimatedArrival && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <span className="text-gray-500">ETA:</span>
                        <span className="ml-2 font-medium">
                          {new Date(
                            shipment.estimatedArrival,
                          ).toLocaleTimeString()}
                        </span>
                        <Badge
                          variant="outline"
                          className="ml-2 bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"
                        >
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
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                          </svg>
                          AI Enhanced
                        </Badge>
                      </div>
                      {shipment.delayProbability && (
                        <Badge
                          variant="outline"
                          className="text-yellow-600 flex items-center gap-1"
                        >
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
                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          {shipment.delayProbability}% Delay Risk
                        </Badge>
                      )}
                    </div>
                    {shipment.metrics?.etaConfidence > 0 && (
                      <div className="bg-blue-50 p-2 rounded-md text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-blue-700">
                            AI Insight
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-blue-700">Confidence:</span>
                            <div className="w-16 h-2 bg-blue-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600"
                                style={{
                                  width: `${shipment.metrics.etaConfidence}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-blue-700">
                              {shipment.metrics.etaConfidence}%
                            </span>
                          </div>
                        </div>
                        <p className="text-blue-700">
                          This shipment may experience light traffic near
                          Milwaukee due to ongoing construction. Consider
                          adjusting delivery expectations by 15-20 minutes.
                        </p>
                        <div className="flex justify-end mt-1">
                          <button className="text-blue-700 hover:text-blue-900 text-xs flex items-center gap-1">
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
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">
                      {shipment.weight}
                    </div>
                    <div className="font-medium text-lg">${shipment.rate}</div>
                  </div>
                  <div className="flex gap-2">
                    {shipment.bolId && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                navigate(
                                  `/shipper/documents/bol/${shipment.bolId}`,
                                )
                              }
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View BOL Document</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(`/shipper/shipments/${shipment.id}`)
                      }
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6">
            <div className="text-center py-8">
              <p className="text-gray-500">
                No shipments found matching your criteria.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("all");
                  setDateRange(undefined);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* BOL Documents Panel */}
      {bolView && (
        <div className="absolute top-28 left-4 md:left-28 right-4 md:right-28 bg-white rounded-lg shadow-lg p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">BOL Documents</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/shipper/documents/bol")}
                className="flex items-center gap-2"
              >
                <Layers className="h-4 w-4" />
                View All Documents
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchShipments}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shipments
              .filter((shipment) => shipment.bolStatus)
              .map((shipment) => (
                <Card
                  key={`bol-${shipment.id}`}
                  className="p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">
                        BOL: {shipment.bolId || "N/A"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Shipment: {shipment.id}
                      </p>
                    </div>
                    {getBolStatusBadge(shipment.bolStatus)}
                  </div>

                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Origin:</span>
                      <span>{shipment.origin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Destination:</span>
                      <span>{shipment.destination}</span>
                    </div>
                    {shipment.bolUploadDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Uploaded:</span>
                        <span>{shipment.bolUploadDate}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        shipment.bolId &&
                        navigate(`/shipper/documents/bol/${shipment.bolId}`)
                      }
                      className="flex items-center gap-2"
                      disabled={!shipment.bolId}
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                    </Button>
                  </div>
                </Card>
              ))}

            {shipments.filter((shipment) => shipment.bolStatus).length ===
              0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  No BOL Documents Found
                </h3>
                <p className="text-gray-500 mt-2 max-w-md">
                  There are no BOL documents associated with your shipments yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
