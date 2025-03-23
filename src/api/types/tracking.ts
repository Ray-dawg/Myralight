export interface GeofenceConfig {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  driverId: string;
  loadId: string;
  type: "pickup" | "delivery";
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: string;
  accuracy?: number;
}

export interface TrackingSession {
  driverId: string;
  loadId: string;
  pickupGeofenceId?: string;
  deliveryGeofenceId?: string;
  active: boolean;
  lastUpdate?: LocationUpdate;
  updateInterval: number; // in milliseconds
}

export interface GeofenceEvent {
  driverId: string;
  loadId: string;
  geofenceId: string;
  geofenceName: string;
  eventType: "enter" | "exit";
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export interface TrackingRequest {
  driver_id: string;
  load_id: string;
  update_interval?: number; // in milliseconds
}

export interface LocationUpdateRequest {
  driver_id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}
