import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Bell,
  Clock,
  MapPin,
  Truck,
  Filter,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Alert {
  id: string;
  type: "delay" | "weather" | "system" | "carrier";
  severity: "high" | "medium" | "low";
  title: string;
  message: string;
  timestamp: string;
  shipmentId?: string;
  location?: string;
  read: boolean;
}

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "ALT-001",
      type: "delay",
      severity: "high",
      title: "Shipment Delay",
      message:
        "Shipment #SHP-001 is experiencing delays due to traffic conditions",
      timestamp: "10 minutes ago",
      shipmentId: "SHP-001",
      location: "I-94, Chicago",
      read: false,
    },
    {
      id: "ALT-002",
      type: "weather",
      severity: "medium",
      title: "Weather Advisory",
      message: "Heavy snow expected along route for shipment #SHP-002",
      timestamp: "1 hour ago",
      shipmentId: "SHP-002",
      location: "Minneapolis, MN",
      read: false,
    },
    {
      id: "ALT-003",
      type: "carrier",
      severity: "low",
      title: "Carrier Update",
      message: "FastFreight Logistics has updated their service availability",
      timestamp: "2 hours ago",
      read: true,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const getStatusBadge = (severity: Alert["severity"]) => {
    const styles = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800",
    };

    return <Badge className={styles[severity]}>{severity.toUpperCase()}</Badge>;
  };

  const handleMarkAllAsRead = () => {
    setAlerts(alerts.map((alert) => ({ ...alert, read: true })));
  };

  const handleMarkAsRead = (id: string) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === id ? { ...alert, read: true } : alert,
      ),
    );
  };

  const handleViewDetails = (alert: Alert) => {
    // Mark as read
    handleMarkAsRead(alert.id);

    // Navigate to shipment details if there's a shipment ID
    if (alert.shipmentId) {
      navigate(`/shipper/shipments/${alert.shipmentId}`);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (filter: string | null) => {
    setActiveFilter(filter === activeFilter ? null : filter);
  };

  // Filter alerts based on search query and active filter
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      searchQuery === "" ||
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.shipmentId &&
        alert.shipmentId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter =
      activeFilter === null ||
      (activeFilter === "unread" && !alert.read) ||
      alert.severity === activeFilter ||
      alert.type === activeFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-gray-500 mt-1">
            {alerts.filter((a) => !a.read).length} unread alerts
          </p>
        </div>
        <Button variant="outline" onClick={handleMarkAllAsRead}>
          Mark All as Read
        </Button>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search alerts..."
              className="pl-10"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeFilter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("unread")}
            >
              Unread
            </Button>
            <Button
              variant={activeFilter === "high" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("high")}
              className="text-red-600"
            >
              High Priority
            </Button>
            <Button
              variant={activeFilter === "medium" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("medium")}
              className="text-yellow-600"
            >
              Medium Priority
            </Button>
            <Button
              variant={activeFilter === "delay" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("delay")}
            >
              Delays
            </Button>
            <Button
              variant={activeFilter === "weather" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("weather")}
            >
              Weather
            </Button>
            {activeFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter(null)}
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filter
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className={alert.read ? "opacity-75" : ""}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="mt-1">
                    <AlertTriangle
                      className={`h-5 w-5 ${alert.severity === "high" ? "text-red-500" : alert.severity === "medium" ? "text-yellow-500" : "text-blue-500"}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{alert.title}</h3>
                          {getStatusBadge(alert.severity)}
                          {!alert.read && (
                            <Badge className="bg-blue-100 text-blue-800">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mt-2">{alert.message}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(alert.id)}
                          disabled={alert.read}
                        >
                          Mark as Read
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(alert)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {alert.timestamp}
                      </div>
                      {alert.shipmentId && (
                        <div className="flex items-center gap-1">
                          <Truck className="h-4 w-4" />
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm text-gray-500 hover:text-primary"
                            onClick={() =>
                              navigate(`/shipper/shipments/${alert.shipmentId}`)
                            }
                          >
                            {alert.shipmentId}
                          </Button>
                        </div>
                      )}
                      {alert.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {alert.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-6">
            <div className="text-center py-8">
              <p className="text-gray-500">
                No alerts found matching your criteria.
              </p>
              {(searchQuery || activeFilter) && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter(null);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
