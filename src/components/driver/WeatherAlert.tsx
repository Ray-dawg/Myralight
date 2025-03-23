import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Maximize2, X } from "lucide-react";
import { Button } from "../ui/button";

export default function WeatherAlert() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Weather Alert</CardTitle>
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
        <div className="flex items-center space-x-3 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-medium">Weather Alert</p>
            <p className="text-sm">Heavy rain expected on I-94</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
