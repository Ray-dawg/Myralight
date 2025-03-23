import React, { useState, useEffect } from "react";
import {
  Truck,
  Settings,
  AlertCircle,
  PlusCircle,
  FileText,
  Sun,
  Moon,
  MapPin,
  Navigation,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Upload,
  Download,
  Wrench,
  FileCheck,
  Trash,
  Edit,
  Eye,
} from "lucide-react";
import MapComponent from "@/components/shared/MapComponent";
import RouteMap from "@/components/shared/RouteMap";
import GeofenceMap from "@/components/shared/GeofenceMap";

interface Vehicle {
  id: string;
  number: string;
  make: string;
  model: string;
  year: string;
  status: "active" | "maintenance" | "out_of_service";
  fuelLevel: number;
  mileage: number;
  nextInspection: string;
  maintenanceTasks: {
    id: string;
    type: string;
    status: "pending" | "overdue";
    dueDate: string;
  }[];
  assignedDriver?: {
    id: string;
    name: string;
  };
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  documents: {
    id: string;
    name: string;
    type: string;
    status: "valid" | "expiring" | "expired";
    expiryDate: string;
    uploadDate: string;
  }[];
  maintenanceHistory: {
    id: string;
    date: string;
    type: string;
    description: string;
    cost: number;
    status: "completed" | "scheduled" | "in_progress";
  }[];
  maintenanceSchedule: {
    id: string;
    date: string;
    type: string;
    description: string;
    estimatedCost: number;
  }[];
}

