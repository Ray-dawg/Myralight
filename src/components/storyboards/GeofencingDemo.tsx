import React from "react";
import GeofenceMap from "../shared/GeofenceMap";
import GeofenceDetector from "../driver/GeofenceDetector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GeofencingDemo: React.FC = () => {
  // Sample delivery location
  const deliveryLocation = {
    latitude: 37.7749,
    longitude: -122.4194, // San Francisco coordinates
  };

  return (
    <div className="container mx-auto p-4 bg-white">
      <h1 className="text-2xl font-bold mb-6">Geofencing Functionality Demo</h1>

      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map">Create Geofence</TabsTrigger>
          <TabsTrigger value="detector">Geofence Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Geofence Creation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600">
                Click on the map to set a geofence location, adjust the radius,
                and create a geofence.
              </p>
              <GeofenceMap
                height="500px"
                initialLocation={deliveryLocation}
                initialRadius={300}
                onGeofenceCreate={(geofence) => {
                  console.log("Geofence created:", geofence);
                  alert(
                    `Geofence created at ${geofence.latitude.toFixed(4)}, ${geofence.longitude.toFixed(4)} with radius ${geofence.radius}m`,
                  );
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detector" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Geofence Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600">
                This component detects when a driver enters a geofence around
                the delivery location. For demo purposes, you can manually
                confirm arrival or wait for location detection.
              </p>
              <GeofenceDetector
                loadId="demo-load-123"
                dropoffLat={deliveryLocation.latitude}
                dropoffLng={deliveryLocation.longitude}
                geofenceRadius={300}
                requiredTimeInGeofence={5000} // 5 seconds for demo
                onArrival={() => {
                  console.log("Driver arrived at destination");
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeofencingDemo;
