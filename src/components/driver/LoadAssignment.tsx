import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, Truck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "convex/react";
import { api } from "@/lib/convex/_generated/api";

interface LoadAssignmentProps {
  loadId: string;
  referenceNumber: string;
  pickupLocation: {
    address: string;
    windowStart: number;
    windowEnd: number;
  };
  deliveryLocation: {
    address: string;
    windowStart: number;
    windowEnd: number;
  };
  rate?: number;
  estimatedDistance?: number;
  equipmentType: string;
}

export default function LoadAssignment({
  loadId,
  referenceNumber,
  pickupLocation,
  deliveryLocation,
  rate,
  estimatedDistance,
  equipmentType,
}: LoadAssignmentProps) {
  const { toast } = useToast();
  const acceptLoadMutation = useMutation(api.loads.acceptLoad);
  const rejectLoadMutation = useMutation(api.loads.rejectLoad);

  const handleAccept = async () => {
    try {
      await acceptLoadMutation({ loadId });
      toast({
        title: "Load Accepted",
        description: `You have successfully accepted load ${referenceNumber}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept load. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    try {
      await rejectLoadMutation({ loadId });
      toast({
        title: "Load Rejected",
        description: `You have rejected load ${referenceNumber}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject load. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Load #{referenceNumber}</span>
          <Badge variant="outline">{equipmentType}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {estimatedDistance && rate && (
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-gray-500" />
              <span>{estimatedDistance} miles</span>
              <DollarSign className="h-4 w-4 text-gray-500 ml-2" />
              <span>${(rate / 100).toFixed(2)}</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-blue-500 mt-1" />
              <div>
                <div className="font-medium">{pickupLocation.address}</div>
                <div className="text-sm text-gray-500">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {new Date(pickupLocation.windowStart).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-red-500 mt-1" />
              <div>
                <div className="font-medium">{deliveryLocation.address}</div>
                <div className="text-sm text-gray-500">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {new Date(deliveryLocation.windowStart).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="w-full" onClick={handleReject}>
              Reject
            </Button>
            <Button className="w-full" onClick={handleAccept}>
              Accept
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
