import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { eventEmitter } from "@/lib/events";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface LoadChatCreationProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LoadChatCreation({
  onSuccess,
  onCancel,
}: LoadChatCreationProps) {
  const [loadId, setLoadId] = useState("");
  const [shipperId, setShipperId] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Emit the load:assigned event
      const success = await eventEmitter.emit("load:assigned", {
        loadId,
        shipperId,
        carrierId,
        driverId,
      });

      if (success) {
        toast({
          title: "Chat created",
          description: "The chat has been created successfully.",
        });
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Error",
          description: "Failed to create chat. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white">
      <CardHeader>
        <CardTitle>Create Load Chat</CardTitle>
        <CardDescription>
          Create a new chat for a load and add participants
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loadId">Load ID</Label>
            <Input
              id="loadId"
              placeholder="Enter load ID"
              value={loadId}
              onChange={(e) => setLoadId(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipperId">Shipper ID</Label>
            <Input
              id="shipperId"
              placeholder="Enter shipper ID"
              value={shipperId}
              onChange={(e) => setShipperId(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="carrierId">Carrier ID</Label>
            <Input
              id="carrierId"
              placeholder="Enter carrier ID"
              value={carrierId}
              onChange={(e) => setCarrierId(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="driverId">Driver ID</Label>
            <Input
              id="driverId"
              placeholder="Enter driver ID"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Chat"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default LoadChatCreation;
