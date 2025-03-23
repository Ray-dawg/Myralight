// Load types
export interface Load {
  id: string;
  referenceNumber: string;
  shipperId: string;
  status: LoadStatus;
  loadType: LoadType;
  equipmentType: string;
  pickupLocationId: string;
  pickupWindowStart: number;
  pickupWindowEnd: number;
  actualPickupTime?: number;
  pickupInstructions?: string;
  deliveryLocationId: string;
  deliveryWindowStart: number;
  deliveryWindowEnd: number;
  actualDeliveryTime?: number;
  deliveryInstructions?: string;
  commodity: string;
  weight: number;
  dimensions?: Dimensions;
  hazmat: boolean;
  hazmatDetails?: string;
  carrierId?: string;
  driverId?: string;
  vehicleId?: string;
  assignedDate?: number;
  rate?: number;
  rateType?: RateType;
  estimatedDistance?: number;
  estimatedDuration?: number;
  estimatedTimeOfArrival?: number;
  lastLocationUpdate?: LocationUpdate;
  trackingEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export type LoadStatus = 
  | 'draft'
  | 'posted'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type LoadType = 
  | 'ftl'
  | 'ltl'
  | 'partial'
  | 'expedited';

export type RateType = 
  | 'flat'
  | 'per_mile'
  | 'hourly';

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: number;
}

// Location types
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  locationType: LocationType;
  specialInstructions?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export type LocationType = 
  | 'warehouse'
  | 'distribution_center'
  | 'port'
  | 'terminal'
  | 'customer_location'
  | 'other';

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyName?: string;
  phone?: string;
  address?: string;
  profileImageUrl?: string;
  carrierId?: string;
  licenseNumber?: string;
  licenseExpiry?: number;
  isActive: boolean;
  lastLogin?: number;
  createdAt: number;
  updatedAt: number;
}

export type UserRole = 
  | 'admin'
  | 'shipper'
  | 'carrier'
  | 'driver';

// Carrier types
export interface Carrier {
  id: string;
  name: string;
  dotNumber: string;
  mcNumber?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  fleetSize: number;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: number;
  rating?: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Vehicle types
export interface Vehicle {
  id: string;
  carrierId: string;
  type: 'truck' | 'trailer';
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  state: string;
  equipmentType: string;
  capacity?: number;
  dimensions?: Dimensions;
  currentDriverId?: string;
  status: 'active' | 'maintenance' | 'out_of_service';
  lastMaintenanceDate?: number;
  nextMaintenanceDate?: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: number;
  };
  createdAt: number;
  updatedAt: number;
}

// Event types
export interface Event {
  id: string;
  loadId: string;
  userId: string;
  eventType: string;
  previousValue?: any;
  newValue: any;
  timestamp: number;
  notes?: string;
  metadata?: any;
  createdAt: number;
}

// Document types
export interface Document {
  id: string;
  loadId: string;
  userId: string;
  type: DocumentType;
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadDate: number;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verificationDate?: number;
  notes?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export type DocumentType = 
  | 'bill_of_lading'
  | 'proof_of_delivery'
  | 'rate_confirmation'
  | 'invoice'
  | 'weight_ticket'
  | 'lumper_receipt'
  | 'other';

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: any;
  relatedType?: string;
  isRead: boolean;
  isActionRequired: boolean;
  actionUrl?: string;
  createdAt: number;
}

// API request/response types
export interface LoadRequestDto {
  driver_id: string;
  current_lat: number;
  current_lng: number;
  max_distance?: number;
}

export interface LoadResponseDto {
  loads: {
    id: string;
    pickup_location: string;
    distance: number;
  }[];
}

export interface LoadStatusUpdateDto {
