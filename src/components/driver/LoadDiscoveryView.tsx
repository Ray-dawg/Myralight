import React, { useState, useEffect } from "react";
import {
  LoadMatch,
  LoadMatchingService,
} from "@/api/services/load-matching.service";
import LoadAssignment from "./LoadAssignment";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function LoadDiscoveryView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loads, setLoads] = useState<LoadMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const loadMatchingService = new LoadMatchingService();

  const findNearbyLoads = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Use mock location for demo
      const lat = 41.8781;
      const lng = -87.6298;

      const nearbyLoads = await loadMatchingService.findNearbyLoads(
        user.id,
        lat,
        lng,
      );

      setLoads(nearbyLoads);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find nearby loads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    findNearbyLoads();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Available Loads</h2>
        <Button onClick={findNearbyLoads} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            "Refresh Loads"
          )}
        </Button>
      </div>

      {loads.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No loads available in your area
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loads.map((load) => (
            <LoadAssignment
              key={load.id}
              loadId={load.id}
              referenceNumber={load.referenceNumber}
              pickupLocation={load.pickupLocation}
              deliveryLocation={load.deliveryLocation}
              rate={load.rate}
              estimatedDistance={load.estimatedDistance}
              equipmentType={load.equipmentType}
            />
          ))}
        </div>
      )}
    </div>
  );
}
