import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../lib/convex/_generated/api";
import {
  Search,
  Filter,
  Plus,
  Download,
  MapPin,
  Calendar,
  Clock,
  Package,
  Truck,
  Eye,
  AlertTriangle,
} from "lucide-react";

interface Load {
  id: string;
  pickup: {
    location: string;
    time: string;
  };
  delivery: {
    location: string;
    time: string;
  };
  status:
    | "draft"
    | "submitted"
    | "assigned"
    | "in_transit"
    | "delivered"
    | "cancelled";
  carrier?: string;
  driver?: string;
  commodity: string;
  weight: string;
  createdAt: string;
  budget?: string;
  alerts?: string[];
}

export default function LoadManagement() {
  const navigate = useNavigate();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch loads from Convex
  const convexLoads = useQuery(api.loads.getShipperLoads) || [];

  useEffect(() => {
    if (convexLoads && convexLoads.length > 0) {
      // Transform Convex data to match our interface
      const formattedLoads = convexLoads.map((load) => ({
        id: load._id,
        pickup: {
          location: load.pickupLocation?.address || "Unknown location",
          time: new Date(load.pickupWindowStart).toLocaleString(),
        },
        delivery: {
          location: load.deliveryLocation?.address || "Unknown location",
          time: new Date(load.deliveryWindowStart).toLocaleString(),
        },
        status: load.status,
        carrier: load.carrierId ? "Assigned" : undefined,
        driver: load.driverId ? "Assigned" : undefined,
        commodity: load.commodity,
        weight: `${load.weight} lbs`,
        createdAt: new Date(load.createdAt).toLocaleString(),
        budget: load.rate ? `$${(load.rate / 100).toFixed(2)}` : undefined,
        alerts: load.notes ? [load.notes] : undefined,
      }));

      setLoads(formattedLoads);
      setLoading(false);
    } else if (convexLoads && convexLoads.length === 0) {
      // If we got an empty array from Convex, we're done loading
      setLoading(false);
    }
  }, [convexLoads]);

  // Fallback data if no loads are loaded yet
  const fallbackLoads = [
    {
      id: "LD-2024-001",
      pickup: {
        location: "Chicago, IL",
        time: "2024-03-15 09:00 AM",
      },
      delivery: {
        location: "Milwaukee, WI",
        time: "2024-03-15 02:00 PM",
      },
      status: "submitted" as const,
      commodity: "Electronics",
      weight: "5,000 lbs",
      createdAt: "2024-03-10 14:30",
      budget: "$1,200",
    },
    {
      id: "LD-2024-002",
      pickup: {
        location: "Detroit, MI",
        time: "2024-03-16 10:00 AM",
      },
      delivery: {
        location: "Cleveland, OH",
        time: "2024-03-16 04:00 PM",
      },
      status: "assigned" as const,
      carrier: "FastFreight Logistics",
      driver: "John Smith",
      commodity: "Automotive Parts",
      weight: "12,000 lbs",
      createdAt: "2024-03-11 09:15",
      budget: "$2,500",
    },
    {
      id: "LD-2024-003",
      pickup: {
        location: "Minneapolis, MN",
        time: "2024-03-17 08:00 AM",
      },
      delivery: {
        location: "Des Moines, IA",
        time: "2024-03-17 02:00 PM",
      },
      status: "in_transit" as const,
      carrier: "Regional Transport",
      driver: "Sarah Johnson",
      commodity: "General Freight",
      weight: "18,000 lbs",
      createdAt: "2024-03-12 11:45",
      budget: "$3,200",
      alerts: ["Weather delay possible"],
    },
    {
      id: "LD-2024-004",
      pickup: {
        location: "St. Louis, MO",
        time: "2024-03-14 09:00 AM",
      },
      delivery: {
        location: "Nashville, TN",
        time: "2024-03-14 06:00 PM",
      },
      status: "delivered" as const,
      carrier: "Express Delivery",
      driver: "Mike Wilson",
      commodity: "Food & Beverages",
      weight: "15,000 lbs",
      createdAt: "2024-03-09 10:30",
      budget: "$2,800",
    },
    {
      id: "LD-2024-005",
      pickup: {
        location: "Indianapolis, IN",
        time: "2024-03-18 10:00 AM",
      },
      delivery: {
        location: "Columbus, OH",
        time: "2024-03-18 03:00 PM",
      },
      status: "draft" as const,
      commodity: "Retail Goods",
      weight: "8,000 lbs",
      createdAt: "2024-03-13 15:20",
      budget: "$1,500",
    },
  ];

  // Use fallback data if still loading
  const displayLoads = loading || loads.length === 0 ? fallbackLoads : loads;

  // Filter loads based on search term and status filter
  const filteredLoads = displayLoads.filter((load) => {
    const matchesSearch =
      searchTerm === "" ||
      load.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.commodity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.pickup.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.delivery.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || load.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Load["status"]) => {
    const styles = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-yellow-100 text-yellow-800",
      assigned: "bg-blue-100 text-blue-800",
      in_transit: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    const labels = {
      draft: "Draft",
      submitted: "Submitted",
      assigned: "Assigned",
      in_transit: "In Transit",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };

    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Shipments</h1>
          <p className="text-gray-500 mt-1">
            Manage and track all your shipments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate("/shipper/loads/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Shipment
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search shipments..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <select
                className="w-full h-10 px-3 border rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="assigned">Assigned</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter("all")}
              className={statusFilter === "all" ? "bg-gray-100" : ""}
            >
              All Shipments
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter("draft")}
              className={statusFilter === "draft" ? "bg-gray-100" : ""}
            >
              Drafts
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter("in_transit")}
              className={statusFilter === "in_transit" ? "bg-gray-100" : ""}
            >
              Active
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter("delivered")}
              className={statusFilter === "delivered" ? "bg-gray-100" : ""}
            >
              Delivered
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8">
          <p>Loading shipments...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoads.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500 mb-4">
                No shipments found matching your criteria
              </p>
              <Button onClick={() => navigate("/shipper/loads/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Shipment
              </Button>
            </div>
          ) : (
            filteredLoads.map((load) => (
              <Card key={load.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{load.id}</h3>
                        {getStatusBadge(load.status)}
                        {load.alerts && load.alerts.length > 0 && (
                          <Badge
                            variant="outline"
                            className="text-red-600 border-red-200 flex items-center gap-1"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Alert
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Created: {load.createdAt}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {load.status === "draft" && (
                        <Button size="sm">Submit</Button>
                      )}
                      <Button variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          <div className="w-2 h-2 rounded-full bg-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Pickup</p>
                          <p className="font-medium">{load.pickup.location}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <Clock className="h-3 w-3" />
                            {load.pickup.time}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          <div className="w-2 h-2 rounded-full bg-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Delivery</p>
                          <p className="font-medium">
                            {load.delivery.location}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <Clock className="h-3 w-3" />
                            {load.delivery.time}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Commodity</p>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <p className="font-medium">{load.commodity}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Weight</p>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-gray-400" />
                            <p className="font-medium">{load.weight}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Budget</p>
                          <p className="font-medium">{load.budget}</p>
                        </div>

                        {load.carrier && (
                          <div>
                            <p className="text-sm text-gray-500">Carrier</p>
                            <p className="font-medium">{load.carrier}</p>
                          </div>
                        )}
                      </div>

                      {load.alerts && load.alerts.length > 0 && (
                        <div className="bg-red-50 p-3 rounded-lg flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-700">
                              {load.alerts[0]}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
