import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadCreationForm, { LoadFormData } from "../LoadCreationForm";
import { useMutation } from "convex/react";
import { api } from "../../../lib/convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";
import { Id } from "../../../lib/convex/_generated/dataModel";

export default function LoadCreation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createLoad = useMutation(api.loads.createLoad);
  const createLocation = useMutation(api.locations.createLocation);

  const handleSubmit = async (formData: LoadFormData) => {
    try {
      // Validate required fields with more specific error messages
      const validationErrors = [];

      if (!formData.pickupLocation) {
        validationErrors.push("Pickup location is required");
      }

      if (!formData.dropoffLocation) {
        validationErrors.push("Dropoff location is required");
      }

      if (!formData.commodity) {
        validationErrors.push("Commodity type is required");
      }

      if (!formData.weight) {
        validationErrors.push("Weight is required");
      } else if (isNaN(parseFloat(formData.weight))) {
        validationErrors.push("Weight must be a valid number");
      } else if (parseFloat(formData.weight) <= 0) {
        validationErrors.push("Weight must be greater than zero");
      }

      if (!formData.deliveryDate) {
        validationErrors.push("Delivery date is required");
      }

      if (!formData.deliveryTime) {
        validationErrors.push("Delivery time is required");
      }

      // If we have validation errors, throw them all at once
      if (validationErrors.length > 0) {
        throw new Error(
          `Please fix the following errors:\n- ${validationErrors.join("\n- ")}`,
        );
      }

      // Calculate pickup window (24 hours before delivery)
      const deliveryDateTime = new Date(
        `${formData.deliveryDate}T${formData.deliveryTime}:00`,
      );
      const deliveryTimestamp = deliveryDateTime.getTime();

      // Validate delivery date is in the future with more specific message
      if (deliveryTimestamp <= Date.now()) {
        const currentDate = new Date();
        throw new Error(
          `Delivery date and time (${formData.deliveryDate} ${formData.deliveryTime}) must be in the future. Current date and time is ${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}.`,
        );
      }

      // First, create the pickup location
      const pickupLocation = await createPickupLocation(formData);

      // Then create the delivery location
      const deliveryLocation = await createDeliveryLocation(formData);

      // Parse dimensions if provided
      let dimensionsObj;
      if (formData.dimensions) {
        const dimParts = formData.dimensions.split(/[×x]/); // Handle both × and x as separators
        if (dimParts.length === 3) {
          dimensionsObj = {
            length: parseInt(dimParts[0].trim()) || 48,
            width: parseInt(dimParts[1].trim()) || 40,
            height: parseInt(dimParts[2].trim()) || 48,
          };
        }
      }

      // Now create the load with the location IDs
      let result;
      try {
        result = await createLoad({
          // Basic load information
          loadType: "ftl", // Default to full truckload
          equipmentType:
            formData.commodity === "hazardous" ? "specialized" : "dry_van",

          // Pickup information
          pickupLocationId: pickupLocation.locationId as Id<"locations">,
          pickupWindowStart: deliveryTimestamp - 86400000, // 24 hours before delivery
          pickupWindowEnd: deliveryTimestamp - 43200000, // 12 hours before delivery
          pickupInstructions: formData.specialInstructions,

          // Delivery information
          deliveryLocationId: deliveryLocation.locationId as Id<"locations">,
          deliveryWindowStart: deliveryTimestamp - 3600000, // 1 hour before delivery time
          deliveryWindowEnd: deliveryTimestamp + 3600000, // 1 hour after delivery time
          deliveryInstructions: formData.specialInstructions,

          // Cargo information
          commodity: formData.commodity,
          weight: parseFloat(formData.weight),
          dimensions: dimensionsObj,
          hazmat: formData.commodity === "hazardous",

          // Financial information
          rate: formData.budget ? parseFloat(formData.budget) * 100 : undefined, // Convert to cents

          // Notes
          notes: formData.specialInstructions,

          // Required by schema but not shown in UI
          trackingEnabled: true,
        });
      } catch (error) {
        console.error("Error in createLoad mutation:", error);
        if (error instanceof Error) {
          if (error.message.includes("Not authenticated")) {
            throw new Error(
              "Your session has expired. Please log in again to create a load.",
            );
          } else if (error.message.includes("User not found")) {
            throw new Error(
              "Your user account could not be found. Please contact support.",
            );
          } else {
            throw new Error(`Database error: ${error.message}`);
          }
        } else {
          throw new Error(
            "Failed to save load to database. Please try again later.",
          );
        }
      }

      toast({
        title: "Success",
        description: `Load ${result.referenceNumber} created successfully`,
      });

      // Navigate to loads page after successful creation
      navigate("/admin/loads");
      return result;
    } catch (error) {
      console.error("Error creating load", error);

      // Categorize errors for more specific feedback
      let errorTitle = "Error";
      let errorDescription = "";

      if (error instanceof Error) {
        // Check for specific error types
        if (
          error.message.includes("Pickup location") ||
          error.message.includes("Dropoff location") ||
          error.message.includes("Commodity") ||
          error.message.includes("Weight") ||
          error.message.includes("Delivery date") ||
          error.message.includes("Please fix")
        ) {
          errorTitle = "Validation Error";
          errorDescription = error.message;
        } else if (error.message.includes("Failed to create pickup location")) {
          errorTitle = "Pickup Location Error";
          errorDescription =
            "There was a problem creating the pickup location. Please check the address format and try again.";
        } else if (
          error.message.includes("Failed to create delivery location")
        ) {
          errorTitle = "Delivery Location Error";
          errorDescription =
            "There was a problem creating the delivery location. Please check the address format and try again.";
        } else if (
          error.message.includes("Not authenticated") ||
          error.message.includes("User not found")
        ) {
          errorTitle = "Authentication Error";
          errorDescription =
            "You need to be logged in to create a load. Please log in and try again.";
        } else {
          errorTitle = "System Error";
          errorDescription = `An unexpected error occurred: ${error.message}. Please try again or contact support.`;
        }
      } else {
        errorTitle = "Unknown Error";
        errorDescription =
          "An unknown error occurred while creating the load. Please try again or contact support.";
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });

      throw error;
    }
  };

  // Helper function to create pickup location
  const createPickupLocation = async (formData: LoadFormData) => {
    try {
      // Validate address format
      const addressParts = formData.pickupLocation.split(",");
      if (addressParts.length < 2) {
        throw new Error(
          "Pickup address should be in format 'City, State, ZIP' (e.g. 'Chicago, IL, 60601')",
        );
      }

      const city = addressParts[0].trim();
      const state = addressParts[1]?.trim() || "Unknown";
      const zipCode = addressParts[2]?.trim() || "00000";

      if (!city) {
        throw new Error("Pickup city cannot be empty");
      }

      if (state === "Unknown") {
        console.warn("Pickup state is missing or invalid");
      }

      const locationData = {
        name: `Pickup: ${formData.pickupLocation}`,
        address: formData.pickupLocation,
        city,
        state,
        zipCode,
        country: "USA",
        coordinates: {
          latitude: 0, // Would use geocoding in production
          longitude: 0, // Would use geocoding in production
        },
        locationType: "warehouse" as const,
        specialInstructions: formData.specialInstructions,
      };

      const result = await createLocation(locationData);
      return { locationId: result.locationId };
    } catch (error) {
      console.error("Error creating pickup location:", error);

      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        if (
          error.message.includes("Not authenticated") ||
          error.message.includes("User not found")
        ) {
          throw new Error(
            "Authentication error: Please log in again to create a pickup location",
          );
        } else if (
          error.message.includes("address") ||
          error.message.includes("city") ||
          error.message.includes("state")
        ) {
          throw new Error(`Address format error: ${error.message}`);
        } else {
          throw new Error(`Failed to create pickup location: ${error.message}`);
        }
      } else {
        throw new Error(`Failed to create pickup location: ${String(error)}`);
      }
    }
  };

  // Helper function to create delivery location
  const createDeliveryLocation = async (formData: LoadFormData) => {
    try {
      // Validate address format
      const addressParts = formData.dropoffLocation.split(",");
      if (addressParts.length < 2) {
        throw new Error(
          "Delivery address should be in format 'City, State, ZIP' (e.g. 'Chicago, IL, 60601')",
        );
      }

      const city = addressParts[0].trim();
      const state = addressParts[1]?.trim() || "Unknown";
      const zipCode = addressParts[2]?.trim() || "00000";

      if (!city) {
        throw new Error("Delivery city cannot be empty");
      }

      if (state === "Unknown") {
        console.warn("Delivery state is missing or invalid");
      }

      const locationData = {
        name: `Delivery: ${formData.dropoffLocation}`,
        address: formData.dropoffLocation,
        city,
        state,
        zipCode,
        country: "USA",
        coordinates: {
          latitude: 0, // Would use geocoding in production
          longitude: 0, // Would use geocoding in production
        },
        locationType: "customer_location" as const,
        specialInstructions: formData.specialInstructions,
      };

      const result = await createLocation(locationData);
      return { locationId: result.locationId };
    } catch (error) {
      console.error("Error creating delivery location:", error);

      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        if (
          error.message.includes("Not authenticated") ||
          error.message.includes("User not found")
        ) {
          throw new Error(
            "Authentication error: Please log in again to create a delivery location",
          );
        } else if (
          error.message.includes("address") ||
          error.message.includes("city") ||
          error.message.includes("state")
        ) {
          throw new Error(`Address format error: ${error.message}`);
        } else {
          throw new Error(
            `Failed to create delivery location: ${error.message}`,
          );
        }
      } else {
        throw new Error(`Failed to create delivery location: ${String(error)}`);
      }
    }
  };

  return <LoadCreationForm isAdmin={true} onSubmit={handleSubmit} />;
}