export default function FleetDashboard() {
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showAddVehicleDialog, setShowAddVehicleDialog] = useState(false);
  const [showDocumentsSheet, setShowDocumentsSheet] = useState(false);
  const [showMaintenanceSheet, setShowMaintenanceSheet] = useState(false);
  const [showGeofenceSheet, setShowGeofenceSheet] = useState(false);
  const [showRouteSheet, setShowRouteSheet] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [geofences, setGeofences] = useState<
    Array<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      radius: number;
      address?: string;
    }>
  >([]);
  const [mapMarkers, setMapMarkers] = useState<
    Array<{
      id: string;
      longitude: number;
      latitude: number;
      color?: string;
      popupContent?: React.ReactNode | string;
    }>
  >([]);
  const [mapRoutes, setMapRoutes] = useState<
    Array<{
      id: string;
      coordinates: Array<[number, number]>;
      color?: string;
      width?: number;
    }>
  >([]);

  // New vehicle form state
  const [newVehicle, setNewVehicle] = useState({
    number: "",
    type: "",
    make: "",
    model: "",
    year: "",
    vin: "",
    licensePlate: "",
    mileage: "",
    fuelCapacity: "",
    notes: "",
  });

  // New maintenance form state
  const [newMaintenance, setNewMaintenance] = useState({
    date: "",
    type: "",
    description: "",
    estimatedCost: "",
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: "1",
      number: "TRK-2024-001",
      make: "Freightliner",
      model: "Cascadia",
      year: "2024",
      status: "active",
      fuelLevel: 75,
      mileage: 45890,
      nextInspection: "2024-03-15",
      location: {
        lat: 41.8781,
        lng: -87.6298,
        address: "Chicago, IL",
      },
      maintenanceTasks: [
        {
          id: "mt1",
          type: "Oil Change",
          status: "pending",
          dueDate: "2024-03-20",
        },
      ],
      assignedDriver: {
        id: "d1",
        name: "John Smith",
      },
      documents: [
        {
          id: "doc1",
          name: "Registration",
          type: "Registration",
          status: "valid",
          expiryDate: "2024-12-31",
          uploadDate: "2024-01-15",
        },
        {
          id: "doc2",
          name: "Insurance",
          type: "Insurance",
          status: "valid",
          expiryDate: "2024-06-30",
          uploadDate: "2024-01-15",
        },
      ],
      maintenanceHistory: [
        {
          id: "mh1",
          date: "2024-01-15",
          type: "Preventive",
          description: "Regular maintenance",
          cost: 450,
          status: "completed",
        },
      ],
      maintenanceSchedule: [
        {
          id: "ms1",
          date: "2024-04-15",
          type: "Preventive",
          description: "Oil change and inspection",
          estimatedCost: 500,
        },
      ],
    },
    {
      id: "2",
      number: "TRK-2023-005",
      make: "Peterbilt",
      model: "579",
      year: "2023",
      status: "maintenance",
      fuelLevel: 45,
      mileage: 78450,
      nextInspection: "2024-03-01",
      location: {
        lat: 43.0389,
        lng: -87.9065,
        address: "Milwaukee, WI",
      },
      maintenanceTasks: [
        {
          id: "mt2",
          type: "Brake Service",
          status: "overdue",
          dueDate: "2024-02-15",
        },
      ],
      documents: [
        {
          id: "doc3",
          name: "Registration",
          type: "Registration",
          status: "valid",
          expiryDate: "2024-11-30",
          uploadDate: "2023-12-01",
        },
        {
          id: "doc4",
          name: "Insurance",
          type: "Insurance",
          status: "expired",
          expiryDate: "2024-02-28",
          uploadDate: "2023-09-01",
        },
      ],
      maintenanceHistory: [
        {
          id: "mh2",
          date: "2023-12-10",
          type: "Repair",
          description: "Transmission repair",
          cost: 2200,
          status: "completed",
        },
      ],
      maintenanceSchedule: [
        {
          id: "ms2",
          date: "2024-03-15",
          type: "Repair",
          description: "Brake system repair",
          estimatedCost: 1500,
        },
      ],
    },
    {
      id: "3",
      number: "TRK-2023-008",
      make: "Kenworth",
      model: "T680",
      year: "2023",
      status: "out_of_service",
      fuelLevel: 20,
      mileage: 92340,
      nextInspection: "2024-02-28",
      location: {
        lat: 44.9778,
        lng: -93.265,
        address: "Minneapolis, MN",
      },
      maintenanceTasks: [
        {
          id: "mt3",
          type: "Engine Repair",
          status: "pending",
          dueDate: "2024-02-25",
        },
      ],
      documents: [
        {
          id: "doc5",
          name: "Registration",
          type: "Registration",
          status: "valid",
          expiryDate: "2024-10-15",
          uploadDate: "2023-11-15",
        },
      ],
      maintenanceHistory: [
        {
          id: "mh3",
          date: "2024-01-05",
          type: "Repair",
          description: "Engine overhaul",
          cost: 5500,
          status: "completed",
        },
      ],
      maintenanceSchedule: [],
    },
  ]);

  const getStatusBadge = (status: Vehicle["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "maintenance":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            In Maintenance
          </Badge>
        );
      case "out_of_service":
        return (
          <Badge className="bg-red-100 text-red-800">Out of Service</Badge>
        );
    }
  };

  const getDocumentStatusBadge = (status: "valid" | "expiring" | "expired") => {
    const styles = {
      valid: "bg-green-100 text-green-800",
      expiring: "bg-yellow-100 text-yellow-800",
      expired: "bg-red-100 text-red-800",
    };

    return <Badge className={styles[status]}>{status.toUpperCase()}</Badge>;
  };

  const getMaintenanceStatusBadge = (
    status: "completed" | "scheduled" | "in_progress",
  ) => {
    const styles = {
      completed: "bg-green-100 text-green-800",
      scheduled: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
    };

    return <Badge className={styles[status]}>{status.toUpperCase()}</Badge>;
  };

  const handleAddVehicle = () => {
    if (!newVehicle.number || !newVehicle.type) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newVehicleObj: Vehicle = {
      id: `${vehicles.length + 1}`,
      number: newVehicle.number,
      make: newVehicle.make,
      model: newVehicle.model,
      year: newVehicle.year,
      status: "active",
      fuelLevel: 100,
      mileage: parseInt(newVehicle.mileage) || 0,
      nextInspection: new Date(new Date().setMonth(new Date().getMonth() + 3))
        .toISOString()
        .split("T")[0],
      maintenanceTasks: [],
      documents: [],
      maintenanceHistory: [],
      maintenanceSchedule: [],
    };

    setVehicles([...vehicles, newVehicleObj]);
    setShowAddVehicleDialog(false);
    setNewVehicle({
      number: "",
      type: "",
      make: "",
      model: "",
      year: "",
      vin: "",
      licensePlate: "",
      mileage: "",
      fuelCapacity: "",
      notes: "",
    });

    toast({
      title: "Vehicle Added",
      description: `${newVehicleObj.number} has been added to your fleet.`,
      variant: "success",
    });
  };

  const handleUploadDocument = () => {
    if (!selectedVehicle) return;
    if (!uploadFile || !documentType || !expiryDate) {
      toast({
        title: "Missing Information",
        description: "Please provide all document information.",
        variant: "destructive",
      });
      return;
    }

    const newDoc = {
      id: `doc${Math.floor(Math.random() * 1000)}`,
      name: uploadFile.name,
      type: documentType,
      status: "valid" as const,
      expiryDate: expiryDate,
      uploadDate: new Date().toISOString().split("T")[0],
    };

    const updatedVehicles = vehicles.map((v) => {
      if (v.id === selectedVehicle.id) {
        return {
          ...v,
          documents: [...v.documents, newDoc],
        };
      }
      return v;
    });

    setVehicles(updatedVehicles);
    setSelectedVehicle(
      updatedVehicles.find((v) => v.id === selectedVehicle.id) || null,
    );
    setUploadFile(null);
    setDocumentType("");
    setExpiryDate("");

    toast({
      title: "Document Uploaded",
      description: `${newDoc.name} has been uploaded successfully.`,
      variant: "success",
    });
  };

  const handleAddMaintenance = () => {
    if (!selectedVehicle) return;
    if (
      !newMaintenance.date ||
      !newMaintenance.type ||
      !newMaintenance.description
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required maintenance fields.",
        variant: "destructive",
      });
      return;
    }

    const newMaintenanceItem = {
      id: `ms${Math.floor(Math.random() * 1000)}`,
      date: newMaintenance.date,
      type: newMaintenance.type,
      description: newMaintenance.description,
      estimatedCost: parseFloat(newMaintenance.estimatedCost) || 0,
    };

    const updatedVehicles = vehicles.map((v) => {
      if (v.id === selectedVehicle.id) {
        return {
          ...v,
          maintenanceSchedule: [...v.maintenanceSchedule, newMaintenanceItem],
        };
      }
      return v;
    });

    setVehicles(updatedVehicles);
    setSelectedVehicle(
      updatedVehicles.find((v) => v.id === selectedVehicle.id) || null,
    );
    setNewMaintenance({
      date: "",
      type: "",
      description: "",
      estimatedCost: "",
    });

    toast({
      title: "Maintenance Scheduled",
      description: `Maintenance has been scheduled for ${newMaintenanceItem.date}.`,
      variant: "success",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleDeleteDocument = (docId: string) => {
    if (!selectedVehicle) return;

    const updatedVehicles = vehicles.map((v) => {
      if (v.id === selectedVehicle.id) {
        return {
          ...v,
          documents: v.documents.filter((doc) => doc.id !== docId),
        };
      }
      return v;
    });

    setVehicles(updatedVehicles);
    setSelectedVehicle(
      updatedVehicles.find((v) => v.id === selectedVehicle.id) || null,
    );

    toast({
      title: "Document Deleted",
      description: "The document has been removed.",
      variant: "success",
    });
  };

  // Prepare map markers and routes based on vehicles
  useEffect(() => {
    // Create markers for each vehicle
    const markers = vehicles.map((vehicle) => ({
      id: vehicle.id,
      longitude: vehicle.location?.lng || -95.7129,
      latitude: vehicle.location?.lat || 37.0902,
      color:
        vehicle.status === "active"
          ? "#4CAF50"
          : vehicle.status === "maintenance"
            ? "#FFC107"
            : "#F44336",
      popupContent: `
        <div class="p-2">
          <div class="font-bold">${vehicle.number}</div>
          <div>${vehicle.make} ${vehicle.model} ${vehicle.year}</div>
          <div>Status: ${vehicle.status.replace("_", " ").toUpperCase()}</div>
          ${vehicle.assignedDriver ? `<div>Driver: ${vehicle.assignedDriver.name}</div>` : ""}
          <div>Fuel: ${vehicle.fuelLevel}%</div>
        </div>
      `,
    }));

    // Add geofence circles to the map
    const geofenceRoutes = geofences.map((geofence) => ({
      id: `geofence-${geofence.id}`,
      coordinates: createCirclePoints(
        [geofence.longitude, geofence.latitude],
        geofence.radius,
      ),
      color: "#4CAF50",
      width: 2,
    }));

    setMapMarkers(markers);
    setMapRoutes(geofenceRoutes);
  }, [vehicles, geofences]);

  // Function to create circle points for geofences
  const createCirclePoints = (
    center: [number, number],
    radiusInMeters: number,
    points = 64,
  ) => {
    const coordinates: [number, number][] = [];
    const km = radiusInMeters / 1000;

    // Earth's radius in km
    const earthRadius = 6371;

    // Convert latitude and longitude to radians
    const lat = (center[1] * Math.PI) / 180;
    const lng = (center[0] * Math.PI) / 180;

    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;

      // Calculate the point at the given angle and distance
      const latPoint = Math.asin(
        Math.sin(lat) * Math.cos(km / earthRadius) +
          Math.cos(lat) * Math.sin(km / earthRadius) * Math.cos(angle),
      );

      const lngPoint =
        lng +
        Math.atan2(
          Math.sin(angle) * Math.sin(km / earthRadius) * Math.cos(lat),
          Math.cos(km / earthRadius) - Math.sin(lat) * Math.sin(latPoint),
        );

      // Convert back to degrees
      const latDeg = (latPoint * 180) / Math.PI;
      const lngDeg = (lngPoint * 180) / Math.PI;

      coordinates.push([lngDeg, latDeg]);
    }

    return coordinates;
  };

  // Handle geofence creation
  const handleGeofenceCreate = (geofence: {
    latitude: number;
    longitude: number;
    radius: number;
    address?: string;
  }) => {
    const newGeofence = {
      id: `geo-${Math.floor(Math.random() * 10000)}`,
      name: geofence.address || `Geofence ${geofences.length + 1}`,
      ...geofence,
    };

    setGeofences([...geofences, newGeofence]);
    setShowGeofenceSheet(false);

    toast({
      title: "Geofence Created",
      description: `New geofence "${newGeofence.name}" has been created.`,
      variant: "success",
    });
  };

  return (
    <div className="h-screen relative overflow-hidden">
      {/* Map Container */}
      <div className="absolute inset-0 bg-gray-100">
        <MapComponent
          markers={mapMarkers}
          routes={mapRoutes}
          style={{ width: "100%", height: "100%" }}
          className="bg-gray-100"
        />
      </div>

      {/* Fleet Panel */}
      <div className="absolute top-6 left-4 md:left-28 w-96 max-h-[calc(100vh-1.5rem)] overflow-y-auto space-y-4">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold">Fleet Vehicles</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              {isDarkMode ? (
                <Sun className="text-yellow-500" />
              ) : (
                <Moon className="text-gray-600" />
              )}
            </button>
            <Button
              onClick={() => setShowGeofenceSheet(true)}
              variant="outline"
            >
              <Target className="h-4 w-4 mr-2" />
              Add Geofence
            </Button>
            <Button onClick={() => setShowAddVehicleDialog(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        </div>

        {vehicles.map((vehicle) => (
          <Card
            key={vehicle.id}
            className={`${isDarkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-50"} cursor-pointer transition-all`}
            onClick={() => setSelectedVehicle(vehicle)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-medium text-lg">#{vehicle.number}</h3>
                  <p
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {vehicle.make} {vehicle.model} {vehicle.year}
                  </p>
                </div>
                {getStatusBadge(vehicle.status)}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fuel Level</span>
                    <span>{vehicle.fuelLevel}%</span>
                  </div>
                  <Progress
                    value={vehicle.fuelLevel}
                    className={isDarkMode ? "bg-gray-700" : "bg-gray-100"}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Location
                    </p>
                    <p className="font-medium">{vehicle.location?.address}</p>
                  </div>
                  <div>
                    <p
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Next Inspection
                    </p>
                    <p className="font-medium">
                      {new Date(vehicle.nextInspection).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {vehicle.maintenanceTasks.some(
                  (task) => task.status === "overdue",
                ) && (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Overdue Maintenance
                  </div>
                )}

                {vehicle.assignedDriver && (
                  <div
                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Driver:{" "}
                    <span className="font-medium">
                      {vehicle.assignedDriver.name}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      isDarkMode ? "border-gray-700 hover:bg-gray-700" : ""
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVehicle(vehicle);
                      setShowMaintenanceSheet(true);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Maintenance
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      isDarkMode ? "border-gray-700 hover:bg-gray-700" : ""
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVehicle(vehicle);
                      setShowDocumentsSheet(true);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Documents
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      isDarkMode ? "border-gray-700 hover:bg-gray-700" : ""
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVehicle(vehicle);
                      setShowRouteSheet(true);
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Route
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Vehicle Dialog */}
      <Dialog
        open={showAddVehicleDialog}
        onOpenChange={setShowAddVehicleDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>
              Enter the details of the new vehicle to add to your fleet.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle-number">Vehicle Number *</Label>
                <Input
                  id="vehicle-number"
                  placeholder="e.g., TRK-2024-004"
                  value={newVehicle.number}
                  onChange={(e) =>
                    setNewVehicle({ ...newVehicle, number: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle-type">Vehicle Type *</Label>
                <Select
                  value={newVehicle.type}
                  onValueChange={(value) =>
                    setNewVehicle({ ...newVehicle, type: value })
                  }
                >
                  <SelectTrigger id="vehicle-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semi-Truck">Semi-Truck</SelectItem>
                    <SelectItem value="Box Truck">Box Truck</SelectItem>
                    <SelectItem value="Flatbed">Flatbed</SelectItem>
                    <SelectItem value="Refrigerated">Refrigerated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle-make">Make</Label>
                <Input
                  id="vehicle-make"
                  placeholder="e.g., Freightliner"
                  value={newVehicle.make}
                  onChange={(e) =>
                    setNewVehicle({ ...newVehicle, make: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle-model">Model</Label>
                <Input
                  id="vehicle-model"
                  placeholder="e.g., Cascadia"
                  value={newVehicle.model}
                  onChange={(e) =>
                    setNewVehicle({ ...newVehicle, model: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle-year">Year</Label>
                <Input
                  id="vehicle-year"
                  placeholder="e.g., 2024"
                  value={newVehicle.year}
                  onChange={(e) =>
                    setNewVehicle({ ...newVehicle, year: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle-vin">VIN Number</Label>
                <Input
                  id="vehicle-vin"
                  placeholder="Vehicle Identification Number"
                  value={newVehicle.vin}
                  onChange={(e) =>
                    setNewVehicle({ ...newVehicle, vin: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle-license">License Plate</Label>
                <Input
                  id="vehicle-license"
                  placeholder="License plate number"
                  value={newVehicle.licensePlate}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      licensePlate: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle-mileage">Current Mileage</Label>
                <Input
                  id="vehicle-mileage"
                  type="number"
                  placeholder="e.g., 0"
                  value={newVehicle.mileage}
                  onChange={(e) =>
                    setNewVehicle({ ...newVehicle, mileage: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle-fuel">Fuel Capacity (gallons)</Label>
                <Input
                  id="vehicle-fuel"
                  placeholder="e.g., 150"
                  value={newVehicle.fuelCapacity}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      fuelCapacity: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-notes">Notes</Label>
              <Textarea
                id="vehicle-notes"
                placeholder="Additional information about this vehicle"
                value={newVehicle.notes}
                onChange={(e) =>
                  setNewVehicle({ ...newVehicle, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddVehicleDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddVehicle}>Add Vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documents Sheet */}
      <Sheet open={showDocumentsSheet} onOpenChange={setShowDocumentsSheet}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedVehicle?.number} - Documents</SheetTitle>
            <SheetDescription>
              View and manage documents for this vehicle
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Vehicle Documents</h3>

              {selectedVehicle?.documents.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-gray-500">No documents uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedVehicle?.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-gray-500">{doc.type}</p>
                          </div>
                        </div>
                        {getDocumentStatusBadge(doc.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Expiry Date</p>
                          <p className="font-medium">{doc.expiryDate}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Upload Date</p>
                          <p className="font-medium">{doc.uploadDate}</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Upload New Document</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document-file">Select File</Label>
                  <Input
                    id="document-file"
                    type="file"
                    onChange={handleFileChange}
                  />
                  {uploadFile && (
                    <p className="text-sm text-green-600">
                      Selected: {uploadFile.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="document-type">Document Type</Label>
                    <Select
                      value={documentType}
                      onValueChange={setDocumentType}
                    >
                      <SelectTrigger id="document-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Registration">
                          Registration
                        </SelectItem>
                        <SelectItem value="Insurance">Insurance</SelectItem>
                        <SelectItem value="Inspection">Inspection</SelectItem>
                        <SelectItem value="Maintenance">
                          Maintenance Record
                        </SelectItem>
                        <SelectItem value="Title">Title</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry-date">Expiry Date</Label>
                    <Input
                      id="expiry-date"
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleUploadDocument}
                  disabled={!uploadFile || !documentType || !expiryDate}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </div>
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setShowDocumentsSheet(false)}
            >
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Maintenance Sheet */}
      <Sheet open={showMaintenanceSheet} onOpenChange={setShowMaintenanceSheet}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedVehicle?.number} - Maintenance</SheetTitle>
            <SheetDescription>
              View and schedule maintenance for this vehicle
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            <Tabs defaultValue="schedule">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="schedule">Maintenance Schedule</TabsTrigger>
                <TabsTrigger value="history">Maintenance History</TabsTrigger>
              </TabsList>

              <TabsContent value="schedule" className="space-y-4 pt-4">
                <h3 className="text-lg font-medium">Upcoming Maintenance</h3>

                {selectedVehicle?.maintenanceSchedule.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
                    <p className="text-gray-500">
                      No maintenance scheduled yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedVehicle?.maintenanceSchedule.map((maintenance) => (
                      <div
                        key={maintenance.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <p className="font-medium">{maintenance.date}</p>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {maintenance.type}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-blue-50">
                            Scheduled
                          </Badge>
                        </div>

                        <p className="text-sm">{maintenance.description}</p>

                        <div className="flex justify-between items-center pt-2">
                          <p className="text-sm">
                            <span className="text-gray-500">
                              Estimated Cost:
                            </span>{" "}
                            ${maintenance.estimatedCost.toFixed(2)}
                          </p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t pt-4 mt-6">
                  <h3 className="text-lg font-medium mb-4">
                    Schedule New Maintenance
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maintenance-date">Date</Label>
                        <Input
                          id="maintenance-date"
                          type="date"
                          value={newMaintenance.date}
                          onChange={(e) =>
                            setNewMaintenance({
                              ...newMaintenance,
                              date: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maintenance-type">Type</Label>
                        <Select
                          value={newMaintenance.type}
                          onValueChange={(value) =>
                            setNewMaintenance({
                              ...newMaintenance,
                              type: value,
                            })
                          }
                        >
                          <SelectTrigger id="maintenance-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Preventive">
                              Preventive Maintenance
                            </SelectItem>
                            <SelectItem value="Repair">Repair</SelectItem>
                            <SelectItem value="Inspection">
                              Inspection
                            </SelectItem>
                            <SelectItem value="Tire">Tire Service</SelectItem>
                            <SelectItem value="Oil">Oil Change</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maintenance-description">
                        Description
                      </Label>
                      <Textarea
                        id="maintenance-description"
                        placeholder="Describe the maintenance to be performed"
                        value={newMaintenance.description}
                        onChange={(e) =>
                          setNewMaintenance({
                            ...newMaintenance,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maintenance-cost">
                        Estimated Cost ($)
                      </Label>
                      <Input
                        id="maintenance-cost"
                        type="number"
                        placeholder="0.00"
                        value={newMaintenance.estimatedCost}
                        onChange={(e) =>
                          setNewMaintenance({
                            ...newMaintenance,
                            estimatedCost: e.target.value,
                          })
                        }
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleAddMaintenance}
                      disabled={
                        !newMaintenance.date ||
                        !newMaintenance.type ||
                        !newMaintenance.description
                      }
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Maintenance
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4 pt-4">
                <h3 className="text-lg font-medium">Maintenance History</h3>

                {selectedVehicle?.maintenanceHistory.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
                    <p className="text-gray-500">
                      No maintenance history available.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedVehicle?.maintenanceHistory.map((maintenance) => (
                      <div
                        key={maintenance.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <p className="font-medium">{maintenance.date}</p>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {maintenance.type}
                            </p>
                          </div>
                          {getMaintenanceStatusBadge(maintenance.status)}
                        </div>

                        <p className="text-sm">{maintenance.description}</p>

                        <div className="flex justify-between items-center pt-2">
                          <p className="text-sm">
                            <span className="text-gray-500">Cost:</span> $
                            {maintenance.cost.toFixed(2)}
                          </p>
                          <Button variant="outline" size="sm">
                            <FileCheck className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setShowMaintenanceSheet(false)}
            >
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Route Sheet */}
      <Sheet open={showRouteSheet} onOpenChange={setShowRouteSheet}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedVehicle?.number} - Route</SheetTitle>
            <SheetDescription>
              View and plan routes for this vehicle
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {selectedVehicle && (
              <RouteMap
                origin={{
                  latitude: selectedVehicle.location?.lat || 41.8781,
                  longitude: selectedVehicle.location?.lng || -87.6298,
                }}
                destination={{
                  latitude: 41.8339,
                  longitude: -87.872,
                }}
                originLabel={`${selectedVehicle.number} - Current Location`}
                destinationLabel="Destination"
                height="400px"
                className="rounded-lg overflow-hidden"
              />
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Route Details</h3>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  placeholder="Enter destination address"
                  defaultValue="Chicago O'Hare International Airport"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="route-type">Route Type</Label>
                <Select defaultValue="fastest">
                  <SelectTrigger id="route-type">
                    <SelectValue placeholder="Select route type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fastest">Fastest</SelectItem>
                    <SelectItem value="shortest">Shortest</SelectItem>
                    <SelectItem value="eco">Eco-friendly</SelectItem>
                    <SelectItem value="truck">Truck-friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estimated Time</Label>
                <p className="font-medium">1 hour 15 minutes</p>
              </div>

              <div className="space-y-2">
                <Label>Estimated Distance</Label>
                <p className="font-medium">28.5 miles</p>
              </div>

              <Button className="w-full">
                <Navigation className="h-4 w-4 mr-2" />
                Send Route to Driver
              </Button>
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setShowRouteSheet(false)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Geofence Sheet */}
      <Sheet open={showGeofenceSheet} onOpenChange={setShowGeofenceSheet}>
        <SheetContent className="overflow-y-auto" side="right" size="xl">
          <SheetHeader>
            <SheetTitle>Create Geofence</SheetTitle>
            <SheetDescription>
              Create a geofence to monitor vehicle activity in specific areas
            </SheetDescription>
          </SheetHeader>

          <div className="py-6">
            <GeofenceMap
              initialLocation={{
                latitude: 41.8781,
                longitude: -87.6298,
              }}
              initialRadius={500}
              onGeofenceCreate={handleGeofenceCreate}
              height="500px"
              className="rounded-lg overflow-hidden"
            />
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setShowGeofenceSheet(false)}
            >
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
