import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../lib/convex/_generated/api";
import { Id } from "../../lib/convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Clock,
  FileText,
  History,
  MapPin,
  Package,
  Truck,
  User,
} from "lucide-react";
import LoadHistoryTimeline from "./LoadHistoryTimeline";
import { format } from "date-fns";

const LoadDetailsWithHistory = ({ loadId }: { loadId: Id<"loads"> }) => {
  const load = useQuery(api.loads.getLoad, { id: loadId });
  const pickupLocation = load
    ? useQuery(api.locations.getLocation, { id: load.pickupLocationId })
    : null;
  const deliveryLocation = load
    ? useQuery(api.locations.getLocation, { id: load.deliveryLocationId })
    : null;
  const shipper = load
    ? useQuery(api.users.getUser, { userId: load.shipperId })
    : null;
  const carrier = load?.carrierId
    ? useQuery(api.users.getUser, { userId: load.carrierId })
    : null;
  const driver = load?.driverId
    ? useQuery(api.users.getUser, { userId: load.driverId })
    : null;

  if (!load) {
    return <div className="p-4">Loading load details...</div>;
  }

  return (
    <div className="load-details-with-history">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">
            <Package className="mr-2 h-4 w-4" />
            Load Details
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            History & Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Load Information
                </CardTitle>
                <CardDescription>Basic load details</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium">Reference Number:</dt>
                    <dd>{load.referenceNumber}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Status:</dt>
                    <dd>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusColor(load.status)}`}
                      >
                        {formatStatus(load.status)}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Load Type:</dt>
                    <dd>{formatLoadType(load.loadType)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Equipment Type:</dt>
                    <dd>{load.equipmentType}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Commodity:</dt>
                    <dd>{load.commodity}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Weight:</dt>
                    <dd>{load.weight.toLocaleString()} lbs</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Hazmat:</dt>
                    <dd>{load.hazmat ? "Yes" : "No"}</dd>
                  </div>
                  {load.rate && (
                    <div className="flex justify-between">
                      <dt className="font-medium">Rate:</dt>
                      <dd>${load.rate.toLocaleString()}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Parties
                </CardTitle>
                <CardDescription>Involved parties</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="font-medium">Shipper:</dt>
                    <dd className="ml-4">{shipper?.name || "Loading..."}</dd>
                  </div>

                  {carrier && (
                    <div>
                      <dt className="font-medium">Carrier:</dt>
                      <dd className="ml-4">{carrier.name}</dd>
                    </div>
                  )}

                  {driver && (
                    <div>
                      <dt className="font-medium">Driver:</dt>
                      <dd className="ml-4">{driver.name}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Pickup
                </CardTitle>
                <CardDescription>Pickup details</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="font-medium">Location:</dt>
                    <dd className="ml-4">
                      {pickupLocation?.name || "Loading..."}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Address:</dt>
                    <dd className="ml-4">
                      {pickupLocation ? (
                        <>
                          {pickupLocation.address}
                          <br />
                          {pickupLocation.city}, {pickupLocation.state}{" "}
                          {pickupLocation.zipCode}
                        </>
                      ) : (
                        "Loading..."
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Window:</dt>
                    <dd className="ml-4">
                      {format(new Date(load.pickupWindowStart), "PPp")} - <br />
                      {format(new Date(load.pickupWindowEnd), "PPp")}
                    </dd>
                  </div>
                  {load.pickupInstructions && (
                    <div>
                      <dt className="font-medium">Instructions:</dt>
                      <dd className="ml-4">{load.pickupInstructions}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Delivery
                </CardTitle>
                <CardDescription>Delivery details</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="font-medium">Location:</dt>
                    <dd className="ml-4">
                      {deliveryLocation?.name || "Loading..."}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Address:</dt>
                    <dd className="ml-4">
                      {deliveryLocation ? (
                        <>
                          {deliveryLocation.address}
                          <br />
                          {deliveryLocation.city}, {deliveryLocation.state}{" "}
                          {deliveryLocation.zipCode}
                        </>
                      ) : (
                        "Loading..."
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Window:</dt>
                    <dd className="ml-4">
                      {format(new Date(load.deliveryWindowStart), "PPp")} -{" "}
                      <br />
                      {format(new Date(load.deliveryWindowEnd), "PPp")}
                    </dd>
                  </div>
                  {load.deliveryInstructions && (
                    <div>
                      <dt className="font-medium">Instructions:</dt>
                      <dd className="ml-4">{load.deliveryInstructions}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="mr-2 h-5 w-5" />
                Load History & Audit Trail
              </CardTitle>
              <CardDescription>
                Complete history of all actions and changes for this load
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoadHistoryTimeline loadId={loadId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-800";
    case "posted":
      return "bg-blue-100 text-blue-800";
    case "assigned":
      return "bg-purple-100 text-purple-800";
    case "in_transit":
      return "bg-yellow-100 text-yellow-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatStatus = (status: string) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatLoadType = (loadType: string) => {
  switch (loadType) {
    case "ftl":
      return "Full Truckload (FTL)";
    case "ltl":
      return "Less Than Truckload (LTL)";
    case "partial":
      return "Partial Truckload";
    case "expedited":
      return "Expedited";
    default:
      return loadType;
  }
};

export default LoadDetailsWithHistory;
