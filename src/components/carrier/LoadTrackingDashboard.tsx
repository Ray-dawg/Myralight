import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  AlertTriangle,
  Phone,
  MessageSquare,
  ChevronDown,
  Truck,
  Calendar,
  BarChart2,
  Shield,
  CheckCircle,
  XCircle,
  ThermometerSun,
  TrendingUp,
  Activity,
  Loader2,
  History,
  Download,
} from "lucide-react";

interface Load {
  id: string;
  type: string;
  status: "active" | "delayed" | "at_risk";
  risk: "low" | "medium" | "high";
  driver: {
    name: string;
    phone: string;
    hoursLeft: number;
    lastBreak: string;
  };
  pickup: {
    location: string;
    time: string;
    completed: boolean;
  };
  delivery: {
    location: string;
    time: string;
    completed: boolean;
  };
  metrics: {
    temp: string;
    value: string;
    progress: number;
    eta: string;
    distanceLeft: string;
    fuelLevel: number;
    avgSpeed: number;
  };
  events: Array<{
    time: string;
    type: string;
    description: string;
  }>;
}

export default function LoadTrackingDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoad, setSelectedLoad] = useState<string | null>("L-12345");
  const [showHistory, setShowHistory] = useState(false);

  const loads: Load[] = [
    {
      id: "L-12345",
      type: "FTL",
      status: "active",
      risk: "low",
      driver: {
        name: "John Smith",
        phone: "+1 555-0123",
        hoursLeft: 6.5,
        lastBreak: "2 hours ago",
      },
      pickup: {
        location: "Chicago, IL",
        time: "08:00 AM",
        completed: true,
      },
      delivery: {
        location: "Detroit, MI",
        time: "03:30 PM",
        completed: false,
      },
      metrics: {
        temp: "34°F",
        value: "$85,000",
        progress: 75,
        eta: "3:30 PM",
        distanceLeft: "120 miles",
        fuelLevel: 65,
        avgSpeed: 58,
      },
      events: [
        {
          time: "10:30 AM",
          type: "checkpoint",
          description: "Passed Toledo checkpoint",
        },
        {
          time: "09:15 AM",
          type: "break",
          description: "Driver break completed",
        },
      ],
    },
    {
      id: "L-12346",
      type: "LTL",
      status: "delayed",
      risk: "medium",
      driver: {
        name: "Sarah Connor",
        phone: "+1 555-0124",
        hoursLeft: 4.2,
        lastBreak: "3 hours ago",
      },
      pickup: {
        location: "New York, NY",
        time: "09:00 AM",
        completed: true,
      },
      delivery: {
        location: "Boston, MA",
        time: "02:30 PM",
        completed: false,
      },
      metrics: {
        temp: "36°F",
        value: "$45,000",
        progress: 45,
        eta: "2:30 PM",
        distanceLeft: "180 miles",
        fuelLevel: 45,
        avgSpeed: 52,
      },
      events: [
        {
          time: "11:00 AM",
          type: "delay",
          description: "Traffic delay on I-95",
        },
      ],
    },
  ];

  const getStatusBadge = (status: Load["status"]) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      delayed: "bg-red-100 text-red-800",
      at_risk: "bg-yellow-100 text-yellow-800",
    };

    const labels = {
      active: "Active",
      delayed: "Delayed",
      at_risk: "At Risk",
    };

    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const getRiskIndicator = (risk: Load["risk"]) => {
    const styles = {
      low: "text-green-600",
      medium: "text-yellow-600",
      high: "text-red-600",
    };

    return (
      <div className={`flex items-center ${styles[risk]}`}>
        <Shield className="h-4 w-4 mr-1" />
        <span className="capitalize">{risk} Risk</span>
      </div>
    );
  };

  const selectedLoadData = loads.find((load) => load.id === selectedLoad);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Panel */}
      <div className="w-96 border-r flex flex-col bg-white">
        {/* Search Header */}
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search loads..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 mt-3">
            <Button variant="secondary" size="sm" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Active (24)
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Delayed (3)
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              At Risk (2)
            </Button>
          </div>
        </div>

        {/* Load List */}
        <div className="flex-1 overflow-auto">
          {loads.map((load) => (
            <div
              key={load.id}
              onClick={() => setSelectedLoad(load.id)}
              className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${selectedLoad === load.id ? "bg-blue-50" : ""}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{load.id}</span>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700"
                    >
                      {load.type}
                    </Badge>
                    {load.status === "delayed" && getStatusBadge("delayed")}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>{load.delivery.location}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-sm text-gray-500">ETA</div>
                  <div className="font-medium">{load.metrics.eta}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{load.pickup.location}</span>
                  <span>{load.delivery.location}</span>
                </div>
                <Progress value={load.metrics.progress} className="h-1.5" />
              </div>

              {/* Status Indicators */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {load.status === "delayed" ? "Delayed" : "On Schedule"}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <ThermometerSun className="h-3 w-3 mr-1" />
                  {load.metrics.temp}
                </div>
                <div className="flex items-center text-xs">
                  {getRiskIndicator(load.risk)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Map & Details */}
      <div className="flex-1 flex flex-col">
        {/* Load Details Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-xl">Load Tracking</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                  Live Tracking Active
                </div>
                <span className="text-gray-300">•</span>
                <span>Last update: 30s ago</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          </div>

          {selectedLoadData && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="text-gray-500">Temperature</div>
                      <div className="font-medium mt-0.5">
                        {selectedLoadData.metrics.temp}
                      </div>
                    </div>
                    <ThermometerSun className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="text-gray-500">Hours Left</div>
                      <div className="font-medium mt-0.5">
                        {selectedLoadData.driver.hoursLeft} hrs
                      </div>
                    </div>
                    <Clock className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="text-gray-500">Risk Level</div>
                      <div
                        className={`font-medium mt-0.5 capitalize ${selectedLoadData.risk === "low" ? "text-green-600" : "text-yellow-600"}`}
                      >
                        {selectedLoadData.risk}
                      </div>
                    </div>
                    <Shield
                      className={`h-4 w-4 ${selectedLoadData.risk === "low" ? "text-green-600" : "text-yellow-600"}`}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="text-gray-500">Load Value</div>
                      <div className="font-medium mt-0.5">
                        {selectedLoadData.metrics.value}
                      </div>
                    </div>
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Map Area */}
        <div className="flex-1 bg-gray-100 relative">
          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Live Tracking</span>
                  <span className="flex items-center text-green-600">
                    <div className="w-2 h-2 rounded-full bg-green-600 mr-1" />
                    Active
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Map Layers</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked readOnly />
                      <span>Rest Areas</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked readOnly />
                      <span>Fuel Stops</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked readOnly />
                      <span>Traffic</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked readOnly />
                      <span>Weather</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedLoadData && (
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Trip Details</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Distance Left:</span>
                        <span>{selectedLoadData.metrics.distanceLeft}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Avg Speed:</span>
                        <span>{selectedLoadData.metrics.avgSpeed} mph</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fuel Level:</span>
                        <span>{selectedLoadData.metrics.fuelLevel}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last Break:</span>
                        <span>{selectedLoadData.driver.lastBreak}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map Placeholder */}
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Truck className="h-12 w-12 mb-2 mx-auto text-gray-400" />
              <p>Interactive Map View</p>
              <p className="text-sm text-gray-400">
                Real-time tracking enabled
              </p>
            </div>
          </div>

          {/* History Panel */}
          {showHistory && selectedLoadData && (
            <div className="absolute top-4 left-4 w-80 bg-white rounded-lg shadow-lg border p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Event History</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(false)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                {selectedLoadData.events.map((event, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                    <div>
                      <p className="text-sm text-gray-500">{event.time}</p>
                      <p className="font-medium">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
