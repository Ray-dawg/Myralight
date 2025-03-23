import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Maximize2, MapPin, X } from "lucide-react";
import { Button } from "../ui/button";

export default function NextStop() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Next Stop</CardTitle>
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
        <div className="flex items-center space-x-3">
          <MapPin className="w-5 h-5 text-gray-500" />
          <div>
            <p className="font-medium">Love's Travel Stop</p>
            <p className="text-sm text-gray-500">45 miles • 45 min</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
