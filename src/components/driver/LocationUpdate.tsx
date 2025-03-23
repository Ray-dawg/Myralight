import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "convex/react";
import { api } from "@/lib/convex/_generated/api";
import { MapPin, Crosshair } from "lucide-react";

export default function LocationUpdate() {
  const { toast } = useToast();
  const [coordinates, setCoordinates] = useState({
    latitude: "",
    longitude: "",
  });
  const [loading, setLoading] = useState(false);
  const updateVehicleLocation = useMutation(api.vehicles.updateVehicleLocation);

  const handleManualUpdate = async () => {
    if (!coordinates.latitude || !coordinates.longitude) {
      toast({
        title: "Error",
        description: "Please enter both latitude and longitude.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await updateVehicleLocation({
        latitude: parseFloat(coordinates.latitude),
        longitude: parseFloat(coordinates.longitude),
      });

      toast({
        title: "Location Updated",
        description: "Your location has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoUpdate = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setCoordinates({
            latitude: lat.toString(),
            longitude: lng.toString(),
          });

          await updateVehicleLocation({
            latitude: lat,
            longitude: lng,
          });

          toast({
            title: "Location Updated",
            description: "Your location has been updated automatically.",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to update location. Please try again.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        toast({
          title: "Error",
          description: "Failed to get your location. Please try manually.",
          variant: "destructive",
        });
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Update Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="Enter latitude"
                value={coordinates.latitude}
                onChange={(e) =>
                  setCoordinates({ ...coordinates, latitude: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="Enter longitude"
                value={coordinates.longitude}
                onChange={(e) =>
                  setCoordinates({ ...coordinates, longitude: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleManualUpdate}
              disabled={loading}
            >
              Update Manually
            </Button>
            <Button
              className="w-full"
              onClick={handleAutoUpdate}
              disabled={loading}
            >
              <Crosshair className="h-4 w-4 mr-2" />
              Get Current Location
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
