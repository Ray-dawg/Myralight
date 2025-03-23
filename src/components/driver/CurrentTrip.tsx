import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Maximize2, X } from "lucide-react";
import { Button } from "../ui/button";

export default function CurrentTrip() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Current Trip</CardTitle>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
            <div>
              <p className="text-sm text-gray-500">Current Location</p>
              <p className="font-medium">Chicago, IL</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
            <div>
              <p className="text-sm text-gray-500">Destination</p>
              <p className="font-medium">Milwaukee, WI</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
