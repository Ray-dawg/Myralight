import React from "react";

interface DocumentationContentProps {
  category: string;
}

export default function DocumentationContent({
  category,
}: DocumentationContentProps) {
  // This component provides the default documentation content for each category
  // when no documents are available in Supabase yet

  const getContent = () => {
    switch (category) {
      case "api":
        return (
          <div className="prose max-w-none">
            <h1>API Reference</h1>
            <p>
              This documentation provides comprehensive information about the
              Convex API endpoints used in the logistics platform.
            </p>

            <h2>Load Management API</h2>

            <h3>createLoad</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`// Create a new load
export const createLoad = mutation({
  args: {
    loadType: v.union(
      v.literal("ftl"),
      v.literal("ltl"),
      v.literal("partial"),
      v.literal("expedited"),
    ),
    equipmentType: v.string(),
    pickupLocationId: v.id("locations"),
    pickupWindowStart: v.number(),
    pickupWindowEnd: v.number(),
    pickupInstructions: v.optional(v.string()),
    deliveryLocationId: v.id("locations"),
    deliveryWindowStart: v.number(),
    deliveryWindowEnd: v.number(),
    deliveryInstructions: v.optional(v.string()),
    commodity: v.string(),
    weight: v.number(),
    dimensions: v.optional(
      v.object({
        length: v.number(),
        width: v.number(),
        height: v.number(),
      }),
    ),
    hazmat: v.boolean(),
    rate: v.optional(v.number()),
    notes: v.optional(v.string()),
    trackingEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Implementation details
  },
});`}
              </code>
            </pre>

            <h4>Parameters</h4>
            <ul>
              <li>
                <strong>loadType</strong>: Type of load (ftl, ltl, partial,
                expedited)
              </li>
              <li>
                <strong>equipmentType</strong>: Type of equipment needed
              </li>
              <li>
                <strong>pickupLocationId</strong>: ID of the pickup location
              </li>
              <li>
                <strong>pickupWindowStart</strong>: Start of pickup window
                (timestamp)
              </li>
              <li>
                <strong>pickupWindowEnd</strong>: End of pickup window
                (timestamp)
              </li>
              <li>
                <strong>deliveryLocationId</strong>: ID of the delivery location
              </li>
              <li>
                <strong>deliveryWindowStart</strong>: Start of delivery window
                (timestamp)
              </li>
              <li>
                <strong>deliveryWindowEnd</strong>: End of delivery window
                (timestamp)
              </li>
              <li>
                <strong>commodity</strong>: Type of goods being transported
              </li>
              <li>
                <strong>weight</strong>: Weight in pounds
              </li>
              <li>
                <strong>dimensions</strong>: Optional dimensions object (length,
                width, height)
              </li>
              <li>
                <strong>hazmat</strong>: Whether the load contains hazardous
                materials
              </li>
              <li>
                <strong>rate</strong>: Optional rate in cents
              </li>
              <li>
                <strong>notes</strong>: Optional notes
              </li>
              <li>
                <strong>trackingEnabled</strong>: Whether tracking is enabled
              </li>
            </ul>

            <h4>Returns</h4>
            <ul>
              <li>
                <strong>loadId</strong>: ID of the created load
              </li>
              <li>
                <strong>referenceNumber</strong>: Reference number for the load
              </li>
            </ul>

            <h3>getShipperLoads</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`// Get loads for a shipper
export const getShipperLoads = query({
  handler: async (ctx) => {
    // Implementation details
  },
});`}
              </code>
            </pre>

            <h4>Returns</h4>
            <p>Array of load objects with associated location data</p>

            <h2>Location Management API</h2>

            <h3>createLocation</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`// Create a new location
export const createLocation = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
    coordinates: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    locationType: v.union(
      v.literal("warehouse"),
      v.literal("distribution_center"),
      v.literal("port"),
      v.literal("terminal"),
      v.literal("customer_location"),
      v.literal("other"),
    ),
    specialInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Implementation details
  },
});`}
              </code>
            </pre>

            <h4>Parameters</h4>
            <ul>
              <li>
                <strong>name</strong>: Location name
              </li>
              <li>
                <strong>address</strong>: Street address
              </li>
              <li>
                <strong>city</strong>: City
              </li>
              <li>
                <strong>state</strong>: State/province
              </li>
              <li>
                <strong>zipCode</strong>: Postal/ZIP code
              </li>
              <li>
                <strong>country</strong>: Country
              </li>
              <li>
                <strong>coordinates</strong>: Object with latitude and longitude
              </li>
              <li>
                <strong>locationType</strong>: Type of location
              </li>
              <li>
                <strong>specialInstructions</strong>: Optional special
                instructions
              </li>
            </ul>

            <h4>Returns</h4>
            <ul>
              <li>
                <strong>locationId</strong>: ID of the created location
              </li>
            </ul>

            <h2>Authentication and Authorization</h2>
            <p>
              All API endpoints require authentication. The Convex backend
              automatically validates the user's session and permissions.
            </p>

            <h3>Error Handling</h3>
            <p>API endpoints throw errors in the following cases:</p>
            <ul>
              <li>
                <strong>Not authenticated</strong>: User is not logged in
              </li>
              <li>
                <strong>User not found</strong>: User record doesn't exist in
                the database
              </li>
              <li>
                <strong>Permission denied</strong>: User doesn't have permission
                for the operation
              </li>
              <li>
                <strong>Validation errors</strong>: Input data doesn't match the
                expected schema
              </li>
            </ul>
          </div>
        );

      case "data-model":
        return (
          <div className="prose max-w-none">
            <h1>Data Models</h1>
            <p>
              This documentation describes the core data models used in the
              logistics platform.
            </p>

            <h2>Users</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`// Users table - stores all user information across roles
users: defineTable({
  email: v.string(),
  name: v.string(),
  role: v.union(
    v.literal("admin"),
    v.literal("shipper"),
    v.literal("carrier"),
    v.literal("driver"),
  ),
  companyName: v.optional(v.string()),
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  profileImageUrl: v.optional(v.string()),
  isActive: v.boolean(),
  lastLogin: v.optional(v.number()), // Timestamp
  createdAt: v.number(), // Timestamp
  updatedAt: v.number(), // Timestamp
  // For carriers and drivers
  carrierId: v.optional(v.id("carriers")),
  // For drivers
  licenseNumber: v.optional(v.string()),
  licenseExpiry: v.optional(v.number()), // Timestamp
})`}
              </code>
            </pre>

            <h2>Loads</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`// Loads table - core entity for freight loads
loads: defineTable({
  // Basic load information
  referenceNumber: v.string(), // Customer-facing load ID
  shipperId: v.id("users"), // User who created the load
  status: v.union(
    v.literal("draft"),
    v.literal("posted"),
    v.literal("assigned"),
    v.literal("in_transit"),
    v.literal("delivered"),
    v.literal("completed"),
    v.literal("cancelled"),
  ),
  loadType: v.union(
    v.literal("ftl"), // Full Truckload
    v.literal("ltl"), // Less Than Truckload
    v.literal("partial"),
    v.literal("expedited"),
  ),
  equipmentType: v.string(), // e.g., "dry van", "reefer", "flatbed"
  equipmentRequirements: v.optional(v.array(v.string())), // Special requirements

  // Pickup information
  pickupLocationId: v.id("locations"),
  pickupWindowStart: v.number(), // Timestamp
  pickupWindowEnd: v.number(), // Timestamp
  actualPickupTime: v.optional(v.number()), // Timestamp
  pickupInstructions: v.optional(v.string()),

  // Delivery information
  deliveryLocationId: v.id("locations"),
  deliveryWindowStart: v.number(), // Timestamp
  deliveryWindowEnd: v.number(), // Timestamp
  actualDeliveryTime: v.optional(v.number()), // Timestamp
  deliveryInstructions: v.optional(v.string()),

  // Additional stops (if any)
  stops: v.optional(
    v.array(
      v.object({
        locationId: v.id("locations"),
        windowStart: v.number(), // Timestamp
        windowEnd: v.number(), // Timestamp
        actualArrivalTime: v.optional(v.number()), // Timestamp
        instructions: v.optional(v.string()),
        completed: v.boolean(),
      }),
    ),
  ),

  // Cargo information
  commodity: v.string(),
  weight: v.number(), // In pounds
  dimensions: v.optional(
    v.object({
      length: v.number(), // In inches
      width: v.number(), // In inches
      height: v.number(), // In inches
    }),
  ),
  palletCount: v.optional(v.number()),
  pieceCount: v.optional(v.number()),
  hazmat: v.boolean(),
  hazmatDetails: v.optional(v.string()),
  temperatureRequirements: v.optional(
    v.object({
      min: v.number(), // In Fahrenheit
      max: v.number(), // In Fahrenheit
    }),
  ),

  // Assignment information
  carrierId: v.optional(v.id("carriers")),
  driverId: v.optional(v.id("users")),
  vehicleId: v.optional(v.id("vehicles")),
  assignedDate: v.optional(v.number()), // Timestamp

  // Financial information
  rate: v.optional(v.number()), // In cents
  rateType: v.optional(
    v.union(v.literal("flat"), v.literal("per_mile"), v.literal("hourly")),
  ),
  estimatedDistance: v.optional(v.number()), // In miles
  estimatedDuration: v.optional(v.number()), // In minutes
  accessorials: v.optional(
    v.array(
      v.object({
        type: v.string(), // e.g., "detention", "layover", "lumper"
        amount: v.number(), // In cents
        notes: v.optional(v.string()),
      }),
    ),
  ),
  invoiceStatus: v.optional(
    v.union(
      v.literal("not_invoiced"),
      v.literal("invoiced"),
      v.literal("paid"),
    ),
  ),
  invoiceDate: v.optional(v.number()), // Timestamp
  paymentDate: v.optional(v.number()), // Timestamp

  // Tracking and updates
  trackingEnabled: v.boolean(),
  lastLocationUpdate: v.optional(
    v.object({
      latitude: v.number(),
      longitude: v.number(),
      timestamp: v.number(), // Timestamp
    }),
  ),
  estimatedTimeOfArrival: v.optional(v.number()), // Timestamp

  // Metadata
  tags: v.optional(v.array(v.string())),
  notes: v.optional(v.string()),
  createdAt: v.number(), // Timestamp
  updatedAt: v.number(), // Timestamp
})`}
              </code>
            </pre>

            <h2>Locations</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`// Locations table - pickup and delivery locations
locations: defineTable({
  name: v.string(),
  address: v.string(),
  city: v.string(),
  state: v.string(),
  zipCode: v.string(),
  country: v.string(),
  coordinates: v.object({
    latitude: v.number(),
    longitude: v.number(),
  }),
  contactName: v.optional(v.string()),
  contactPhone: v.optional(v.string()),
  contactEmail: v.optional(v.string()),
  locationType: v.union(
    v.literal("warehouse"),
    v.literal("distribution_center"),
    v.literal("port"),
    v.literal("terminal"),
    v.literal("customer_location"),
    v.literal("other"),
  ),
  operatingHours: v.optional(
    v.array(
      v.object({
        day: v.union(
          v.literal("monday"),
          v.literal("tuesday"),
          v.literal("wednesday"),
          v.literal("thursday"),
          v.literal("friday"),
          v.literal("saturday"),
          v.literal("sunday"),
        ),
        openTime: v.string(), // Format: "HH:MM"
        closeTime: v.string(), // Format: "HH:MM"
      }),
    ),
  ),
  specialInstructions: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(), // Timestamp
  updatedAt: v.number(), // Timestamp
})`}
              </code>
            </pre>

            <h2>Carriers</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`// Carriers table - companies that provide transportation services
carriers: defineTable({
  name: v.string(),
  dotNumber: v.string(),
  mcNumber: v.optional(v.string()),
  address: v.string(),
  city: v.string(),
  state: v.string(),
  zipCode: v.string(),
  country: v.string(),
  contactName: v.string(),
  contactEmail: v.string(),
  contactPhone: v.string(),
  fleetSize: v.number(),
  insuranceProvider: v.optional(v.string()),
  insurancePolicyNumber: v.optional(v.string()),
  insuranceExpiryDate: v.optional(v.number()), // Timestamp
  rating: v.optional(v.number()),
  isVerified: v.boolean(),
  isActive: v.boolean(),
  createdAt: v.number(), // Timestamp
  updatedAt: v.number(), // Timestamp
})`}
              </code>
            </pre>

            <h2>Vehicles</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`// Vehicles table - trucks and trailers
vehicles: defineTable({
  carrierId: v.id("carriers"),
  type: v.union(v.literal("truck"), v.literal("trailer")),
  make: v.string(),
  model: v.string(),
  year: v.number(),
  vin: v.string(),
  licensePlate: v.string(),
  state: v.string(),
  equipmentType: v.string(), // e.g., "dry van", "reefer", "flatbed"
  capacity: v.optional(v.number()),
  dimensions: v.optional(
    v.object({
      length: v.number(),
      width: v.number(),
      height: v.number(),
    }),
  ),
  currentDriverId: v.optional(v.id("users")),
  status: v.union(
    v.literal("active"),
    v.literal("maintenance"),
    v.literal("out_of_service"),
  ),
  lastMaintenanceDate: v.optional(v.number()), // Timestamp
  nextMaintenanceDate: v.optional(v.number()), // Timestamp
  currentLocation: v.optional(
    v.object({
      latitude: v.number(),
      longitude: v.number(),
      lastUpdated: v.number(), // Timestamp
    }),
  ),
  createdAt: v.number(), // Timestamp
  updatedAt: v.number(), // Timestamp
})`}
              </code>
            </pre>

            <h2>Documents</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`// Documents table - for storing load-related documents
documents: defineTable({
  loadId: v.id("loads"),
  userId: v.id("users"), // User who uploaded the document
  type: v.union(
    v.literal("bill_of_lading"),
    v.literal("proof_of_delivery"),
    v.literal("rate_confirmation"),
    v.literal("invoice"),
    v.literal("weight_ticket"),
    v.literal("lumper_receipt"),
    v.literal("other"),
  ),
  name: v.string(),
  fileUrl: v.string(),
  fileSize: v.number(), // In bytes
  mimeType: v.string(),
  uploadDate: v.number(), // Timestamp
  verificationStatus: v.optional(
    v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected"),
    ),
  ),
  verifiedBy: v.optional(v.id("users")),
  verificationDate: v.optional(v.number()), // Timestamp
  notes: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(), // Timestamp
  updatedAt: v.number(), // Timestamp
})`}
              </code>
            </pre>

            <h2>Relationships</h2>
            <p>The data model includes the following key relationships:</p>
            <ul>
              <li>Loads are created by shippers (users with role="shipper")</li>
              <li>Loads reference pickup and delivery locations</li>
              <li>Loads can be assigned to carriers and drivers</li>
              <li>Drivers belong to carriers</li>
              <li>Vehicles belong to carriers</li>
              <li>Documents are associated with loads</li>
            </ul>
          </div>
        );

      case "frontend":
        return (
          <div className="prose max-w-none">
            <h1>Frontend Integration Guide</h1>
            <p>
              This guide explains how to integrate with the frontend components
              for load creation and management.
            </p>

            <h2>Load Creation Components</h2>

            <h3>LoadCreationForm</h3>
            <p>
              The <code>LoadCreationForm</code> component provides a form for
              creating new loads.
            </p>

            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`import LoadCreationForm, { LoadFormData } from "@/components/admin/LoadCreationForm";

// For admin usage
<LoadCreationForm 
  isAdmin={true} 
  onSubmit={handleSubmit} 
/>

// For shipper usage
<LoadCreationForm 
  isAdmin={false} 
  onSubmit={handleSubmit} 
  initialData={{
    pickupLocation: "Chicago, IL",
    dropoffLocation: "Detroit, MI"
  }} 
/>`}
              </code>
            </pre>

            <h4>Props</h4>
            <ul>
              <li>
                <strong>isAdmin</strong>: Boolean indicating if the form is
                being used in admin context
              </li>
              <li>
                <strong>onSubmit</strong>: Function to handle form submission
              </li>
              <li>
                <strong>initialData</strong>: Optional initial values for the
                form
              </li>
            </ul>

            <h4>Form Data Structure</h4>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`interface LoadFormData {
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
}`}
              </code>
            </pre>

            <h3>LoadCreationConvex</h3>
            <p>
              The <code>LoadCreationConvex</code> component handles the
              integration with Convex backend.
            </p>

            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`// For shipper usage
import LoadCreationConvex from "@/components/shipper/LoadCreationConvex";

<LoadCreationConvex />

// For admin usage
import LoadCreation from "@/components/admin/LoadCreation";

<LoadCreation />`}
              </code>
            </pre>

            <p>These components handle:</p>
            <ul>
              <li>Form validation</li>
              <li>Creating locations in the database</li>
              <li>Creating the load in the database</li>
              <li>Error handling and user feedback</li>
              <li>Navigation after successful creation</li>
            </ul>

            <h2>Load Management Components</h2>

            <h3>LoadManagement</h3>
            <p>
              The <code>LoadManagement</code> component displays and manages
              loads.
            </p>

            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`// For shipper usage
import LoadManagement from "@/components/shipper/LoadManagement";

<LoadManagement />

// For admin usage
import LoadManagement from "@/components/admin/LoadManagement";

<LoadManagement />`}
              </code>
            </pre>

            <p>These components provide:</p>
            <ul>
              <li>Tabular display of loads</li>
              <li>Filtering and sorting</li>
              <li>Status updates</li>
              <li>Detail view</li>
              <li>Actions appropriate to the user role</li>
            </ul>

            <h2>Integration with Convex</h2>

            <h3>Using Convex Mutations</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`import { useMutation } from "convex/react";
import { api } from "@/lib/convex/_generated/api";

// In your component
const createLoad = useMutation(api.loads.createLoad);
const createLocation = useMutation(api.locations.createLocation);

// Example usage
const result = await createLoad({
  loadType: "ftl",
  equipmentType: "dry_van",
  pickupLocationId: locationId,
  // ... other required fields
});`}
              </code>
            </pre>

            <h3>Using Convex Queries</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`import { useQuery } from "convex/react";
import { api } from "@/lib/convex/_generated/api";

// In your component
const loads = useQuery(api.loads.getShipperLoads);

// Render the loads
if (loads === undefined) {
  return <div>Loading...</div>;
}

return (
  <div>
    {loads.map(load => (
      <div key={load._id}>{load.referenceNumber}</div>
    ))}
  </div>
);`}
              </code>
            </pre>

            <h2>Error Handling</h2>
            <p>
              Frontend components should handle the following error scenarios:
            </p>

            <h3>Authentication Errors</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`try {
  await createLoad(loadData);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes("Not authenticated")) {
      // Handle authentication error
      toast({
        title: "Authentication Error",
        description: "Please log in to continue",
        variant: "destructive"
      });
      // Redirect to login
      navigate("/login");
    }
  }
}`}
              </code>
            </pre>

            <h3>Validation Errors</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`// Client-side validation
const validateForm = (): boolean => {
  const newErrors: Partial<Record<keyof LoadFormData, string>> = {};

  if (!formData.pickupLocation)
    newErrors.pickupLocation = "Pickup location is required";
  if (!formData.dropoffLocation)
    newErrors.dropoffLocation = "Dropoff location is required";
  // ... other validations

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};`}
              </code>
            </pre>

            <h3>Server Errors</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                {`try {
  await createLoad(loadData);
} catch (error) {
  console.error("Error creating load:", error);
  toast({
    title: "Error",
    description: error instanceof Error ? error.message : "An unknown error occurred",
    variant: "destructive"
  });
}`}
              </code>
            </pre>
          </div>
        );

      case "workflows":
        return (
          <div className="prose max-w-none">
            <h1>Common Workflows</h1>
            <p>
              This documentation outlines the common workflows in the logistics
              platform.
            </p>

            <h2>Load Creation Workflow</h2>

            <h3>Shipper Creating a Load</h3>
            <ol>
              <li>
                <strong>Navigate to Load Creation</strong>
                <p>
                  Shipper navigates to the load creation page from the
                  dashboard.
                </p>
              </li>
              <li>
                <strong>Enter Load Details</strong>
                <p>
                  Shipper fills out the load creation form with the following
                  information:
                </p>
                <ul>
                  <li>Pickup location (city, state, ZIP)</li>
                  <li>Delivery location (city, state, ZIP)</li>
                  <li>Commodity type</li>
                  <li>Weight</li>
                  <li>Dimensions (optional)</li>
                  <li>Delivery date and time</li>
                  <li>Budget (optional)</li>
                  <li>Special instructions (optional)</li>
                </ul>
              </li>
              <li>
                <strong>Submit the Form</strong>
                <p>Shipper clicks the "Create Shipment" button.</p>
              </li>
              <li>
                <strong>Backend Processing</strong>
                <p>The system performs the following operations:</p>
                <ol>
                  <li>Validates the form data</li>
                  <li>Creates a pickup location record</li>
                  <li>Creates a delivery location record</li>
                  <li>
                    Creates a load record with references to the locations
                  </li>
                  <li>Generates a unique reference number for the load</li>
                  <li>Creates an event record for the load creation</li>
                </ol>
              </li>
              <li>
                <strong>Confirmation</strong>
                <p>
                  Shipper receives a success message with the load reference
                  number.
                </p>
              </li>
              <li>
                <strong>Redirection</strong>
                <p>
                  Shipper is redirected to the loads management page where they
                  can see the newly created load.
                </p>
              </li>
            </ol>

            <h3>Admin Creating a Load</h3>
            <p>
              The workflow is similar to the shipper workflow, with the
              following differences:
            </p>
            <ul>
              <li>Admin uses the admin load creation interface</li>
              <li>Admin has additional options for carrier assignment</li>
              <li>Admin is redirected to the admin loads management page</li>
            </ul>

            <h2>Load Management Workflow</h2>

            <h3>Viewing Loads</h3>
            <ol>
              <li>
                <strong>Navigate to Loads Management</strong>
                <p>
                  User navigates to the loads management page from the
                  dashboard.
                </p>
              </li>
              <li>
                <strong>View Load List</strong>
                <p>User sees a table of loads with key information:</p>
                <ul>
                  <li>Reference number</li>
                  <li>Status</li>
                  <li>Pickup location</li>
                  <li>Delivery location</li>
                  <li>Delivery date</li>
                  <li>Carrier (if assigned)</li>
                </ul>
              </li>
              <li>
                <strong>Filter and Sort</strong>
                <p>
                  User can filter the loads by status, date range, or search by
                  reference number.
                </p>
              </li>
              <li>
                <strong>View Load Details</strong>
                <p>User clicks on a load to view its details.</p>
              </li>
            </ol>

            <h3>Updating Load Status</h3>
            <ol>
              <li>
                <strong>Select a Load</strong>
                <p>User selects a load from the loads management page.</p>
              </li>
              <li>
                <strong>Change Status</strong>
                <p>
                  User changes the status of the load (e.g., from "draft" to
                  "posted").
                </p>
              </li>
              <li>
                <strong>Backend Processing</strong>
                <p>
                  The system updates the load status and creates an event record
                  for the status change.
                </p>
              </li>
              <li>
                <strong>Confirmation</strong>
                <p>
                  User receives a success message confirming the status change.
                </p>
              </li>
            </ol>

            <h2>Carrier Assignment Workflow</h2>

            <h3>Admin Assigning a Carrier</h3>
            <ol>
              <li>
                <strong>Select a Load</strong>
                <p>Admin selects a load from the loads management page.</p>
              </li>
              <li>
                <strong>Assign Carrier</strong>
                <p>
                  Admin selects a carrier from the carrier list and assigns it
                  to the load.
                </p>
              </li>
              <li>
                <strong>Backend Processing</strong>
                <p>
                  The system updates the load with the carrier ID, changes the
                  status to "assigned", and creates an event record for the
                  assignment.
                </p>
              </li>
              <li>
                <strong>Notification</strong>
                <p>
                  The system creates a notification for the carrier about the
                  new assignment.
                </p>
              </li>
              <li>
                <strong>Confirmation</strong>
                <p>
                  Admin receives a success message confirming the carrier
                  assignment.
                </p>
              </li>
            </ol>

            <h2>Document Management Workflow</h2>

            <h3>Uploading a Document</h3>
            <ol>
              <li>
                <strong>Select a Load</strong>
                <p>User selects a load from the loads management page.</p>
              </li>
              <li>
                <strong>Navigate to Documents</strong>
                <p>
                  User navigates to the documents tab for the selected load.
                </p>
              </li>
              <li>
                <strong>Upload Document</strong>
                <p>
                  User selects a document type, provides a name, and uploads a
                  file.
                </p>
              </li>
              <li>
                <strong>Backend Processing</strong>
                <p>
                  The system uploads the file to storage, creates a document
                  record with a reference to the load, and creates an event
                  record for the document upload.
                </p>
              </li>
              <li>
                <strong>Confirmation</strong>
                <p>
                  User receives a success message confirming the document
                  upload.
                </p>
              </li>
            </ol>

            <h3>Verifying a Document</h3>
            <ol>
              <li>
                <strong>Select a Document</strong>
                <p>Admin selects a document from the documents list.</p>
              </li>
              <li>
                <strong>Verify Document</strong>
                <p>Admin reviews the document and marks it as verified.</p>
              </li>
              <li>
                <strong>Backend Processing</strong>
                <p>
                  The system updates the document verification status, sets the
                  verification date and verifier, and creates an event record
                  for the verification.
                </p>
              </li>
              <li>
                <strong>Notification</strong>
                <p>
                  The system creates a notification for the document owner about
                  the verification.
                </p>
              </li>
              <li>
                <strong>Confirmation</strong>
                <p>
                  Admin receives a success message confirming the document
                  verification.
                </p>
              </li>
            </ol>
          </div>
        );

      case "troubleshooting":
        return (
          <div className="prose max-w-none">
            <h1>Troubleshooting Guide</h1>
            <p>
              This guide provides solutions for common issues encountered in the
              logistics platform.
            </p>

            <h2>Authentication Issues</h2>

            <h3>"Not authenticated" Error</h3>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="font-bold text-red-700">Error: Not authenticated</p>
              <p className="text-red-700">
                This error occurs when trying to access a protected endpoint
                without a valid session.
              </p>
            </div>

            <h4>Possible Causes</h4>
            <ul>
              <li>User session has expired</li>
              <li>User is not logged in</li>
              <li>Authentication token is invalid</li>
            </ul>

            <h4>Solutions</h4>
            <ol>
              <li>
                <strong>Check Authentication State</strong>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>
                    {`// Check if user is authenticated
const { isAuthenticated, user } = useAuth();

if (!isAuthenticated) {
  // Redirect to login
  navigate("/login");
  return null;
}`}
                  </code>
                </pre>
              </li>
              <li>
                <strong>Refresh Authentication Token</strong>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>
                    {`// Refresh the authentication token
const { refreshSession } = useAuth();

try {
  await refreshSession();
  // Retry the operation
} catch (error) {
  // Handle refresh failure
  navigate("/login");
}`}
                  </code>
                </pre>
              </li>
              <li>
                <strong>Clear Local Storage and Re-login</strong>
                <p>
                  If the issue persists, advise the user to clear their
                  browser's local storage and log in again.
                </p>
              </li>
            </ol>

            <h3>"User not found" Error</h3>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="font-bold text-red-700">Error: User not found</p>
              <p className="text-red-700">
                This error occurs when the authenticated user doesn't have a
                corresponding record in the database.
              </p>
            </div>

            <h4>Possible Causes</h4>
            <ul>
              <li>User record was deleted</li>
              <li>
                User was created in authentication system but not in the
                database
              </li>
              <li>Database synchronization issue</li>
            </ul>

            <h4>Solutions</h4>
            <ol>
              <li>
                <strong>Check User Record</strong>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>
                    {`// Check if user exists in database
const user = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", email))
  .first();

if (!user) {
  // Create user record
  await ctx.db.insert("users", {
    email,
    name: "New User",
    role: "shipper",
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}`}
                  </code>
                </pre>
              </li>
              <li>
                <strong>Contact Support</strong>
                <p>
                  If the issue persists, advise the user to contact support for
                  account recovery.
                </p>
              </li>
            </ol>

            <h2>Load Creation Issues</h2>

            <h3>Location Creation Failure</h3>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="font-bold text-red-700">
                Error: Failed to create location
              </p>
              <p className="text-red-700">
                This error occurs when the system fails to create a location
                record.
              </p>
            </div>

            <h4>Possible Causes</h4>
            <ul>
              <li>Invalid address format</li>
              <li>Missing required fields</li>
              <li>Database connection issue</li>
            </ul>

            <h4>Solutions</h4>
            <ol>
              <li>
                <strong>Validate Address Format</strong>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>
                    {`// Validate address format
const addressParts = address.split(",");
if (addressParts.length < 2) {
  throw new Error(
    "Address should be in format 'City, State, ZIP' (e.g. 'Chicago, IL, 60601')"
  );
}`}
                  </code>
                </pre>
              </li>
              <li>
                <strong>Check Required Fields</strong>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>
                    {`// Check required fields
if (!city) {
  throw new Error("City cannot be empty");
}

if (!state) {
  throw new Error("State cannot be empty");
}`}
                  </code>
                </pre>
              </li>
              <li>
                <strong>Retry with Error Handling</strong>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>
                    {`// Retry with error handling
let retries = 3;
while (retries > 0) {
  try {
    const result = await createLocation(locationData);
    return result;
  } catch (error) {
    retries--;
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}`}
                  </code>
                </pre>
              </li>
            </ol>

            <h3>Load Creation Validation Errors</h3>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="font-bold text-red-700">Error: Validation Error</p>
              <p className="text-red-700">
                This error occurs when the load data fails validation.
              </p>
            </div>

            <h4>Common Validation Errors</h4>
            <ul>
              <li>"Weight must be a number"</li>
              <li>"Delivery date must be in the future"</li>
              <li>"Pickup location is required"</li>
            </ul>

            <h4>Solutions</h4>
            <ol>
              <li>
                <strong>Implement Client-Side Validation</strong>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>
                    {`// Validate weight is a number
if (formData.weight && isNaN(Number(formData.weight))) {
  newErrors.weight = "Weight must be a number";
}

// Validate delivery date is in the future
if (formData.deliveryDate) {
  const deliveryDateTime = new Date(
    \`\${formData.deliveryDate}T\${formData.deliveryTime || "00:00"}:00\`,
  );
  if (deliveryDateTime <= new Date()) {
    newErrors.deliveryDate = "Delivery date must be in the future";
  }
}`}
                  </code>
                </pre>
              </li>
              <li>
                <strong>Display Validation Errors</strong>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>
                    {`// Display validation errors
{errors.weight && (
  <p className="text-sm text-red-500">{errors.weight}</p>
)}`}
                  </code>
                </pre>
              </li>
              <li>
                <strong>Implement Server-Side Validation</strong>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>
                    {`// Server-side validation
if (args.weight <= 0) {
  throw new Error("Weight must be greater than zero");
}

if (args.pickupWindowStart >= args.pickupWindowEnd) {
  throw new Error("Pickup window start must be before pickup window end");
}`}
                  </code>
                </pre>
              </li>
            </ol>

            <h2>Data Fetching Issues</h2>

            <h3>Loads Not Loading</h3>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="font-bold text-red-700">
                Issue: Loads are not loading or displaying
              </p>
              <p className="text-red-700">
                This issue occurs when the loads data fails to load or display
                properly.
              </p>
            </div>

            <h4>Possible Causes</h4>
            <ul>
              <li>Query error</li>
              <li>Authentication issue</li>
              <li>Network connectivity problem</li>
              <li>Data transformation error</li>
            </ul>

            <h4>Solutions</h4>
            <ol>
              <li>
                <strong>Check Query Status</strong>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>
                    {`// Check query status
const loads = useQuery(api.loads.getShipperLoads);

if (loads === undefined) {
  return <div>Loading...</div>;
}

if (loads === null) {
  return <div>Error loading loads. Please try again.</div>;
}`}
                  </code>
                </pre>
              </li>
              <li>
                <strong>Implement Error Boundary</strong>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>
                    {`// Implement error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error loading component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }

    return this.props.children;
  }
}`}
                  </code>
                </pre>
              </li>
              <li>
                <strong>Add Debugging</strong>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>
                    {`// Add debugging
console.log("Loads data:", loads);

// In the query function
export const getShipperLoads = query({
  handler: async (ctx) => {
    try {
      // Query implementation
      return result;
    } catch (error) {
      console.error("Error in getShipperLoads:", error);
      throw error;
    }
  },
});`}
                  </code>
                </pre>
              </li>
            </ol>

            <h2>Performance Issues</h2>

            <h3>Slow Load Times</h3>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="font-bold text-yellow-700">
                Issue: Slow load times for data
              </p>
              <p className="text-yellow-700">
                This issue occurs when data takes a long time to load or
                display.
              </p>
            </div>

            <h4>Possible Causes</h4>
            <ul>
              <li>Inefficient queries</li>
              <li>Large data sets</li>
              <li>Missing indexes</li>
              <li>Network latency</li>
            </ul>

            <h4>Solutions</h4>
            <ol>
              <li>
                <strong>Optimize Queries</strong>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>
                    {`// Use pagination
export const getShipperLoads = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("loads")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    let query = ctx.db
      .query("loads")
      .withIndex("by_shipper", (q) => q.eq("shipperId", shipperId))
      .order("desc")
      .take(limit);
      
    if (args.cursor) {
      query = query.cursor(args.cursor);
    }
    
    return query;
  },
});`}
                  </code>
                </pre>
              </li>
              <li>
                <strong>Implement Virtualization</strong>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>
                    {`// Use virtualized list for large data sets
import { FixedSizeList } from 'react-window';

const LoadList = ({ loads }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <LoadItem load={loads[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={loads.length}
      itemSize={80}
    >
      {Row}
    </FixedSizeList>
  );
};`}
                  </code>
                </pre>
              </li>
              <li>
                <strong>Add Loading States</strong>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>
                    {`// Add loading states
const LoadsTable = () => {
  const loads = useQuery(api.loads.getShipperLoads);
  
  return (
    <div>
      {loads === undefined ? (
        <LoadingSkeleton />
      ) : (
        <Table data={loads} />
      )}
    </div>
  );
};`}
                  </code>
                </pre>
              </li>
            </ol>
          </div>
        );

      default:
        return (
          <div className="prose max-w-none">
            <h1>Welcome to the Documentation Center</h1>
            <p>Select a category from the sidebar to view documentation.</p>

            <h2>Available Documentation Categories</h2>
            <ul>
              <li>
                <strong>API Reference</strong> - Detailed information about
                backend API endpoints
              </li>
              <li>
                <strong>Data Models</strong> - Explanation of database schema
                and data structures
              </li>
              <li>
                <strong>Frontend Integration</strong> - Guides for integrating
                with frontend components
              </li>
              <li>
                <strong>Common Workflows</strong> - Step-by-step guides for
                common operations
              </li>
              <li>
                <strong>Troubleshooting</strong> - Solutions for common issues
                and errors
              </li>
            </ul>

            <p>
              If you can't find what you're looking for, please contact the
              development team.
            </p>
          </div>
        );
    }
  };

  return <div className="prose max-w-none">{getContent()}</div>;
}
