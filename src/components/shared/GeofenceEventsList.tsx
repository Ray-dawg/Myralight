import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Refresh, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface GeofenceEvent {
  geofenceId: string;
  vehicleId: string;
  driverId: string;
  eventType: "entry" | "exit";
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  loadId?: string;
}

interface GeofenceEventsListProps {
  vehicleId?: string;
  geofenceId?: string;
  maxEvents?: number;
  onEventClick?: (event: GeofenceEvent) => void;
  className?: string;
}

const GeofenceEventsList: React.FC<GeofenceEventsListProps> = ({
  vehicleId,
  geofenceId,
  maxEvents = 10,
  onEventClick,
  className = "",
}) => {
  const [events, setEvents] = useState<GeofenceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let url = "/api/geofence";

      if (vehicleId) {
        url += `/vehicle/${vehicleId}/events`;
      } else if (geofenceId) {
        url += `/${geofenceId}/events`;
      } else {
        throw new Error("Either vehicleId or geofenceId must be provided");
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setEvents(data.events.slice(0, maxEvents));
      } else {
        throw new Error(data.message || "Failed to fetch geofence events");
      }
    } catch (err) {
      console.error("Error fetching geofence events:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Set up event listeners for real-time updates
    const handleGeofenceEntry = (event: CustomEvent) => {
      const newEvent = event.detail;
      if (
        (vehicleId && newEvent.vehicleId === vehicleId) ||
        (geofenceId && newEvent.geofenceId === geofenceId)
      ) {
        setEvents((prev) => [newEvent, ...prev].slice(0, maxEvents));
      }
    };

    const handleGeofenceExit = (event: CustomEvent) => {
      const newEvent = event.detail;
      if (
        (vehicleId && newEvent.vehicleId === vehicleId) ||
        (geofenceId && newEvent.geofenceId === geofenceId)
      ) {
        setEvents((prev) => [newEvent, ...prev].slice(0, maxEvents));
      }
    };

    window.addEventListener(
      "geofence:entry",
      handleGeofenceEntry as EventListener,
    );
    window.addEventListener(
      "geofence:exit",
      handleGeofenceExit as EventListener,
    );

    return () => {
      window.removeEventListener(
        "geofence:entry",
        handleGeofenceEntry as EventListener,
      );
      window.removeEventListener(
        "geofence:exit",
        handleGeofenceExit as EventListener,
      );
    };
  }, [vehicleId, geofenceId, maxEvents]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Geofence Events</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchEvents}
            disabled={isLoading}
          >
            <Refresh className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <p>No geofence events found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => (
              <div
                key={`${event.geofenceId}-${event.vehicleId}-${event.timestamp}-${index}`}
                className="p-3 border rounded-md hover:bg-accent cursor-pointer"
                onClick={() => onEventClick && onEventClick(event)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <Badge
                      variant={
                        event.eventType === "entry" ? "success" : "destructive"
                      }
                      className="mb-2"
                    >
                      {event.eventType === "entry" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      )}
                      {event.eventType.toUpperCase()}
                    </Badge>
                    <div className="text-sm font-medium">
                      {event.eventType === "entry" ? "Entered" : "Exited"}{" "}
                      Geofence
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Vehicle: {event.vehicleId}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Driver: {event.driverId}
                    </div>
                  </div>
                  <div className="text-xs text-right">
                    {format(new Date(event.timestamp), "MMM d, h:mm:ss a")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeofenceEventsList;
