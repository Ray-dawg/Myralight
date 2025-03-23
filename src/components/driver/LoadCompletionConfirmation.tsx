import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Truck, MapPin, FileCheck } from "lucide-react";

interface LoadCompletionConfirmationProps {
  loadId: string;
  deliveryLocation?: {
    name: string;
    address: string;
    city: string;
    state: string;
  };
  bolUploaded?: boolean;
  onConfirm: () => void;
  onUploadBol?: () => void;
}

const LoadCompletionConfirmation: React.FC<LoadCompletionConfirmationProps> = ({
  loadId,
  deliveryLocation = {
    name: "Delivery Location",
    address: "456 Oak St",
    city: "Milwaukee",
    state: "WI",
  },
  bolUploaded = false,
  onConfirm,
  onUploadBol,
}) => {
  const formatAddress = (location: any) => {
    if (!location) return "";
    return `${location.address}, ${location.city}, ${location.state}`;
  };

  return (
    <Card className="w-full bg-white shadow-md dark:bg-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center">
          <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
          Delivery Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4">
            <Truck className="h-12 w-12 text-green-500" />
          </div>
          <h3 className="text-xl font-medium">Load #{loadId} Delivered!</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            You've successfully completed this delivery.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-start">
            <MapPin className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Delivery Location</p>
              <p className="text-gray-600 dark:text-gray-400">
                {deliveryLocation.name}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {formatAddress(deliveryLocation)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <FileCheck className="h-5 w-5 mr-3 text-blue-500" />
          <div>
            <p className="font-medium">
              {bolUploaded
                ? "Bill of Lading Uploaded"
                : "Bill of Lading Required"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {bolUploaded
                ? "Thank you for uploading the Bill of Lading document."
                : "Please upload the Bill of Lading to complete this delivery."}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {!bolUploaded && onUploadBol && (
          <Button variant="outline" onClick={onUploadBol}>
            Upload BOL
          </Button>
        )}
        <Button onClick={onConfirm} className="ml-auto" disabled={!bolUploaded}>
          Complete Delivery
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LoadCompletionConfirmation;
