import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Calendar,
  Clock,
  Package,
  Info,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export interface LoadFormData {
  pickupLocation: string;
  dropoffLocation: string;
  commodity: string;
  weight: string;
  dimensions: string;
  specialInstructions: string;
  deliveryDate: string;
  deliveryTime: string;
  budget: string;
  preferredCarrier?: string;
}

interface LoadCreationFormProps {
  isAdmin?: boolean;
  onSubmit: (formData: LoadFormData) => Promise<void>;
  initialData?: Partial<LoadFormData>;
}

export default function LoadCreationForm({
  isAdmin = false,
  onSubmit,
  initialData = {},
}: LoadCreationFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<LoadFormData>({
    pickupLocation: initialData.pickupLocation || "",
    dropoffLocation: initialData.dropoffLocation || "",
    commodity: initialData.commodity || "",
    weight: initialData.weight || "",
    dimensions: initialData.dimensions || "",
    specialInstructions: initialData.specialInstructions || "",
    deliveryDate: initialData.deliveryDate || "",
    deliveryTime: initialData.deliveryTime || "",
    budget: initialData.budget || "",
    preferredCarrier: initialData.preferredCarrier || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routeEstimate, setRouteEstimate] = useState<{
    distance: string;
    duration: string;
    rate?: string;
  } | null>(null);

  const [errors, setErrors] = useState<
    Partial<Record<keyof LoadFormData, string>>
  >({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is edited
    if (errors[name as keyof LoadFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Simulate route estimation when both locations are filled
    if (
      (name === "pickupLocation" || name === "dropoffLocation") &&
      formData.pickupLocation &&
      formData.dropoffLocation
    ) {
      // This would be replaced with actual API call to HERE or Mapbox
      setTimeout(() => {
        setRouteEstimate({
          distance: "450 miles",
          duration: "7 hours 30 minutes",
          rate: !isAdmin ? "$2.35/mile" : undefined,
        });
      }, 500);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is edited
    if (errors[name as keyof LoadFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LoadFormData, string>> = {};

    if (!formData.pickupLocation)
      newErrors.pickupLocation = "Pickup location is required";
    if (!formData.dropoffLocation)
      newErrors.dropoffLocation = "Dropoff location is required";
    if (!formData.commodity) newErrors.commodity = "Commodity type is required";
    if (!formData.weight) newErrors.weight = "Weight is required";
    if (!formData.deliveryDate)
      newErrors.deliveryDate = "Delivery date is required";
    if (!formData.deliveryTime)
      newErrors.deliveryTime = "Delivery time is required";

    // Validate weight is a number
    if (formData.weight && isNaN(Number(formData.weight))) {
      newErrors.weight = "Weight must be a number";
    }

    // Validate budget is a number if provided
    if (formData.budget && isNaN(Number(formData.budget))) {
      newErrors.budget = "Budget must be a number";
    }

    // Validate delivery date is in the future
    if (formData.deliveryDate) {
      const deliveryDateTime = new Date(
        `${formData.deliveryDate}T${formData.deliveryTime || "00:00"}:00`,
      );
      if (deliveryDateTime <= new Date()) {
        newErrors.deliveryDate = "Delivery date must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);

      toast({
        title: "Success",
        description: "Load created successfully",
      });

      // Navigate to loads page after successful creation
      navigate(isAdmin ? "/admin/loads" : "/shipper/loads");
    } catch (error) {
      console.error("Error creating load", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create load",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Create New {isAdmin ? "Load" : "Shipment"}
          </h1>
          <p className="text-gray-500 mt-1">
            Enter {isAdmin ? "load" : "shipment"} details to create a new{" "}
            {isAdmin ? "load" : "shipment"} in the system
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{isAdmin ? "Load" : "Shipment"} Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="pickupLocation"
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4 text-gray-500" />
                        Pickup Location
                      </Label>
                      <Input
                        id="pickupLocation"
                        name="pickupLocation"
                        placeholder="Enter full address"
                        value={formData.pickupLocation}
                        onChange={handleInputChange}
                        className={
                          errors.pickupLocation ? "border-red-500" : ""
                        }
                        required
                      />
                      {errors.pickupLocation && (
                        <p className="text-sm text-red-500">
                          {errors.pickupLocation}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="dropoffLocation"
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4 text-gray-500" />
                        Dropoff Location
                      </Label>
                      <Input
                        id="dropoffLocation"
                        name="dropoffLocation"
                        placeholder="Enter full address"
                        value={formData.dropoffLocation}
                        onChange={handleInputChange}
                        className={
                          errors.dropoffLocation ? "border-red-500" : ""
                        }
                        required
                      />
                      {errors.dropoffLocation && (
                        <p className="text-sm text-red-500">
                          {errors.dropoffLocation}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="commodity"
                        className="flex items-center gap-2"
                      >
                        <Package className="h-4 w-4 text-gray-500" />
                        Commodity Type
                      </Label>
                      <Select
                        value={formData.commodity}
                        onValueChange={(value) =>
                          handleSelectChange("commodity", value)
                        }
                      >
                        <SelectTrigger
                          className={errors.commodity ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Select commodity type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">
                            General Freight
                          </SelectItem>
                          <SelectItem value="electronics">
                            Electronics
                          </SelectItem>
                          <SelectItem value="furniture">Furniture</SelectItem>
                          <SelectItem value="automotive">
                            Automotive Parts
                          </SelectItem>
                          <SelectItem value="food">Food & Beverages</SelectItem>
                          <SelectItem value="hazardous">
                            Hazardous Materials
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.commodity && (
                        <p className="text-sm text-red-500">
                          {errors.commodity}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="weight"
                        className="flex items-center gap-2"
                      >
                        <Truck className="h-4 w-4 text-gray-500" />
                        Weight (lbs)
                      </Label>
                      <Input
                        id="weight"
                        name="weight"
                        type="number"
                        placeholder="Enter weight in pounds"
                        value={formData.weight}
                        onChange={handleInputChange}
                        className={errors.weight ? "border-red-500" : ""}
                        required
                      />
                      {errors.weight && (
                        <p className="text-sm text-red-500">{errors.weight}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="dimensions"
                        className="flex items-center gap-2"
                      >
                        <Package className="h-4 w-4 text-gray-500" />
                        Dimensions (L×W×H in inches)
                      </Label>
                      <Input
                        id="dimensions"
                        name="dimensions"
                        placeholder="e.g., 48×40×48"
                        value={formData.dimensions}
                        onChange={handleInputChange}
                        className={errors.dimensions ? "border-red-500" : ""}
                      />
                      {errors.dimensions && (
                        <p className="text-sm text-red-500">
                          {errors.dimensions}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="budget"
                        className="flex items-center gap-2"
                      >
                        <Package className="h-4 w-4 text-gray-500" />
                        Budget (USD)
                      </Label>
                      <Input
                        id="budget"
                        name="budget"
                        type="number"
                        placeholder="Optional budget amount"
                        value={formData.budget}
                        onChange={handleInputChange}
                        className={errors.budget ? "border-red-500" : ""}
                      />
                      {errors.budget && (
                        <p className="text-sm text-red-500">{errors.budget}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="deliveryDate"
                        className="flex items-center gap-2"
                      >
                        <Calendar className="h-4 w-4 text-gray-500" />
                        Delivery Date
                      </Label>
                      <Input
                        id="deliveryDate"
                        name="deliveryDate"
                        type="date"
                        value={formData.deliveryDate}
                        onChange={handleInputChange}
                        className={errors.deliveryDate ? "border-red-500" : ""}
                        required
                      />
                      {errors.deliveryDate && (
                        <p className="text-sm text-red-500">
                          {errors.deliveryDate}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="deliveryTime"
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4 text-gray-500" />
                        Delivery Time
                      </Label>
                      <Input
                        id="deliveryTime"
                        name="deliveryTime"
                        type="time"
                        value={formData.deliveryTime}
                        onChange={handleInputChange}
                        className={errors.deliveryTime ? "border-red-500" : ""}
                        required
                      />
                      {errors.deliveryTime && (
                        <p className="text-sm text-red-500">
                          {errors.deliveryTime}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="specialInstructions"
                      className="flex items-center gap-2"
                    >
                      <Info className="h-4 w-4 text-gray-500" />
                      Special Instructions
                    </Label>
                    <Textarea
                      id="specialInstructions"
                      name="specialInstructions"
                      placeholder="Enter any special handling instructions or notes"
                      value={formData.specialInstructions}
                      onChange={handleInputChange}
                      className={
                        errors.specialInstructions ? "border-red-500" : ""
                      }
                      rows={4}
                    />
                    {errors.specialInstructions && (
                      <p className="text-sm text-red-500">
                        {errors.specialInstructions}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      navigate(isAdmin ? "/admin/loads" : "/shipper/loads")
                    }
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Creating..."
                      : `Create ${isAdmin ? "Load" : "Shipment"}`}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Route Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {routeEstimate ? (
                <div className="space-y-4">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pickup</p>
                        <p className="font-medium">{formData.pickupLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        <div className="w-2 h-2 rounded-full bg-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Dropoff</p>
                        <p className="font-medium">
                          {formData.dropoffLocation}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">
                        Estimated Distance
                      </p>
                      <p className="font-medium">{routeEstimate.distance}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">
                        Estimated Duration
                      </p>
                      <p className="font-medium">{routeEstimate.duration}</p>
                    </div>
                    {routeEstimate.rate && (
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Market Rate</p>
                        <p className="font-medium">{routeEstimate.rate}</p>
                      </div>
                    )}
                  </div>

                  <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">
                      Map preview would appear here
                    </p>
                  </div>

                  {!isAdmin && (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">
                          Delivery Time Notice
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Based on the estimated transit time, this shipment may
                          require expedited service to meet the delivery
                          deadline.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">
                    Enter pickup and dropoff locations to see route preview
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
