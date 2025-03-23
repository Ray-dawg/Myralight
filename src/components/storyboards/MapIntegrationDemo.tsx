import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MapComponent from "@/components/shared/MapComponent";
import LocationSearch from "@/components/shared/LocationSearch";
import RouteMap from "@/components/shared/RouteMap";
import LiveTrackingMap from "@/components/shared/LiveTrackingMap";
import GeofenceMap from "@/components/shared/GeofenceMap";

export default function MapIntegrationDemo() {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [origin, setOrigin] = useState<any>({
    latitude: 41.8781,
    longitude: -87.6298,
  });
  const [destination, setDestination] = useState<any>({
    latitude: 43.0389,
    longitude: -87.9065,
  });

  // Sample data for live tracking demo
  const driverLocation = {
    latitude: 42.3314,
    longitude: -87.8097,
    heading: 45,
    speed: 65,
    timestamp: new Date().toISOString(),
    accuracy: 10,
  };

  const pickupLocation = {
    coordinates: {
      latitude: 41