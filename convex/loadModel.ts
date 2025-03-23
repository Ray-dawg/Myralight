// Sample document structures showing how entities relate

// Example User (Shipper)
export const sampleShipper = {
  _id: "users:abc123", // Convex auto-generated ID
  email: "john@acmeshipping.com",
  name: "John Smith",
  role: "shipper",
  companyName: "Acme Shipping Inc.",
  phone: "555-123-4567",
  address: "123 Main St, Chicago, IL 60601",
  profileImageUrl: "https://example.com/profiles/john.jpg",
  isActive: true,
  lastLogin: 1686523354000, // Unix timestamp in ms
  createdAt: 1680523354000,
  updatedAt: 1686523354000,
};

// Example User (Carrier Admin)
export const sampleCarrierAdmin = {
  _id: "users:def456",
  email: "sarah@fastfreight.com",
  name: "Sarah Johnson",
  role: "carrier",
  companyName: "Fast Freight Logistics",
  phone: "555-987-6543",
  address: "456 Transport Ave, Dallas, TX 75201",
  profileImageUrl: "https://example.com/profiles/sarah.jpg",
  isActive: true,
  carrierId: "carriers:xyz789", // Reference to carrier company
  lastLogin: 1686423354000,
  createdAt: 1680423354000,
  updatedAt: 1686423354000,
};

// Example User (Driver)
export const sampleDriver = {
  _id: "users:ghi789",
  email: "mike@fastfreight.com",
  name: "Mike Rodriguez",
  role: "driver",
  phone: "555-456-7890",
  profileImageUrl: "https://example.com/profiles/mike.jpg",
  isActive: true,
  carrierId: "carriers:xyz789", // Reference to carrier company
  licenseNumber: "DL123456789",
  licenseExpiry: 1738523354000, // License expiry date
  lastLogin: 1686323354000,
  createdAt: 1680323354000,
  updatedAt: 1686323354000,
};

// Example Carrier
export const sampleCarrier = {
  _id: "carriers:xyz789",
  name: "Fast Freight Logistics",
  dotNumber: "12345678",
  mcNumber: "MC987654",
  address: "456 Transport Ave",
  city: "Dallas",
  state: "TX",
  zipCode: "75201",
  country: "USA",
  contactName: "Sarah Johnson",
  contactEmail: "sarah@fastfreight.com",
  contactPhone: "555-987-6543",
  fleetSize: 25,
  insuranceProvider: "Trucking Insurance Co",
  insurancePolicyNumber: "TIC-123456",
  insuranceExpiryDate: 1717523354000,
  rating: 4.8,
  isVerified: true,
  isActive: true,
  createdAt: 1680423354000,
  updatedAt: 1686423354000,
};

// Example Vehicle
export const sampleVehicle = {
  _id: "vehicles:jkl012",
  carrierId: "carriers:xyz789",
  type: "truck",
  make: "Peterbilt",
  model: "579",
  year: 2022,
  vin: "1NPXL40X9ND123456",
  licensePlate: "TX12345",
  state: "TX",
  equipmentType: "dry van",
  capacity: 45000, // In pounds
  dimensions: {
    length: 53, // In feet
    width: 8.5, // In feet
    height: 13.5, // In feet
  },
  currentDriverId: "users:ghi789",
  status: "active",
  lastMaintenanceDate: 1683523354000,
  nextMaintenanceDate: 1691523354000,
  currentLocation: {
    latitude: 32.7767,
    longitude: -96.797,
    lastUpdated: 1686523354000,
  },
  createdAt: 1680423354000,
  updatedAt: 1686423354000,
};

// Example Location (Pickup)
export const samplePickupLocation = {
  _id: "locations:mno345",
  name: "Chicago Distribution Center",
  address: "789 Warehouse Blvd",
  city: "Chicago",
  state: "IL",
  zipCode: "60607",
  country: "USA",
  coordinates: {
    latitude: 41.8781,
    longitude: -87.6298,
  },
  contactName: "Warehouse Manager",
  contactPhone: "555-111-2222",
  contactEmail: "warehouse@acmeshipping.com",
  locationType: "warehouse",
  operatingHours: [
    { day: "monday", openTime: "08:00", closeTime: "17:00" },
    { day: "tuesday", openTime: "08:00", closeTime: "17:00" },
    { day: "wednesday", openTime: "08:00", closeTime: "17:00" },
    { day: "thursday", openTime: "08:00", closeTime: "17:00" },
    { day: "friday", openTime: "08:00", closeTime: "17:00" },
  ],
  specialInstructions: "Check in at security gate. Hard hats required.",
  isActive: true,
  createdAt: 1680423354000,
  updatedAt: 1686423354000,
};

// Example Location (Delivery)
export const sampleDeliveryLocation = {
  _id: "locations:pqr678",
  name: "Dallas Retail Center",
  address: "321 Retail Row",
  city: "Dallas",
  state: "TX",
  zipCode: "75202",
  country: "USA",
  coordinates: {
    latitude: 32.7767,
    longitude: -96.797,
  },
  contactName: "Receiving Manager",
  contactPhone: "555-333-4444",
  contactEmail: "receiving@dallasretail.com",
  locationType: "customer_location",
  operatingHours: [
    { day: "monday", openTime: "09:00", closeTime: "18:00" },
    { day: "tuesday", openTime: "09:00", closeTime: "18:00" },
    { day: "wednesday", openTime: "09:00", closeTime: "18:00" },
    { day: "thursday", openTime: "09:00", closeTime: "18:00" },
    { day: "friday", openTime: "09:00", closeTime: "18:00" },
  ],
  specialInstructions: "Delivery dock is on the north side of the building.",
  isActive: true,
  createdAt: 1680423354000,
  updatedAt: 1686423354000,
};

