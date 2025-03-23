import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import GeofenceMap from "@/components/shared/GeofenceMap";
import { FadeIn, SlideUp } from "@/components/ui/transitions";
import {
  Search,
  Filter,
  Plus,
  MapPin,
  Target,
  AlertCircle,
  Clock,
  Trash2,
  Edit,
  Eye,
  BarChart3,
  Settings,
  Truck,
  Warehouse,
  Building,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  address?: string;
  createdBy: string;
  createdAt: string;
  type?: "pickup" | "delivery" | "warehouse" | "custom";
  status?: "active" | "inactive" | "pending";
  associatedLoads?: number;
  notificationSettings?: {
    notifyOnEntry: boolean;
    notifyOnExit: boolean;
    notifyDrivers: boolean;
    notifyCarriers: boolean;
    notifyShippers: boolean;
  };
}

interface GeofenceEvent {
  id: string;
  geofenceId: string;
  vehicleId: string;
  driverId: string;
  eventType: "entry" | "exit";
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  accuracy?: number;
  speed?: number;
  heading?: number;
  loadId?: string;
  status?: "verified" | "unverified" | "flagged";
}

interface GeofenceAnalytics {
  totalEvents: number;
  entryEvents: number;
  exitEvents: number;
  uniqueVehicles: number;
  uniqueDrivers: number;
  averageDwellTime: number; // in minutes
  eventsByHour: { hour: number; count: number }[];
  eventsByDay: { day: string; count: number }[];
  reliability: number; // percentage of successful detections
}

