import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Truck,
  MapPin,
  Calendar,
  Clock,
  Package,
  FileText,
  User,
  Building,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LoadDetailsDialogProps {
  loadId: string;
  isOpen: boolean;
  onClose: () => void;
  userRole: "admin" | "shipper" | "carrier" | "driver";
}

export default function LoadDetailsDialog({
  loadId,
  isOpen,
  onClose,
  userRole,
}: LoadDetailsDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");

  // Fetch load details
  const loadDetails = useQuery(api.loads.getLoad, { loadId });

  // Status update mutation
  const updateLoadStatus = useMutation(api.loads.updateLoadStatus);

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-200 text-gray-800";
      case "posted":
        return "bg-blue-100 text-blue-800";
      case "assigned":
        return "bg-purple-100 text-purple-800";
      case "in_transit":
        return "bg-yellow-100 text-yellow-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-green-200 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateLoadStatus({
        loadId,
        status: newStatus as any,
      });

      toast({
        title: "Status Updated",
        description: `Load status changed to ${formatStatus(newStatus)}`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  };

  // Get available status transitions based on current status and user role
  const getAvailableStatusTransitions = () => {
    if (!loadDetails) return [];

    const currentStatus = loadDetails.status;
    const transitions = [];

    if (userRole === "admin") {
      // Admin can change to any status
      if (currentStatus !== "draft")
        transitions.push({ value: "draft", label: "Draft" });
      if (currentStatus !== "posted")
        transitions.push({ value: "posted", label: "Posted" });
      if (currentStatus !== "assigned")
        transitions.push({ value: "assigned", label: "Assigned" });
      if (currentStatus !== "in_transit")
        transitions.push({ value: "in_transit", label: "In Transit" });
      if (currentStatus !== "delivered")
        transitions.push({ value: "delivered", label: "Delivered" });
      if (currentStatus !== "completed")
        transitions.push({ value: "completed", label: "Completed" });
      if (currentStatus !== "cancelled")
        transitions.push({ value: "cancelled", label: "Cancelled" });
    } else if (userRole === "shipper") {
      // Shipper can post draft loads
      if (currentStatus === "draft")
        transitions.push({ value: "posted", label: "Post Load" });
      // Shipper can cancel posted or assigned loads
      if (["posted", "assigned"].includes(currentStatus))
        transitions.push({ value: "cancelled", label: "Cancel Load" });
      // Shipper can mark delivered loads as completed
      if (currentStatus === "delivered")
        transitions.push({ value: "completed", label: "Mark as Completed" });
    } else if (userRole === "carrier") {
      // Carrier can mark assigned loads as in transit
      if (currentStatus === "assigned")
        transitions.push({ value: "in_transit", label: "Mark as In Transit" });
      // Carrier can mark in_transit loads as delivered
      if (currentStatus === "in_transit")
        transitions.push({ value: "delivered", label: "Mark as Delivered" });
    } else if (userRole === "driver") {
      // Driver can mark assigned loads as in transit
      if (currentStatus === "assigned")
        transitions.push({ value: "in_transit", label: "Start Trip" });
      // Driver can mark in_transit loads as delivered
      if (currentStatus === "in_transit")
        transitions.push({ value: "delivered", label: "Mark as Delivered" });
    }

    return transitions;
  };

  if (!loadDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Load Details</DialogTitle>
            <DialogDescription>Loading...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                Load {loadDetails.referenceNumber}
                <Badge className={getStatusBadgeColor(loadDetails.status)}>
                  {formatStatus(loadDetails.status)}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Created on {formatDate(loadDetails.createdAt)}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {getAvailableStatusTransitions().map((transition) => (
                <Button
                  key={transition.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(transition.value)}
                >
                  {transition.value === "cancelled" ? (
                    <XCircle className="h-4 w-4 mr-1" />
                  ) : transition.value === "completed" ||
                    transition.value === "delivered" ? (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  ) : (
                    <Truck className="h-4 w-4 mr-1" />
                  )}
                  {transition.label}
                </Button>
              ))}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pickup Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                    Pickup Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm font-medium flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                        Date & Time
                      </div>
                      <div className="text-sm">
                        {formatDate(loadDetails.pickupWindowStart)} -{" "}
                        {formatTime(loadDetails.pickupWindowStart)}
                        <br />
                        to {formatTime(loadDetails.pickupWindowEnd)}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium">Location</div>
                      <div className="text-sm">
                        {loadDetails.pickupLocation?.name ||
                          "Location name not available"}
                        <br />
                        {loadDetails.pickupLocation?.address ||
                          "Address not available"}
                        <br />
                        {loadDetails.pickupLocation?.city || ""},{" "}
                        {loadDetails.pickupLocation?.state || ""}{" "}
                        {loadDetails.pickupLocation?.zipCode || ""}
                      </div>
                    </div>

                    {loadDetails.pickupInstructions && (
                      <div>
                        <div className="text-sm font-medium">Instructions</div>
                        <div className="text-sm">
                          {loadDetails.pickupInstructions}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-red-500" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm font-medium flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                        Date & Time
                      </div>
                      <div className="text-sm">
                        {formatDate(loadDetails.deliveryWindowStart)} -{" "}
                        {formatTime(loadDetails.deliveryWindowStart)}
                        <br />
                        to {formatTime(loadDetails.deliveryWindowEnd)}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium">Location</div>
                      <div className="text-sm">
                        {loadDetails.deliveryLocation?.name ||
                          "Location name not available"}
                        <br />
                        {loadDetails.deliveryLocation?.address ||
                          "Address not available"}
                        <br />
                        {loadDetails.deliveryLocation?.city || ""},{" "}
                        {loadDetails.deliveryLocation?.state || ""}{" "}
                        {loadDetails.deliveryLocation?.zipCode || ""}
                      </div>
                    </div>

                    {loadDetails.deliveryInstructions && (
                      <div>
                        <div className="text-sm font-medium">Instructions</div>
                        <div className="text-sm">
                          {loadDetails.deliveryInstructions}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cargo Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Package className="h-4 w-4 mr-2 text-gray-500" />
                    Cargo Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">Commodity</div>
                      <div className="text-sm">{loadDetails.commodity}</div>
                    </div>

                    <div>
                      <div className="text-sm font-medium">Weight</div>
                      <div className="text-sm">
                        {loadDetails.weight.toLocaleString()} lbs
                      </div>
                    </div>

                    {loadDetails.dimensions && (
                      <div>
                        <div className="text-sm font-medium">Dimensions</div>
                        <div className="text-sm">
                          {loadDetails.dimensions.length}" ×{" "}
                          {loadDetails.dimensions.width}" ×{" "}
                          {loadDetails.dimensions.height}"
                        </div>
                      </div>
                    )}

                    {loadDetails.hazmat && (
                      <div>
                        <div className="text-sm font-medium flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1 text-yellow-500" />
                          Hazardous Material
                        </div>
                        <div className="text-sm">
                          {loadDetails.hazmatDetails || "Yes"}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Equipment & Rate Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Truck className="h-4 w-4 mr-2 text-gray-500" />
                    Equipment & Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">Equipment Type</div>
                      <div className="text-sm">{loadDetails.equipmentType}</div>
                    </div>

                    {loadDetails.equipmentRequirements &&
                      loadDetails.equipmentRequirements.length > 0 && (
                        <div>
                          <div className="text-sm font-medium">
                            Requirements
                          </div>
                          <div className="text-sm">
                            {loadDetails.equipmentRequirements.join(", ")}
                          </div>
                        </div>
                      )}

                    {loadDetails.rate && (
                      <div>
                        <div className="text-sm font-medium">Rate</div>
                        <div className="text-sm">
                          ${(loadDetails.rate / 100).toFixed(2)}
                          {loadDetails.rateType === "per_mile" && " per mile"}
                          {loadDetails.rateType === "hourly" && " per hour"}
                        </div>
                      </div>
                    )}

                    {loadDetails.estimatedDistance && (
                      <div>
                        <div className="text-sm font-medium">Distance</div>
                        <div className="text-sm">
                          {loadDetails.estimatedDistance} miles
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assignment Information */}
            {(loadDetails.carrierId || loadDetails.driverId) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    Assignment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {loadDetails.carrier && (
                      <div>
                        <div className="text-sm font-medium flex items-center">
                          <Building className="h-3 w-3 mr-1 text-gray-500" />
                          Carrier
                        </div>
                        <div className="text-sm">
                          {loadDetails.carrier.name}
                        </div>
                      </div>
                    )}

                    {loadDetails.driver && (
                      <div>
                        <div className="text-sm font-medium flex items-center">
                          <User className="h-3 w-3 mr-1 text-gray-500" />
                          Driver
                        </div>
                        <div className="text-sm">{loadDetails.driver.name}</div>
                      </div>
                    )}

                    {loadDetails.assignedDate && (
                      <div>
                        <div className="text-sm font-medium flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                          Assigned Date
                        </div>
                        <div className="text-sm">
                          {formatDate(loadDetails.assignedDate)}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {loadDetails.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">{loadDetails.notes}</div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  View and manage documents related to this load
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadDetails.documents && loadDetails.documents.length > 0 ? (
                  <div className="space-y-4">
                    {loadDetails.documents.map((doc: any) => (
                      <div
                        key={doc._id}
                        className="flex items-center justify-between border-b pb-2"
                      >
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-blue-500" />
                          <div>
                            <div className="font-medium">{doc.name}</div>
                            <div className="text-xs text-gray-500">
                              Uploaded {formatDate(doc.uploadDate)}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No Documents
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      There are no documents attached to this load yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle>Tracking Information</CardTitle>
                <CardDescription>
                  Real-time location and status updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadDetails.lastLocationUpdate ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm font-medium">Last Updated</div>
                        <div className="text-sm">
                          {formatDate(loadDetails.lastLocationUpdate.timestamp)}{" "}
                          {formatTime(loadDetails.lastLocationUpdate.timestamp)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Coordinates</div>
                        <div className="text-sm">
                          {loadDetails.lastLocationUpdate.latitude.toFixed(6)},{" "}
                          {loadDetails.lastLocationUpdate.longitude.toFixed(6)}
                        </div>
                      </div>
                      {loadDetails.estimatedTimeOfArrival && (
                        <div>
                          <div className="text-sm font-medium">ETA</div>
                          <div className="text-sm">
                            {formatDate(loadDetails.estimatedTimeOfArrival)}{" "}
                            {formatTime(loadDetails.estimatedTimeOfArrival)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">
                        Map view would be displayed here
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No Tracking Data
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Location tracking will be available once the load is in
                      transit.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Load History</CardTitle>
                <CardDescription>
                  Timeline of events and status changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadDetails.events && loadDetails.events.length > 0 ? (
                  <div className="space-y-4">
                    {loadDetails.events.map((event: any) => (
                      <div
                        key={event._id}
                        className="flex items-start border-b pb-4"
                      >
                        <div className="mr-4 mt-1">
                          <div className="h-2 w-2 rounded-full bg-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div className="font-medium">
                              {event.eventType
                                .replace("_", " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(event.timestamp)}{" "}
                              {formatTime(event.timestamp)}
                            </div>
                          </div>
                          <div className="text-sm mt-1">{event.notes}</div>
                          {event.previousValue &&
                            event.newValue &&
                            event.eventType === "status_change" && (
                              <div className="text-xs text-gray-500 mt-1">
                                Changed from{" "}
                                <span className="font-medium">
                                  {formatStatus(event.previousValue)}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium">
                                  {formatStatus(event.newValue)}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No History
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      No events have been recorded for this load yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
