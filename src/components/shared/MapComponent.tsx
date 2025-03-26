import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  initMapbox,
} from "@/lib/mapbox";

// Set Mapbox access token
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string;
    longitude: number;
    latitude: number;
    color?: string;
    popupContent?: React.ReactNode | string;
  }>;
  routes?: Array<{
    id: string;
    coordinates: Array<[number, number]>;
    color?: string;
    width?: number;
    dashArray?: Array<number>;
  }>;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
  interactive?: boolean;
  style?: React.CSSProperties;
  className?: string;
  userType?: string; // Added to handle different user types
}

const MapComponent: React.FC<MapComponentProps> = ({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  markers = [],
  routes = [],
  onMapClick,
  interactive = true,
  style = { width: "100%", height: "400px" },
  className = "",
  userType,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const routeRefs = useRef<{ [key: string]: string }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || !mapContainer.current) return;

    // Ensure mapboxgl is available
    if (!mapboxgl) {
      setMapError(
        "Mapbox GL JS is not available. Please check your internet connection.",
      );
      return;
    }

    // Ensure access token is set
    if (!mapboxgl.accessToken) {
      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    }

    try {
      // Initialize the map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAPBOX_STYLE,
        center: center,
        zoom: zoom,
        interactive: interactive,
        attributionControl: true,
        failIfMajorPerformanceCaveat: false, // Allow map to render in lower performance environments
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.current.on("load", () => {
        setMapLoaded(true);
      });

      if (onMapClick) {
        map.current.on("click", (e) => {
          onMapClick(e.lngLat);
        });
      }

      // Handle errors
      map.current.on("error", (e) => {
        console.error("Mapbox error:", e.error);
        setMapError("Failed to load map. Please try again later.");
      });

      return () => {
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError("Failed to initialize map. Please try again later.");
    }
  }, []);

  // Update center and zoom when props change
  useEffect(() => {
    if (map.current && mapLoaded) {
      map.current.flyTo({
        center: center,
        zoom: zoom,
        essential: true,
      });
    }
  }, [center, zoom, mapLoaded]);

  // Handle markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove old markers
    Object.values(markerRefs.current).forEach((marker) => marker.remove());
    markerRefs.current = {};

    // Add new markers
    markers.forEach((marker) => {
      const el = document.createElement("div");
      el.className = "marker";
      el.style.backgroundColor = marker.color || "#3FB1CE";
      el.style.width = "24px";
      el.style.height = "24px";
      el.style.borderRadius = "50%";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 0 10px rgba(0,0,0,0.4)";

      const mapMarker = new mapboxgl.Marker(el)
        .setLngLat([marker.longitude, marker.latitude])
        .addTo(map.current!);

      if (marker.popupContent) {
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          typeof marker.popupContent === "string"
            ? marker.popupContent
            : '<div id="popup-' + marker.id + '"></div>',
        );

        mapMarker.setPopup(popup);
      }

      markerRefs.current[marker.id] = mapMarker;
    });
  }, [markers, mapLoaded]);

  // Handle routes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove old routes
    Object.entries(routeRefs.current).forEach(([id, sourceId]) => {
      if (map.current?.getSource(sourceId)) {
        map.current.removeLayer(id + "-layer");
        map.current.removeSource(sourceId);
      }
    });
    routeRefs.current = {};

    // Add new routes
    routes.forEach((route) => {
      const sourceId = "route-source-" + route.id;
      routeRefs.current[route.id] = sourceId;

      map.current?.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: route.coordinates,
          },
        },
      });

      map.current?.addLayer({
        id: route.id + "-layer",
        type: "line",
        source: sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": route.color || "#3887be",
          "line-width": route.width || 5,
          "line-opacity": 0.75,
          "line-dasharray": route.dashArray,
        },
      });
    });
  }, [routes, mapLoaded]);

  if (mapError) {
    return (
      <div
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0f0f0",
          color: "#ff3333",
          padding: "20px",
          borderRadius: "4px",
        }}
        className={className}
      >
        {mapError}
      </div>
    );
  }

  return <div ref={mapContainer} style={style} className={className} />;
};

export default MapComponent;
