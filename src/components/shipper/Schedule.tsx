import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Truck,
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  Plus,
  Filter,
  Download,
  Search,
} from "lucide-react";
import { FilterDialog } from "@/components/ui/filter-dialog";
import { formatShipmentsForExport, exportToCSV } from "./ExportUtils";

interface Shipment {
  id: string;
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
  carrier: string;
  type: string;
}

export default function Schedule() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // New shipment form state
  const [newShipment, setNewShipment] = useState({
    pickupLocation: "",
    pickupDate: "",
    pickupTime: "",
    deliveryLocation: "",
    deliveryDate: "",
    deliveryTime: "",
    carrier: "",
    type: "FTL",
    weight: "",
    dimensions: "",
    specialInstructions: "",
    referenceNumber: "",
  });

  const [shipments, setShipments] = useState<Shipment[]>([
    {
      id: "SHP-001",
      pickup: {
        location: "Chicago, IL",
        time: "09:00 AM",
        completed: true,
      },
      delivery: {
        location: "Detroit, MI",
        time: "04:00 PM",
        completed: false,
      },
      carrier: "FastFreight Logistics",
      type: "FTL",
    },
    {
      id: "SHP-002",
      pickup: {
        location: "Milwaukee, WI",
        time: "10:00 AM",
        completed: true,
      },
      delivery: {
        location: "Minneapolis, MN",
        time: "05:00 PM",
        completed: false,
      },
      carrier: "Global Transport Co",
      type: "LTL",
    },
  ]);

  const [filteredShipments, setFilteredShipments] =
    useState<Shipment[]>(shipments);

  // Update filtered shipments when date changes
  useEffect(() => {
    // In a real app, you would filter based on the selected date
    // For now, we'll just show all shipments regardless of date
    setFilteredShipments(shipments);
  }, [date, shipments]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    // In a real app, you would fetch shipments for this date
    console.log("Selected date:", selectedDate);
  };

  const handleExport = () => {
    const formattedData = shipments.map((shipment) => ({
      ID: shipment.id,
      Type: shipment.type,
      Carrier: shipment.carrier,
      "Pickup Location": shipment.pickup.location,
      "Pickup Time": shipment.pickup.time,
      "Delivery Location": shipment.delivery.location,
      "Delivery Time": shipment.delivery.time,
      Date: date ? date.toLocaleDateString() : "N/A",
    }));

    exportToCSV(formattedData, "schedule");
  };

  const handleApplyFilters = (filters: Record<string, any>) => {
    console.log("Applied filters:", filters);
    // In a real app, you would filter the shipments based on these filters

    toast({
      title: "Filters Applied",
      description: "Your shipment filters have been applied.",
      variant: "success",
    });
  };

  const handleScheduleShipment = () => {
    if (
      !newShipment.pickupLocation ||
      !newShipment.pickupDate ||
      !newShipment.deliveryLocation ||
      !newShipment.deliveryDate
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newShipmentObj: Shipment = {
      id: `SHP-${(shipments.length + 1).toString().padStart(3, "0")}`,
      pickup: {
        location: newShipment.pickupLocation,
        time: newShipment.pickupTime || "00:00 AM",
        completed: false,
      },
      delivery: {
        location: newShipment.deliveryLocation,
        time: newShipment.deliveryTime || "00:00 AM",
        completed: false,
      },
      carrier: newShipment.carrier || "Unassigned",
      type: newShipment.type,
    };

    setShipments([...shipments, newShipmentObj]);
    setShowScheduleDialog(false);

    // Reset form
    setNewShipment({
      pickupLocation: "",
      pickupDate: "",
      pickupTime: "",
      deliveryLocation: "",
      deliveryDate: "",
      deliveryTime: "",
      carrier: "",
      type: "FTL",
      weight: "",
      dimensions: "",
      specialInstructions: "",
      referenceNumber: "",
    });

    toast({
      title: "Shipment Scheduled",
      description: `Shipment ${newShipmentObj.id} has been scheduled successfully.`,
      variant: "success",
    });
  };

  const filterOptions = [
    {
      label: "Carrier",
      value: "carrier",
      type: "select" as const,
      options: [
        { label: "All Carriers", value: "all" },
        { label: "FastFreight Logistics", value: "fastfreight" },
        { label: "Global Transport Co", value: "global" },
      ],
    },
    {
      label: "Shipment Type",
      value: "type",
      type: "select" as const,
      options: [
        { label: "All Types", value: "all" },
        { label: "FTL", value: "ftl" },
        { label: "LTL", value: "ltl" },
      ],
    },
    {
      label: "Status",
      value: "status",
      type: "select" as const,
      options: [
        { label: "All", value: "all" },
        { label: "Completed", value: "completed" },
        { label: "In Progress", value: "in_progress" },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Shipment Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredShipments.length} shipments scheduled
          </p>
        </div>
        <div className="flex gap-2">
          <FilterDialog
            title="Filter Schedule"
            filters={filterOptions}
            onApplyFilters={handleApplyFilters}
          />
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setShowScheduleDialog(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Shipment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Card className="md:col-span-4">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <div className="md:col-span-8 space-y-4">
          {filteredShipments.length > 0 ? (
            filteredShipments.map((shipment) => (
              <Card key={shipment.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{shipment.id}</h3>
                        <Badge variant="outline">{shipment.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {shipment.carrier}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(`/shipper/shipments/${shipment.id}`)
                      }
                    >
                      View Details
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Pickup</p>
                          <p className="font-medium">
                            {shipment.pickup.location}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <CalendarIcon className="h-3 w-3" />
                            {date?.toLocaleDateString()}
                            <Clock className="h-3 w-3" />
                            {shipment.pickup.time}
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              shipment.pickup.completed
                                ? "text-green-600"
                                : "text-yellow-600"
                            }
                          >
                            {shipment.pickup.completed
                              ? "Completed"
                              : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Delivery</p>
                          <p className="font-medium">
                            {shipment.delivery.location}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <CalendarIcon className="h-3 w-3" />
                            {date?.toLocaleDateString()}
                            <Clock className="h-3 w-3" />
                            {shipment.delivery.time}
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              shipment.delivery.completed
                                ? "text-green-600"
                                : "text-yellow-600"
                            }
                          >
                            {shipment.delivery.completed
                              ? "Completed"
                              : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // In a real app, this would mark the pickup as completed
                        const updatedShipments = shipments.map((s) => {
                          if (s.id === shipment.id) {
                            return {
                              ...s,
                              pickup: {
                                ...s.pickup,
                                completed: true,
                              },
                            };
                          }
                          return s;
                        });
                        setShipments(updatedShipments);
                      }}
                      disabled={shipment.pickup.completed}
                    >
                      Mark Pickup Complete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // In a real app, this would mark the delivery as completed
                        const updatedShipments = shipments.map((s) => {
                          if (s.id === shipment.id) {
                            return {
                              ...s,
                              delivery: {
                                ...s.delivery,
                                completed: true,
                              },
                            };
                          }
                          return s;
                        });
                        setShipments(updatedShipments);
                      }}
                      disabled={
                        shipment.delivery.completed ||
                        !shipment.pickup.completed
                      }
                    >
                      Mark Delivery Complete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6">
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No shipments scheduled for this date.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowScheduleDialog(true)}
                >
                  Schedule a Shipment
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Schedule Shipment Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Schedule New Shipment</DialogTitle>
            <DialogDescription>
              Enter shipment details to schedule a new delivery.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <h3 className="font-medium">Pickup Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup-location">Pickup Location *</Label>
                  <Input
                    id="pickup-location"
                    placeholder="City, State"
                    value={newShipment.pickupLocation}
                    onChange={(e) =>
                      setNewShipment({
                        ...newShipment,
                        pickupLocation: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup-date">Pickup Date *</Label>
                  <Input
                    id="pickup-date"
                    type="date"
                    value={newShipment.pickupDate}
                    onChange={(e) =>
                      setNewShipment({
                        ...newShipment,
                        pickupDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickup-time">Pickup Time</Label>
                <Input
                  id="pickup-time"
                  type="time"
                  value={newShipment.pickupTime}
                  onChange={(e) =>
                    setNewShipment({
                      ...newShipment,
                      pickupTime: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <h3 className="font-medium">Delivery Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery-location">Delivery Location *</Label>
                  <Input
                    id="delivery-location"
                    placeholder="City, State"
                    value={newShipment.deliveryLocation}
                    onChange={(e) =>
                      setNewShipment({
                        ...newShipment,
                        deliveryLocation: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-date">Delivery Date *</Label>
                  <Input
                    id="delivery-date"
                    type="date"
                    value={newShipment.deliveryDate}
                    onChange={(e) =>
                      setNewShipment({
                        ...newShipment,
                        deliveryDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-time">Delivery Time</Label>
                <Input
                  id="delivery-time"
                  type="time"
                  value={newShipment.deliveryTime}
                  onChange={(e) =>
                    setNewShipment({
                      ...newShipment,
                      deliveryTime: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <h3 className="font-medium">Shipment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carrier">Carrier</Label>
                  <Select
                    value={newShipment.carrier}
                    onValueChange={(value) =>
                      setNewShipment({ ...newShipment, carrier: value })
                    }
                  >
                    <SelectTrigger id="carrier">
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FastFreight Logistics">
                        FastFreight Logistics
                      </SelectItem>
                      <SelectItem value="Global Transport Co">
                        Global Transport Co
                      </SelectItem>
                      <SelectItem value="Rapid Shipping Inc">
                        Rapid Shipping Inc
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipment-type">Shipment Type</Label>
                  <Select
                    value={newShipment.type}
                    onValueChange={(value) =>
                      setNewShipment({ ...newShipment, type: value })
                    }
                  >
                    <SelectTrigger id="shipment-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FTL">Full Truckload (FTL)</SelectItem>
                      <SelectItem value="LTL">
                        Less Than Truckload (LTL)
                      </SelectItem>
                      <SelectItem value="Expedited">Expedited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="0"
                    value={newShipment.weight}
                    onChange={(e) =>
                      setNewShipment({ ...newShipment, weight: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dimensions">Dimensions (L×W×H)</Label>
                  <Input
                    id="dimensions"
                    placeholder="e.g., 48×40×48"
                    value={newShipment.dimensions}
                    onChange={(e) =>
                      setNewShipment({
                        ...newShipment,
                        dimensions: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Reference Number</Label>
                <Input
                  id="reference"
                  placeholder="Optional reference number"
                  value={newShipment.referenceNumber}
                  onChange={(e) =>
                    setNewShipment({
                      ...newShipment,
                      referenceNumber: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Special Instructions</Label>
                <Input
                  id="instructions"
                  placeholder="Enter any special instructions or notes"
                  value={newShipment.specialInstructions}
                  onChange={(e) =>
                    setNewShipment({
                      ...newShipment,
                      specialInstructions: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowScheduleDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleScheduleShipment}>Schedule Shipment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
