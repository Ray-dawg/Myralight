import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, MapPin, Bell } from "lucide-react";
import LoadAssignment from "./LoadAssignment";
import LocationUpdate from "./LocationUpdate";
import Notifications from "./Notifications";
import RequestLoadButton from "./RequestLoadButton";

export default function DriverDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Driver Dashboard</h1>
        <RequestLoadButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LocationUpdate />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Current Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadAssignment
              loadId="placeholder"
              referenceNumber="12345"
              pickupLocation={{
                address: "123 Pickup St, City, ST",
                windowStart: Date.now(),
                windowEnd: Date.now() + 3600000,
              }}
              deliveryLocation={{
                address: "456 Delivery Ave, City, ST",
                windowStart: Date.now() + 7200000,
                windowEnd: Date.now() + 10800000,
              }}
              equipmentType="Dry Van"
              rate={15000}
              estimatedDistance={500}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Notifications />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