// Example Load
export const sampleLoad = {
  _id: "loads:stu901",
  referenceNumber: "LOAD-12345",
  shipperId: "users:abc123",
  status: "in_transit",
  loadType: "ftl",
  equipmentType: "dry van",
  equipmentRequirements: ["liftgate", "straps"],

  // Pickup information
  pickupLocationId: "locations:mno345",
  pickupWindowStart: 1686523354000, // June 11, 2023
  pickupWindowEnd: 1686609754000, // June 12, 2023
  actualPickupTime: 1686553354000, // Actual pickup time
  pickupInstructions: "Call 30 minutes before arrival",

  // Delivery information
  deliveryLocationId: "locations:pqr678",
  deliveryWindowStart: 1686696154000, // June 13, 2023
  deliveryWindowEnd: 1686782554000, // June 14, 2023
  deliveryInstructions: "Receiving hours 9 AM - 5 PM",

  // Cargo information
  commodity: "General Merchandise",
  weight: 35000, // In pounds
  dimensions: {
    length: 48, // In inches
    width: 40, // In inches
    height: 48, // In inches
  },
  palletCount: 24,
  pieceCount: 480,
  hazmat: false,

  // Assignment information
  carrierId: "carriers:xyz789",
  driverId: "users:ghi789",
  vehicleId: "vehicles:jkl012",
  assignedDate: 1686323354000,

  // Financial information
  rate: 250000, // $2,500.00 in cents
  rateType: "flat",
  estimatedDistance: 967, // In miles
  estimatedDuration: 960, // 16 hours in minutes
  accessorials: [
    {
      type: "detention",
      amount: 7500, // $75.00 in cents
      notes: "Waiting time at pickup",
    },
  ],
  invoiceStatus: "not_invoiced",

  // Tracking and updates
  trackingEnabled: true,
  lastLocationUpdate: {
    latitude: 36.1699,
    longitude: -94.5783,
    timestamp: 1686553354000,
  },
  estimatedTimeOfArrival: 1686696154000,

  // Metadata
  tags: ["retail", "high-priority"],
  notes: "Customer requires notification before delivery",
  createdAt: 1686123354000,
  updatedAt: 1686553354000,
};

// Example Document
export const sampleDocument = {
  _id: "documents:vwx234",
  loadId: "loads:stu901",
  userId: "users:ghi789", // Uploaded by driver
  type: "bill_of_lading",
  name: "BOL_LOAD-12345.pdf",
  fileUrl: "https://storage.example.com/documents/BOL_LOAD-12345.pdf",
  fileSize: 1258000, // In bytes
  mimeType: "application/pdf",
  uploadDate: 1686553354000,
  verificationStatus: "verified",
  verifiedBy: "users:def456", // Verified by carrier admin
  verificationDate: 1686563354000,
  isActive: true,
  createdAt: 1686553354000,
  updatedAt: 1686563354000,
};

// Example Event
export const sampleEvent = {
  _id: "events:yza567",
  loadId: "loads:stu901",
  userId: "users:ghi789", // Driver
  eventType: "status_change",
  previousValue: "assigned",
  newValue: "in_transit",
  timestamp: 1686553354000,
  notes: "Driver has started the trip",
  createdAt: 1686553354000,
};

// Example Bid
export const sampleBid = {
  _id: "bids:bcd890",
  loadId: "loads:stu901",
  carrierId: "carriers:xyz789",
  userId: "users:def456", // Carrier admin who submitted the bid
  amount: 245000, // $2,450.00 in cents
  notes: "Available for pickup anytime on June 11",
  status: "accepted",
  expiresAt: 1686409754000,
  responseDate: 1686323354000,
  responseNotes: "Bid accepted",
  createdAt: 1686223354000,
  updatedAt: 1686323354000,
};

// Example Rating
export const sampleRating = {
  _id: "ratings:efg123",
  loadId: "loads:stu901",
  fromUserId: "users:abc123", // Shipper
  toUserId: "users:ghi789", // Driver
  toCarrierId: "carriers:xyz789", // Carrier company
  rating: 5,
  comments: "Excellent service, on-time delivery",
  categories: {
    communication: 5,
    onTimePickup: 5,
    onTimeDelivery: 5,
    loadCondition: 5,
    documentation: 4,
    professionalism: 5,
  },
  isPublic: true,
  createdAt: 1686782554000,
  updatedAt: 1686782554000,
};

// Example Notification
export const sampleNotification = {
  _id: "notifications:hij456",
  userId: "users:abc123", // Shipper
  type: "load_delivered",
  title: "Load Delivered",
  message: "Your load LOAD-12345 has been delivered successfully.",
  relatedId: "loads:stu901",
  relatedType: "load",
  isRead: false,
  isActionRequired: true,
  actionUrl: "/loads/stu901/rate",
  createdAt: 1686782554000,
};
