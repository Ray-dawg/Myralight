import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, Filter, Calendar } from "lucide-react";

export default function AlertsDashboard() {
  const alerts = [
    {
      id: "1",
      type: "weather",
      severity: "high",
      message: "Severe weather conditions on route I-94",
      timestamp: "10 minutes ago",
      affectedDrivers: 3,
    },
    {
      id: "2",
      type: "maintenance",
      severity: "medium",
      message: "Scheduled maintenance due for 5 vehicles",
      timestamp: "1 hour ago",
      affectedVehicles: 5,
    },
    {
      id: "3",
      type: "compliance",
      severity: "low",
      message: "Driver certifications expiring soon",
      timestamp: "2 hours ago",
      affectedDrivers: 2,
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Alerts Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            History
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <Badge
                        variant="outline"
                        className={`${
                          alert.severity === "high"
                            ? "border-red-500 text-red-500"
                            : alert.severity === "medium"
                              ? "border-yellow-500 text-yellow-500"
                              : "border-blue-500 text-blue-500"
                        }`}
                      >
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <h3 className="text-lg font-medium mt-1">
                        {alert.message}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{alert.timestamp}</span>
                    {alert.affectedDrivers && (
                      <span>{alert.affectedDrivers} drivers affected</span>
                    )}
                    {alert.affectedVehicles && (
                      <span>{alert.affectedVehicles} vehicles affected</span>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