export default function GeofenceManagement() {
  const { toast } = useToast();
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(
    null,
  );
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive" | "pending"
  >("all");
  const [filterType, setFilterType] = useState<
    "all" | "pickup" | "delivery" | "warehouse" | "custom"
  >("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [analytics, setAnalytics] = useState<GeofenceAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [bulkActionIds, setBulkActionIds] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);

  // Fetch geofences from backend
  const fetchGeofences = useCallback(async () => {
    setLoading(true);
    try {
      // Try to use Convex if available
      if (window.convex) {
        try {
          const geofencesData = await window.convex.query("geofences:list");
          setGeofences(geofencesData);
          setLoading(false);
          return;
        } catch (convexError) {
          console.warn(
            "Convex query failed, falling back to REST API",
            convexError,
          );
        }
      }

      const response = await fetch("/api/geofence");
      if (!response.ok) throw new Error("Failed to fetch geofences");

      const data = await response.json();
      if (data.success) {
        setGeofences(data.geofences);
      } else {
        throw new Error(data.message || "Failed to fetch geofences");
      }
    } catch (error) {
      console.error("Error fetching geofences:", error);
      toast({
        title: "Error",
        description: "Failed to load geofences. Please try again later.",
        variant: "destructive",
      });
      // Use fallback data for demo purposes
      setGeofences(getFallbackGeofences());
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGeofences();
  }, [fetchGeofences]);

  // Handle geofence creation
  const handleGeofenceCreate = async (geofenceData: {
    latitude: number;
    longitude: number;
    radius: number;
    address?: string;
    name?: string;
    type?: "pickup" | "delivery" | "warehouse" | "custom";
  }) => {
    try {
      // Try to use Convex if available
      if (window.convex) {
        try {
          const newGeofence = await window.convex.mutation("geofences:create", {
            ...geofenceData,
            name:
              geofenceData.name ||
              `Geofence at ${geofenceData.latitude.toFixed(4)}, ${geofenceData.longitude.toFixed(4)}`,
            type: geofenceData.type || "custom",
            status: "active",
            createdBy: "admin", // In a real app, this would be the current user's ID
            notificationSettings: {
              notifyOnEntry: true,
              notifyOnExit: true,
              notifyDrivers: true,
              notifyCarriers: true,
              notifyShippers: false,
            },
          });

          toast({
            title: "Success",
            description: "Geofence created successfully",
          });

          // Refresh the geofence list
          fetchGeofences();
          setShowCreateForm(false);
          return;
        } catch (convexError) {
          console.warn(
            "Convex mutation failed, falling back to REST API",
            convexError,
          );
        }
      }

      const response = await fetch("/api/geofence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...geofenceData,
          name:
            geofenceData.name ||
            `Geofence at ${geofenceData.latitude.toFixed(4)}, ${geofenceData.longitude.toFixed(4)}`,
          type: geofenceData.type || "custom",
          status: "active",
          createdBy: "admin", // In a real app, this would be the current user's ID
          notificationSettings: {
            notifyOnEntry: true,
            notifyOnExit: true,
            notifyDrivers: true,
            notifyCarriers: true,
            notifyShippers: false,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to create geofence");

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Geofence created successfully",
        });

        // Add the new geofence to the list
        setGeofences([data.geofence, ...geofences]);
        setShowCreateForm(false);
      } else {
        throw new Error(data.message || "Failed to create geofence");
      }
    } catch (error) {
      console.error("Error creating geofence:", error);
      toast({
        title: "Error",
        description: "Failed to create geofence. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle geofence update
  const handleGeofenceUpdate = async (geofenceData: Geofence) => {
    try {
      // Try to use Convex if available
      if (window.convex) {
        try {
          await window.convex.mutation("geofences:update", {
            id: geofenceData.id,
            ...geofenceData,
          });

          toast({
            title: "Success",
            description: "Geofence updated successfully",
          });

          // Refresh the geofence list
          fetchGeofences();
          setShowEditForm(false);
          setEditingGeofence(null);

          // If the updated geofence is the selected one, update it
          if (selectedGeofence?.id === geofenceData.id) {
            setSelectedGeofence(geofenceData);
          }

          return;
        } catch (convexError) {
          console.warn(
            "Convex mutation failed, falling back to REST API",
            convexError,
          );
        }
      }

      const response = await fetch(`/api/geofence/${geofenceData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(geofenceData),
      });

      if (!response.ok) throw new Error("Failed to update geofence");

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Geofence updated successfully",
        });

        // Update the geofence in the list
        setGeofences(
          geofences.map((g) => (g.id === geofenceData.id ? geofenceData : g)),
        );
        setShowEditForm(false);
        setEditingGeofence(null);

        // If the updated geofence is the selected one, update it
        if (selectedGeofence?.id === geofenceData.id) {
          setSelectedGeofence(geofenceData);
        }
      } else {
        throw new Error(data.message || "Failed to update geofence");
      }
    } catch (error) {
      console.error("Error updating geofence:", error);
      toast({
        title: "Error",
        description: "Failed to update geofence. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle geofence deletion
  const handleGeofenceDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this geofence?")) return;

    try {
      // Try to use Convex if available
      if (window.convex) {
        try {
          await window.convex.mutation("geofences:delete", { id });

          toast({
            title: "Success",
            description: "Geofence deleted successfully",
          });

          // Refresh the geofence list
          fetchGeofences();

          // If the deleted geofence is the selected one, clear selection
          if (selectedGeofence?.id === id) {
            setSelectedGeofence(null);
          }

          return;
        } catch (convexError) {
          console.warn(
            "Convex mutation failed, falling back to REST API",
            convexError,
          );
        }
      }

      const response = await fetch(`/api/geofence/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete geofence");

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Geofence deleted successfully",
        });

        // Remove the deleted geofence from the list
        setGeofences(geofences.filter((g) => g.id !== id));
        if (selectedGeofence?.id === id) {
          setSelectedGeofence(null);
        }
      } else {
        throw new Error(data.message || "Failed to delete geofence");
      }
    } catch (error) {
      console.error("Error deleting geofence:", error);
      toast({
        title: "Error",
        description: "Failed to delete geofence. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (
    action: "delete" | "activate" | "deactivate",
  ) => {
    if (bulkActionIds.size === 0) return;

    const idsArray = Array.from(bulkActionIds);

    if (
      action === "delete" &&
      !confirm(`Are you sure you want to delete ${idsArray.length} geofences?`)
    ) {
      return;
    }

    try {
      // Try to use Convex if available
      if (window.convex) {
        try {
          await window.convex.mutation("geofences:bulkAction", {
            ids: idsArray,
            action,
          });

          toast({
            title: "Success",
            description: `${idsArray.length} geofences ${action === "delete" ? "deleted" : action === "activate" ? "activated" : "deactivated"} successfully`,
          });

          // Refresh the geofence list
          fetchGeofences();
          setBulkActionIds(new Set());
          setIsAllSelected(false);

          return;
        } catch (convexError) {
          console.warn(
            "Convex mutation failed, falling back to REST API",
            convexError,
          );
        }
      }

      const response = await fetch(`/api/geofence/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: idsArray,
          action,
        }),
      });

      if (!response.ok) throw new Error(`Failed to ${action} geofences`);

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: `${idsArray.length} geofences ${action === "delete" ? "deleted" : action === "activate" ? "activated" : "deactivated"} successfully`,
        });

        // Update the geofence list based on the action
        if (action === "delete") {
          setGeofences(geofences.filter((g) => !bulkActionIds.has(g.id)));
        } else {
          setGeofences(
            geofences.map((g) => {
              if (bulkActionIds.has(g.id)) {
                return {
                  ...g,
                  status: action === "activate" ? "active" : "inactive",
                };
              }
              return g;
            }),
          );
        }

        // Clear selection
        setBulkActionIds(new Set());
        setIsAllSelected(false);
      } else {
        throw new Error(data.message || `Failed to ${action} geofences`);
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} geofences. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Fetch geofence events when a geofence is selected
  useEffect(() => {
    if (!selectedGeofence) {
      setGeofenceEvents([]);
      setAnalytics(null);
      return;
    }

    async function fetchGeofenceEvents() {
      setEventsLoading(true);
      try {
        // Try to use Convex if available
        if (window.convex) {
          try {
            const eventsData = await window.convex.query(
              "geofences:getEvents",
              {
                geofenceId: selectedGeofence.id,
                from: dateRange.from.toISOString(),
                to: dateRange.to.toISOString(),
              },
            );
            setGeofenceEvents(eventsData);
            setEventsLoading(false);
            return;
          } catch (convexError) {
            console.warn(
              "Convex query failed, falling back to REST API",
              convexError,
            );
          }
        }

        const response = await fetch(
          `/api/geofence/${selectedGeofence.id}/events?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`,
        );
        if (!response.ok) throw new Error("Failed to fetch geofence events");

        const data = await response.json();
        if (data.success) {
          setGeofenceEvents(data.events);
        } else {
          throw new Error(data.message || "Failed to fetch geofence events");
        }
      } catch (error) {
        console.error("Error fetching geofence events:", error);
        toast({
          title: "Error",
          description:
            "Failed to load geofence events. Please try again later.",
          variant: "destructive",
        });
        // Use fallback data for demo purposes
        setGeofenceEvents(getFallbackGeofenceEvents(selectedGeofence.id));
      } finally {
        setEventsLoading(false);
      }
    }

    async function fetchGeofenceAnalytics() {
      setAnalyticsLoading(true);
      try {
        // Try to use Convex if available
        if (window.convex) {
          try {
            const analyticsData = await window.convex.query(
              "geofences:getAnalytics",
              {
                geofenceId: selectedGeofence.id,
                from: dateRange.from.toISOString(),
                to: dateRange.to.toISOString(),
              },
            );
            setAnalytics(analyticsData);
            setAnalyticsLoading(false);
            return;
          } catch (convexError) {
            console.warn(
              "Convex query failed, falling back to REST API",
              convexError,
            );
          }
        }

        const response = await fetch(
          `/api/geofence/${selectedGeofence.id}/analytics?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`,
        );
        if (!response.ok) throw new Error("Failed to fetch geofence analytics");

        const data = await response.json();
        if (data.success) {
          setAnalytics(data.analytics);
        } else {
          throw new Error(data.message || "Failed to fetch geofence analytics");
        }
      } catch (error) {
        console.error("Error fetching geofence analytics:", error);
        toast({
          title: "Error",
          description:
            "Failed to load geofence analytics. Please try again later.",
          variant: "destructive",
        });
        // Use fallback data for demo purposes
        setAnalytics(getFallbackGeofenceAnalytics(selectedGeofence.id));
      } finally {
        setAnalyticsLoading(false);
      }
    }

    fetchGeofenceEvents();
    fetchGeofenceAnalytics();
  }, [selectedGeofence, dateRange, toast]);

  // Handle checkbox selection for bulk actions
  const handleCheckboxChange = (id: string, checked: boolean) => {
    const newSelection = new Set(bulkActionIds);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setBulkActionIds(newSelection);
  };

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    setIsAllSelected(checked);
    if (checked) {
      const allIds = new Set(filteredGeofences.map((g) => g.id));
      setBulkActionIds(allIds);
    } else {
      setBulkActionIds(new Set());
    }
  };

  // Filter geofences based on search term, filter status, and filter type
  const filteredGeofences = geofences.filter((geofence) => {
    const matchesSearch =
      geofence.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      geofence.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      geofence.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      geofence.status === filterStatus ||
      (filterStatus === "active" && !geofence.status); // For backward compatibility

    const matchesType =
      filterType === "all" ||
      geofence.type === filterType ||
      (filterType === "custom" && !geofence.type); // For backward compatibility

    return matchesSearch && matchesStatus && matchesType;
  });

  // Get geofence type icon
  const getGeofenceTypeIcon = (type?: string) => {
    switch (type) {
      case "pickup":
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case "delivery":
        return <Truck className="h-4 w-4 text-green-500" />;
      case "warehouse":
        return <Warehouse className="h-4 w-4 text-amber-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get geofence status badge
  const getGeofenceStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800">Active</Badge>; // Default to active for backward compatibility
    }
  };

  // Get event status icon
  const getEventStatusIcon = (status?: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "flagged":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "unverified":
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Fallback data for demo purposes
  function getFallbackGeofences(): Geofence[] {
    return [
      {
        id: "geo_001",
        name: "Chicago Warehouse",
        latitude: 41.8781,
        longitude: -87.6298,
        radius: 500,
        address: "123 Warehouse Ave, Chicago, IL",
        createdBy: "admin",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: "warehouse",
        status: "active",
        associatedLoads: 12,
        notificationSettings: {
          notifyOnEntry: true,
          notifyOnExit: true,
          notifyDrivers: true,
          notifyCarriers: true,
          notifyShippers: false,
        },
      },
      {
        id: "geo_002",
        name: "Detroit Distribution Center",
        latitude: 42.3314,
        longitude: -83.0458,
        radius: 350,
        address: "456 Logistics Blvd, Detroit, MI",
        createdBy: "admin",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        type: "delivery",
        status: "active",
        associatedLoads: 8,
        notificationSettings: {
          notifyOnEntry: true,
          notifyOnExit: false,
          notifyDrivers: true,
          notifyCarriers: true,
          notifyShippers: true,
        },
      },
      {
        id: "geo_003",
        name: "Milwaukee Depot",
        latitude: 43.0389,
        longitude: -87.9065,
        radius: 250,
        address: "789 Shipping Lane, Milwaukee, WI",
        createdBy: "admin",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        type: "pickup",
        status: "inactive",
        associatedLoads: 5,
        notificationSettings: {
          notifyOnEntry: true,
          notifyOnExit: true,
          notifyDrivers: true,
          notifyCarriers: false,
          notifyShippers: false,
        },
      },
      {
        id: "geo_004",
        name: "Minneapolis Hub",
        latitude: 44.9778,
        longitude: -93.265,
        radius: 400,
        address: "101 Transport Road, Minneapolis, MN",
        createdBy: "admin",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        type: "custom",
        status: "pending",
        associatedLoads: 0,
        notificationSettings: {
          notifyOnEntry: false,
          notifyOnExit: false,
          notifyDrivers: false,
          notifyCarriers: false,
          notifyShippers: false,
        },
      },
    ];
  }

  // Fallback geofence events for demo purposes
  function getFallbackGeofenceEvents(geofenceId: string): GeofenceEvent[] {
    return [
      {
        id: "event_001",
        geofenceId,
        vehicleId: "truck_123",
        driverId: "driver_456",
        eventType: "entry",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        location: {
          latitude: selectedGeofence?.latitude || 0,
          longitude: selectedGeofence?.longitude || 0,
        },
        accuracy: 15,
        speed: 5,
        heading: 90,
        loadId: "load_789",
        status: "verified",
      },
      {
        id: "event_002",
        geofenceId,
        vehicleId: "truck_123",
        driverId: "driver_456",
        eventType: "exit",
        timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
        location: {
          latitude: selectedGeofence?.latitude || 0,
          longitude: selectedGeofence?.longitude || 0,
        },
        accuracy: 12,
        speed: 8,
        heading: 270,
        loadId: "load_789",
        status: "verified",
      },
      {
        id: "event_003",
        geofenceId,
        vehicleId: "truck_789",
        driverId: "driver_101",
        eventType: "entry",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        location: {
          latitude: selectedGeofence?.latitude || 0,
          longitude: selectedGeofence?.longitude || 0,
        },
        accuracy: 25,
        speed: 3,
        heading: 180,
        loadId: "load_456",
        status: "flagged",
      },
      {
        id: "event_004",
        geofenceId,
        vehicleId: "truck_789",
        driverId: "driver_101",
        eventType: "exit",
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        location: {
          latitude: selectedGeofence?.latitude || 0,
          longitude: selectedGeofence?.longitude || 0,
        },
        accuracy: 18,
        speed: 10,
        heading: 0,
        loadId: "load_456",
        status: "unverified",
      },
    ];
  }

  // Fallback geofence analytics for demo purposes
  function getFallbackGeofenceAnalytics(geofenceId: string): GeofenceAnalytics {
    return {
      totalEvents: 48,
      entryEvents: 24,
      exitEvents: 24,
      uniqueVehicles: 12,
      uniqueDrivers: 8,
      averageDwellTime: 45, // 45 minutes
      eventsByHour: [
        { hour: 0, count: 1 },
        { hour: 1, count: 0 },
        { hour: 2, count: 0 },
        { hour: 3, count: 0 },
        { hour: 4, count: 0 },
        { hour: 5, count: 2 },
        { hour: 6, count: 3 },
        { hour: 7, count: 5 },
        { hour: 8, count: 7 },
        { hour: 9, count: 4 },
        { hour: 10, count: 3 },
        { hour: 11, count: 2 },
        { hour: 12, count: 4 },
        { hour: 13, count: 3 },
        { hour: 14, count: 2 },
        { hour: 15, count: 3 },
        { hour: 16, count: 4 },
        { hour: 17, count: 5 },
        { hour: 18, count: 3 },
        { hour: 19, count: 2 },
        { hour: 20, count: 1 },
        { hour: 21, count: 0 },
        { hour: 22, count: 0 },
        { hour: 23, count: 0 },
      ],
      eventsByDay: [
        { day: "Monday", count: 8 },
        { day: "Tuesday", count: 10 },
        { day: "Wednesday", count: 12 },
        { day: "Thursday", count: 9 },
        { day: "Friday", count: 7 },
        { day: "Saturday", count: 2 },
        { day: "Sunday", count: 0 },
      ],
      reliability: 92, // 92% reliability
    };
  }

  // Start editing a geofence
  const startEditingGeofence = (geofence: Geofence) => {
    setEditingGeofence(geofence);
    setShowEditForm(true);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Geofence Management</h1>
          <p className="text-gray-500 mt-1">
            Create, monitor, and manage geofences for automatic
            check-in/check-out
          </p>
        </div>
        <div className="flex gap-2">
          {bulkActionIds.size > 0 && (
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md">
              <span className="text-sm font-medium">
                {bulkActionIds.size} selected
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction("activate")}
                  title="Activate selected"
                >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction("deactivate")}
                  title="Deactivate selected"
                >
                  <XCircle className="h-4 w-4 text-gray-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction("delete")}
                  title="Delete selected"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          )}
          <Button
            onClick={() => fetchGeofences()}
            variant="outline"
            title="Refresh geofences"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreateForm ? "Cancel" : "Create Geofence"}
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <SlideUp>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Create New Geofence
              </CardTitle>
              <CardDescription>
                Click on the map to set a location, adjust the radius, and
                provide details for the new geofence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GeofenceMap
                height="500px"
                onGeofenceCreate={handleGeofenceCreate}
              />
            </CardContent>
          </Card>
        </SlideUp>
      )}

      {showEditForm && editingGeofence && (
        <SlideUp>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Geofence: {editingGeofence.name}
              </CardTitle>
              <CardDescription>
                Modify the geofence properties and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <GeofenceMap
                    height="400px"
                    initialLocation={{
                      latitude: editingGeofence.latitude,
                      longitude: editingGeofence.longitude,
                    }}
                    initialRadius={editingGeofence.radius}
                    onGeofenceCreate={(data) => {
                      handleGeofenceUpdate({
                        ...editingGeofence,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        radius: data.radius,
                        name: data.name || editingGeofence.name,
                        address: data.address || editingGeofence.address,
                      });
                    }}
                  />
                </div>
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Geofence Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="geofence-type">Geofence Type</Label>
                        <Select
                          defaultValue={editingGeofence.type || "custom"}
                          onValueChange={(value) => {
                            setEditingGeofence({
                              ...editingGeofence,
                              type: value as any,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pickup">
                              Pickup Location
                            </SelectItem>
                            <SelectItem value="delivery">
                              Delivery Location
                            </SelectItem>
                            <SelectItem value="warehouse">Warehouse</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="geofence-status">Status</Label>
                        <Select
                          defaultValue={editingGeofence.status || "active"}
                          onValueChange={(value) => {
                            setEditingGeofence({
                              ...editingGeofence,
                              status: value as any,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="pt-4">
                        <h4 className="text-sm font-medium mb-2">
                          Notification Settings
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor="notify-entry"
                              className="cursor-pointer"
                            >
                              Notify on Entry
                            </Label>
                            <Switch
                              id="notify-entry"
                              checked={
                                editingGeofence.notificationSettings
                                  ?.notifyOnEntry ?? true
                              }
                              onCheckedChange={(checked) => {
                                setEditingGeofence({
                                  ...editingGeofence,
                                  notificationSettings: {
                                    ...editingGeofence.notificationSettings,
                                    notifyOnEntry: checked,
                                  },
                                });
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor="notify-exit"
                              className="cursor-pointer"
                            >
                              Notify on Exit
                            </Label>
                            <Switch
                              id="notify-exit"
                              checked={
                                editingGeofence.notificationSettings
                                  ?.notifyOnExit ?? true
                              }
                              onCheckedChange={(checked) => {
                                setEditingGeofence({
                                  ...editingGeofence,
                                  notificationSettings: {
                                    ...editingGeofence.notificationSettings,
                                    notifyOnExit: checked,
                                  },
                                });
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor="notify-drivers"
                              className="cursor-pointer"
                            >
                              Notify Drivers
                            </Label>
                            <Switch
                              id="notify-drivers"
                              checked={
                                editingGeofence.notificationSettings
                                  ?.notifyDrivers ?? true
                              }
                              onCheckedChange={(checked) => {
                                setEditingGeofence({
                                  ...editingGeofence,
                                  notificationSettings: {
                                    ...editingGeofence.notificationSettings,
                                    notifyDrivers: checked,
                                  },
                                });
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor="notify-carriers"
                              className="cursor-pointer"
                            >
                              Notify Carriers
                            </Label>
                            <Switch
                              id="notify-carriers"
                              checked={
                                editingGeofence.notificationSettings
                                  ?.notifyCarriers ?? true
                              }
                              onCheckedChange={(checked) => {
                                setEditingGeofence({
                                  ...editingGeofence,
                                  notificationSettings: {
                                    ...editingGeofence.notificationSettings,
                                    notifyCarriers: checked,
                                  },
                                });
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor="notify-shippers"
                              className="cursor-pointer"
                            >
                              Notify Shippers
                            </Label>
                            <Switch
                              id="notify-shippers"
                              checked={
                                editingGeofence.notificationSettings
                                  ?.notifyShippers ?? false
                              }
                              onCheckedChange={(checked) => {
                                setEditingGeofence({
                                  ...editingGeofence,
                                  notificationSettings: {
                                    ...editingGeofence.notificationSettings,
                                    notifyShippers: checked,
                                  },
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex gap-2">
                        <Button
                          className="w-full"
                          onClick={() => handleGeofenceUpdate(editingGeofence)}
                        >
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowEditForm(false);
                            setEditingGeofence(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
      )}

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Geofence List</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
          {selectedGeofence && <TabsTrigger value="events">Events</TabsTrigger>}
          {selectedGeofence && (
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          )}
          {selectedGeofence && (
            <TabsTrigger value="settings">Settings</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search geofences..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    defaultValue="all"
                    onValueChange={(value) => setFilterType(value as any)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="pickup">Pickup Locations</SelectItem>
                      <SelectItem value="delivery">
                        Delivery Locations
                      </SelectItem>
                      <SelectItem value="warehouse">Warehouses</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                >
                  All Geofences
                </Button>
                <Button
                  variant={filterStatus === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("active")}
                >
                  Active
                </Button>
                <Button
                  variant={filterStatus === "inactive" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("inactive")}
                >
                  Inactive
                </Button>
                <Button
                  variant={filterStatus === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("pending")}
                >
                  Pending
                </Button>
              </div>
            </div>
          </Card>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p>Loading geofences...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGeofences.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-gray-500">No geofences found</p>
                </Card>
              ) : (
                <FadeIn>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              checked={isAllSelected}
                              onChange={(e) =>
                                handleSelectAll(e.target.checked)
                              }
                            />
                          </div>
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Radius</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGeofences.map((geofence) => (
                        <TableRow
                          key={geofence.id}
                          className={
                            selectedGeofence?.id === geofence.id
                              ? "bg-primary/10"
                              : ""
                          }
                          onClick={() => setSelectedGeofence(geofence)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              checked={bulkActionIds.has(geofence.id)}
                              onChange={(e) =>
                                handleCheckboxChange(
                                  geofence.id,
                                  e.target.checked,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getGeofenceTypeIcon(geofence.type)}
                              {geofence.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {geofence.type ? (
                              <Badge variant="outline" className="capitalize">
                                {geofence.type}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Custom</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-500" />
                              <span className="truncate max-w-[200px]">
                                {geofence.address ||
                                  `${geofence.latitude.toFixed(4)}, ${geofence.longitude.toFixed(4)}`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{geofence.radius}m</TableCell>
                          <TableCell>
                            {new Date(geofence.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {getGeofenceStatusBadge(geofence.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGeofence(geofence);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingGeofence(geofence);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGeofenceDelete(geofence.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </FadeIn>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Geofence Map View
              </CardTitle>
              <CardDescription>
                Interactive map showing all geofences. Click on a geofence to
                view details.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <GeofenceMap
                height="600px"
                initialLocation={
                  selectedGeofence
                    ? {
                        latitude: selectedGeofence.latitude,
                        longitude: selectedGeofence.longitude,
                      }
                    : undefined
                }
                initialRadius={selectedGeofence?.radius}
                viewOnly={true}
                existingGeofences={geofences}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {selectedGeofence && (
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Events for {selectedGeofence.name}
                </CardTitle>
                <CardDescription>
                  Entry and exit events for this geofence. Filter by date range
                  or event type.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Last 24 Hours
                    </Button>
                    <Button variant="outline" size="sm">
                      Last 7 Days
                    </Button>
                    <Button variant="outline" size="sm">
                      Last 30 Days
                    </Button>
                    <Button variant="outline" size="sm">
                      Custom Range
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Events
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEventsLoading(true);
                        setTimeout(() => {
                          setGeofenceEvents(
                            getFallbackGeofenceEvents(selectedGeofence.id),
                          );
                          setEventsLoading(false);
                        }, 500);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>

                {eventsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      <p>Loading events...</p>
                    </div>
                  </div>
                ) : geofenceEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">
                      No events recorded for this geofence
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Load ID</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Accuracy</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {geofenceEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <Badge
                              className={
                                event.eventType === "entry"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }
                            >
                              {event.eventType === "entry" ? "Entry" : "Exit"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getEventStatusIcon(event.status)}
                              <span className="capitalize">
                                {event.status || "unverified"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{event.vehicleId}</TableCell>
                          <TableCell>{event.driverId}</TableCell>
                          <TableCell>
                            {event.loadId ? (
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {event.loadId}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(event.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-500" />
                              <span>
                                {event.location.latitude.toFixed(4)},{" "}
                                {event.location.longitude.toFixed(4)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {event.accuracy ? `±${event.accuracy}m` : "Unknown"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {selectedGeofence && (
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics for {selectedGeofence.name}
                </CardTitle>
                <CardDescription>
                  Performance metrics and usage statistics for this geofence
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      <p>Loading analytics...</p>
                    </div>
                  </div>
                ) : analytics ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold">
                              {analytics.totalEvents}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Total Events
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold">
                              {analytics.uniqueVehicles}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Unique Vehicles
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold">
                              {analytics.averageDwellTime} min
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Avg. Dwell Time
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold">
                              {analytics.reliability}%
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Reliability
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            Events by Hour of Day
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64 flex items-end gap-1">
                            {analytics.eventsByHour.map((hourData) => (
                              <div
                                key={hourData.hour}
                                className="flex-1 flex flex-col items-center"
                              >
                                <div
                                  className="w-full bg-primary/80 rounded-t"
                                  style={{
                                    height: `${Math.max(4, (hourData.count / Math.max(...analytics.eventsByHour.map((h) => h.count))) * 180)}px`,
                                  }}
                                ></div>
                                <div className="text-xs mt-1">
                                  {hourData.hour}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            Events by Day of Week
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64 flex items-end gap-2">
                            {analytics.eventsByDay.map((dayData) => (
                              <div
                                key={dayData.day}
                                className="flex-1 flex flex-col items-center"
                              >
                                <div
                                  className="w-full bg-primary/80 rounded-t"
                                  style={{
                                    height: `${Math.max(4, (dayData.count / Math.max(...analytics.eventsByDay.map((d) => d.count))) * 180)}px`,
                                  }}
                                ></div>
                                <div className="text-xs mt-1">
                                  {dayData.day.substring(0, 3)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">
                      No analytics available for this geofence
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {selectedGeofence && (
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings for {selectedGeofence.name}
                </CardTitle>
                <CardDescription>
                  Configure notification settings and other properties for this
                  geofence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      Geofence Properties
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Name</Label>
                        <Input
                          id="edit-name"
                          value={selectedGeofence.name}
                          onChange={(e) => {
                            setSelectedGeofence({
                              ...selectedGeofence,
                              name: e.target.value,
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-address">Address</Label>
                        <Input
                          id="edit-address"
                          value={selectedGeofence.address || ""}
                          onChange={(e) => {
                            setSelectedGeofence({
                              ...selectedGeofence,
                              address: e.target.value,
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-type">Type</Label>
                        <Select
                          value={selectedGeofence.type || "custom"}
                          onValueChange={(value) => {
                            setSelectedGeofence({
                              ...selectedGeofence,
                              type: value as any,
                            });
                          }}
                        >
                          <SelectTrigger id="edit-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pickup">
                              Pickup Location
                            </SelectItem>
                            <SelectItem value="delivery">
                              Delivery Location
                            </SelectItem>
                            <SelectItem value="warehouse">Warehouse</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-status">Status</Label>
                        <Select
                          value={selectedGeofence.status || "active"}
                          onValueChange={(value) => {
                            setSelectedGeofence({
                              ...selectedGeofence,
                              status: value as any,
                            });
                          }}
                        >
                          <SelectTrigger id="edit-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      Notification Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="settings-notify-entry"
                          className="cursor-pointer"
                        >
                          Notify on Entry
                        </Label>
                        <Switch
                          id="settings-notify-entry"
                          checked={
                            selectedGeofence.notificationSettings
                              ?.notifyOnEntry ?? true
                          }
                          onCheckedChange={(checked) => {
                            setSelectedGeofence({
                              ...selectedGeofence,
                              notificationSettings: {
                                ...selectedGeofence.notificationSettings,
                                notifyOnEntry: checked,
                              },
                            });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="settings-notify-exit"
                          className="cursor-pointer"
                        >
                          Notify on Exit
                        </Label>
                        <Switch
                          id="settings-notify-exit"
                          checked={
                            selectedGeofence.notificationSettings
                              ?.notifyOnExit ?? true
                          }
                          onCheckedChange={(checked) => {
                            setSelectedGeofence({
                              ...selectedGeofence,
                              notificationSettings: {
                                ...selectedGeofence.notificationSettings,
                                notifyOnExit: checked,
                              },
                            });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="settings-notify-drivers"
                          className="cursor-pointer"
                        >
                          Notify Drivers
                        </Label>
                        <Switch
                          id="settings-notify-drivers"
                          checked={
                            selectedGeofence.notificationSettings
                              ?.notifyDrivers ?? true
                          }
                          onCheckedChange={(checked) => {
                            setSelectedGeofence({
                              ...selectedGeofence,
                              notificationSettings: {
                                ...selectedGeofence.notificationSettings,
                                notifyDrivers: checked,
                              },
                            });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="settings-notify-carriers"
                          className="cursor-pointer"
                        >
                          Notify Carriers
                        </Label>
                        <Switch
                          id="settings-notify-carriers"
                          checked={
                            selectedGeofence.notificationSettings
                              ?.notifyCarriers ?? true
                          }
                          onCheckedChange={(checked) => {
                            setSelectedGeofence({
                              ...selectedGeofence,
                              notificationSettings: {
                                ...selectedGeofence.notificationSettings,
                                notifyCarriers: checked,
                              },
                            });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="settings-notify-shippers"
                          className="cursor-pointer"
                        >
                          Notify Shippers
                        </Label>
                        <Switch
                          id="settings-notify-shippers"
                          checked={
                            selectedGeofence.notificationSettings
                              ?.notifyShippers ?? false
                          }
                          onCheckedChange={(checked) => {
                            setSelectedGeofence({
                              ...selectedGeofence,
                              notificationSettings: {
                                ...selectedGeofence.notificationSettings,
                                notifyShippers: checked,
                              },
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedGeofence(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      handleGeofenceUpdate(selectedGeofence);
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
